import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import { uploadToBlob, deleteFromBlob } from '../services/azure.service.js';
import { notifyAllMembers, NOTIF_TYPES } from '../services/notification.service.js';

// Helper: build pagination meta and LIMIT/OFFSET
const paginate = (query: any, total: number) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    return { page, limit, offset, totalPages };
};

// GET /api/events  — public: only published; admin passes ?all=true for all
export const getEvents = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { category, upcoming, tab } = req.query;
        const showAll = (req.query.all as string) === 'true';

    let countSql = `SELECT COUNT(*) AS total FROM events WHERE ${showAll ? '1=1' : 'is_published = 1'}`;
        let dataSql = `SELECT * FROM events WHERE ${showAll ? '1=1' : 'is_published = 1'}`;
        const params: any[] = [];

        if (category) {
            const clause = ' AND event_category = ?';
            countSql += clause;
            dataSql += clause;
            params.push(category);
        }

        if (tab) {
            const clause = ' AND is_upcoming = ?';
            countSql += clause;
            dataSql += clause;
            params.push(tab === 'upcoming' ? 1 : 0);
        } else if (upcoming !== undefined) {
            const clause = ' AND is_upcoming = ?';
            countSql += clause;
            dataSql += clause;
            params.push(upcoming === 'true' || upcoming === '1' ? 1 : 0);
        }

        const [[{ total }]] = await (pool.query as any)(countSql, params);
        const { page, limit, offset, totalPages } = paginate(req.query, total);

        dataSql += ' ORDER BY date ASC LIMIT ? OFFSET ?';
        const [rows] = await (pool.query as any)(dataSql, [...params, limit, offset]);

        res.json({ success: true, data: rows, total, page, limit, totalPages });
    } catch (err: any) {
        next(err);
    }
};

// GET /api/events/:id
export const getEventById = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)('SELECT * FROM events WHERE id = ?', [String(req.params.id)]);
        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'Event not found.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};

