import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import { uploadToBlob, deleteFromBlob } from '../services/azure.service.js';
import { notifyAllMembers, NOTIF_TYPES } from '../services/notification.service.js';

// Helper: pagination meta
const paginate = (query: any, total: number) => {
    const page  = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    return { page, limit, offset, totalPages };
};

// GET /api/workshops  — public; admin passes ?all=true to see unpublished drafts too
export const getWorkshops = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // founding_member sees all; council_member sees published + their own drafts; public sees published only
        const isFoundingMember = (req.user as any)?.role === 'founding_member';
        const isCouncilMember  = (req.user as any)?.role === 'council_member';
        const showAll = (req.query.all as string) === 'true' && isFoundingMember;
        const { upcoming } = req.query;

        let whereClause;
        const params: any[] = [];

        if (showAll) {
            whereClause = '1=1';
        } else if (isCouncilMember && (req.query.mine as string) === 'true') {
            // council_member viewing their own (published + drafts)
            whereClause = '(is_published = 1 OR created_by = ?)';
            params.push((req.user as any).id);
        } else {
            whereClause = 'is_published = 1';
        }

        let countSql = `SELECT COUNT(*) AS total FROM expert_workshops WHERE ${whereClause}`;
        let dataSql  = `SELECT * FROM expert_workshops WHERE ${whereClause}`;

        if (upcoming !== undefined) {
            const clause = ' AND is_upcoming = ?';
            countSql += clause;
            dataSql  += clause;
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

// GET /api/workshops/:id
export const getWorkshopById = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)('SELECT * FROM expert_workshops WHERE id = ?', [String(req.params.id)]);
        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'Workshop not found.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};

// POST /api/workshops  (founding_member or council_member)
export const createWorkshop = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, date, location, description, speaker, agenda, recording_url, banner_image, is_published, is_upcoming } = req.body;
        const isCouncilMember = (req.user as any).role === 'council_member';

        // council_member always creates as draft
        const publishedValue = isCouncilMember ? false : (is_published !== undefined ? Boolean(is_published) : true);

        const [result] = await (pool.query as any)(
            `INSERT INTO expert_workshops
               (title, date, location, description, speaker, agenda, recording_url, banner_image, is_published, is_upcoming, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                date,
                location ? location.trim() : null,
                description ? description.trim() : null,
                speaker ? speaker.trim() : null,
                agenda ? agenda.trim() : null,
                recording_url ? recording_url.trim() : null,
                banner_image ? banner_image.trim() : null,
                publishedValue,
                is_upcoming !== undefined ? Boolean(is_upcoming) : true,
                (req.user as any).id,
            ]
        );

        const [rows] = await (pool.query as any)('SELECT * FROM expert_workshops WHERE id = ?', [(result as any).insertId]);

        // Only notify when published directly
        if (publishedValue) {
            notifyAllMembers(
                NOTIF_TYPES.WORKSHOP_PUBLISHED,
                `New Workshop: ${title.trim()}`,
                `${location ? location.trim() : 'Online'}${speaker ? ` — ${speaker.trim()}` : ''}`,
                { url: '/workshops', workshopId: String((result as any).insertId) }
            );
        }

        res.status(201).json({
            success: true,
            data: rows[0],
            message: isCouncilMember ? 'Workshop submitted for admin review. It will appear publicly once published by an admin.' : undefined,
        });
    } catch (err: any) {
        next(err);
    }
};


// PUT /api/workshops/:id  (founding_member or council_member — council_member owns only)
export const updateWorkshop = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, date, location, description, speaker, agenda, recording_url, banner_image, is_published, is_upcoming } = req.body;

        const [check] = await (pool.query as any)('SELECT id, created_by, is_published FROM expert_workshops WHERE id = ?', [String(req.params.id)]);
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'Workshop not found.' });
        }

        // Ownership check for council_member
        if ((req.user as any).role === 'council_member' && check[0].created_by !== (req.user as any).id) {
            res.status(403).json({ success: false, message: 'You can only edit workshops you created.' });
        }

        // council_member cannot change is_published — keep existing value
        const publishedValue = (req.user as any).role === 'council_member'
            ? check[0].is_published
            : (is_published !== undefined ? Boolean(is_published) : true);

        await (pool.query as any)(
            `UPDATE expert_workshops
             SET title=?, date=?, location=?, description=?, speaker=?, agenda=?,
                 recording_url=?, banner_image=?, is_published=?, is_upcoming=?
             WHERE id=?`,
            [
                title.trim(),
                date,
                location ? location.trim() : null,
                description ? description.trim() : null,
                speaker ? speaker.trim() : null,
                agenda ? agenda.trim() : null,
                recording_url ? recording_url.trim() : null,
                banner_image ? banner_image.trim() : null,
                publishedValue,
                is_upcoming !== undefined ? Boolean(is_upcoming) : true,
                String(req.params.id),
            ]
        );

        const [rows] = await (pool.query as any)('SELECT * FROM expert_workshops WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};


// PATCH /api/workshops/:id/publish  (admin only)
export const togglePublishWorkshop = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)('SELECT id, is_published FROM expert_workshops WHERE id = ?', [String(req.params.id)]);
        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'Workshop not found.' });
        }

        const newState = !rows[0].is_published;
        await (pool.query as any)('UPDATE expert_workshops SET is_published = ? WHERE id = ?', [newState, String(req.params.id)]);

        const [updated] = await (pool.query as any)('SELECT * FROM expert_workshops WHERE id = ?', [String(req.params.id)]);

        // Only notify when publishing — not when unpublishing
        if (newState) {
            notifyAllMembers(
                NOTIF_TYPES.WORKSHOP_PUBLISHED,
                `New Workshop: ${updated[0].title}`,
                `${updated[0].location || 'Online'}${updated[0].speaker ? ` — ${updated[0].speaker}` : ''}`,
                { url: '/workshops', workshopId: String(updated[0].id) }
            );
        }

        res.json({
            success: true,
            data: updated[0],
            message: newState ? 'Workshop published.' : 'Workshop unpublished.',
        });
    } catch (err: any) {
        next(err);
    }
};

// POST /api/workshops/:id/upload-banner  (founding_member or council_member — council_member owns only)
export const uploadWorkshopBanner = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [check] = await (pool.query as any)('SELECT id, banner_image, created_by FROM expert_workshops WHERE id = ?', [String(req.params.id)]);
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'Workshop not found.' });
        }

        // Ownership check for council_member
        if ((req.user as any).role === 'council_member' && check[0].created_by !== (req.user as any).id) {
            res.status(403).json({ success: false, message: 'You can only upload banners for workshops you created.' });
        }

        if (!req.file) {
            res.status(422).json({ success: false, message: 'No image file provided.' });
        }

        await deleteFromBlob(check[0].banner_image);

        const banner_image = await uploadToBlob(
            'workshops/banners',
            req.file!.originalname,
            req.file!.buffer,
            req.file!.mimetype
        );

        await (pool.query as any)('UPDATE expert_workshops SET banner_image = ? WHERE id = ?', [banner_image, String(req.params.id)]);

        const [rows] = await (pool.query as any)('SELECT * FROM expert_workshops WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};


// DELETE /api/workshops/:id  (founding_member or council_member — council_member owns only)
export const deleteWorkshop = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [check] = await (pool.query as any)('SELECT id, banner_image, created_by FROM expert_workshops WHERE id = ?', [String(req.params.id)]);
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'Workshop not found.' });
        }

        // Ownership check for council_member
        if ((req.user as any).role === 'council_member' && check[0].created_by !== (req.user as any).id) {
            res.status(403).json({ success: false, message: 'You can only delete workshops you created.' });
        }

        await deleteFromBlob(check[0].banner_image);
        await (pool.query as any)('DELETE FROM expert_workshops WHERE id = ?', [String(req.params.id)]);

        res.json({ success: true, data: { message: 'Workshop deleted successfully.' } });
    } catch (err: any) {
        next(err);
    }
};