// POST /api/events  (founding_member or council_member)
export const createEvent = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, date, location, description, link, event_category, is_upcoming, recording_url, banner_image, is_published } = req.body;
        const isCouncilMember = (req.user as any).role === 'council_member';

        // council_member always creates as draft — founding_member can publish directly
        const publishedValue = isCouncilMember ? false : (is_published !== undefined ? Boolean(is_published) : true);

        const [result] = await (pool.query as any)(
            `INSERT INTO events
               (title, date, location, description, link, event_category, is_upcoming, recording_url, banner_image, is_published, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                date,
                location ? location.trim() : null,
                description ? description.trim() : null,
                link ? link.trim() : null,
                event_category,
                is_upcoming !== undefined ? Boolean(is_upcoming) : true,
                recording_url ? recording_url.trim() : null,
                banner_image ? banner_image.trim() : null,
                publishedValue,
                (req.user as any).id,
            ]
        );

        const [rows] = await (pool.query as any)('SELECT * FROM events WHERE id = ?', [(result as any).insertId]);

        // Only notify when publishing directly (founding_member creating as published)
        if (publishedValue) {
            notifyAllMembers(
                NOTIF_TYPES.EVENT_PUBLISHED,
                `New Event: ${title.trim()}`,
                `${event_category}${location ? ` — ${location.trim()}` : ' — Online'}`,
                { url: '/events', eventId: String((result as any).insertId) }
            );
        }

        res.status(201).json({
            success: true,
            data: rows[0],
            message: isCouncilMember ? 'Event submitted for admin review. It will appear publicly once published by an admin.' : undefined,
        });
    } catch (err: any) {
        next(err);
    }
};


// PUT /api/events/:id  (founding_member or council_member — council_member owns only)
export const updateEvent = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, date, location, description, link, event_category, is_upcoming, recording_url, banner_image, is_published } = req.body;

        const [check] = await (pool.query as any)('SELECT id, created_by, is_published FROM events WHERE id = ?', [String(req.params.id)]);
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'Event not found.' });
        }

        // council_member may only edit events they created
        if ((req.user as any).role === 'council_member' && check[0].created_by !== (req.user as any).id) {
            res.status(403).json({ success: false, message: 'You can only edit events you created.' });
        }

        // council_member cannot change is_published — keep existing value
        const publishedValue = (req.user as any).role === 'council_member'
            ? check[0].is_published
            : (is_published !== undefined ? Boolean(is_published) : true);

        await (pool.query as any)(
            `UPDATE events
             SET title=?, date=?, location=?, description=?, link=?, event_category=?,
                 is_upcoming=?, recording_url=?, banner_image=?, is_published=?
             WHERE id=?`,
            [
                title.trim(),
                date,
                location ? location.trim() : null,
                description ? description.trim() : null,
                link ? link.trim() : null,
                event_category,
                Boolean(is_upcoming),
                recording_url ? recording_url.trim() : null,
                banner_image ? banner_image.trim() : null,
                publishedValue,
                String(req.params.id),
            ]
        );

        const [rows] = await (pool.query as any)('SELECT * FROM events WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};


// PATCH /api/events/:id/publish  (admin only)
export const togglePublishEvent = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)('SELECT id, is_published FROM events WHERE id = ?', [String(req.params.id)]);
        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'Event not found.' });
        }

        const newState = !rows[0].is_published;
        await (pool.query as any)('UPDATE events SET is_published = ? WHERE id = ?', [newState, String(req.params.id)]);

        const [updated] = await (pool.query as any)('SELECT * FROM events WHERE id = ?', [String(req.params.id)]);

        // Only notify when publishing — not when unpublishing
        if (newState) {
            notifyAllMembers(
                NOTIF_TYPES.EVENT_PUBLISHED,
                `New Event: ${updated[0].title}`,
                `${updated[0].event_category}${updated[0].location ? ` — ${updated[0].location}` : ' — Online'}`,
                { url: '/events', eventId: String(updated[0].id) }
            );
        }

        res.json({
            success: true,
            data: updated[0],
            message: newState ? 'Event published.' : 'Event unpublished.',
        });
    } catch (err: any) {
        next(err);
    }
};

// POST /api/events/:id/upload-banner  (founding_member or council_member — council_member owns only)
export const uploadBanner = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [check] = await (pool.query as any)('SELECT id, banner_image, created_by FROM events WHERE id = ?', [String(req.params.id)]);
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'Event not found.' });
        }

        // Ownership check for council_member
        if ((req.user as any).role === 'council_member' && check[0].created_by !== (req.user as any).id) {
            res.status(403).json({ success: false, message: 'You can only upload banners for events you created.' });
        }

        if (!req.file) {
            res.status(422).json({ success: false, message: 'No image file provided.' });
        }

        await deleteFromBlob(check[0].banner_image);

        const banner_image = await uploadToBlob(
            'events/banners',
            req.file!.originalname,
            req.file!.buffer,
            req.file!.mimetype
        );

        await (pool.query as any)('UPDATE events SET banner_image = ? WHERE id = ?', [banner_image, String(req.params.id)]);

        const [rows] = await (pool.query as any)('SELECT * FROM events WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};


// DELETE /api/events/:id  (founding_member or council_member — council_member owns only)
export const deleteEvent = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [check] = await (pool.query as any)('SELECT id, banner_image, created_by FROM events WHERE id = ?', [String(req.params.id)]);
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'Event not found.' });
        }

        // Ownership check for council_member
        if ((req.user as any).role === 'council_member' && check[0].created_by !== (req.user as any).id) {
            res.status(403).json({ success: false, message: 'You can only delete events you created.' });
        }

        await deleteFromBlob(check[0].banner_image);

        await (pool.query as any)('DELETE FROM events WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: { message: 'Event deleted successfully.' } });
    } catch (err: any) {
        next(err);
    }
};
