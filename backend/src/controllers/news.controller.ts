import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';

const paginate = (query: any, total: number) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    return { page, limit, offset, totalPages };
};

// GET /api/news  — public: only published items
export const getNews = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const showAll = (req.query.all as string) === 'true';

        const whereClause = showAll
            ? ''
            : 'WHERE (is_published = 1 AND (is_automated = FALSE OR (is_automated = TRUE AND status = \'APPROVED\')))';

        const [[{ total }]] = await (pool.query as any)(`SELECT COUNT(*) AS total FROM news ${whereClause}`);
        const { page, limit, offset, totalPages } = paginate(req.query, total);

        const [rows] = await (pool.query as any)(
            `SELECT *,
             created_at as sort_date,
             created_at as published_at
             FROM news ${whereClause}
             ORDER BY sort_date DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.json({ success: true, data: rows, total, page, limit, totalPages });
    } catch (err: any) {
        next(err);
    }
};

// GET /api/news/:id
export const getNewsById = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)('SELECT * FROM news WHERE id = ?', [String(req.params.id)]);
        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'News item not found.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};

// POST /api/news  (founding_member or council_member)
export const createNews = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, summary, link, image_url, is_published } = req.body;
        const isCouncilMember = (req.user as any).role === 'council_member';

        // council_member always creates as draft
        const publishedValue = isCouncilMember ? false : (is_published !== undefined ? Boolean(is_published) : true);

        const [result] = await (pool.query as any)(
            'INSERT INTO news (title, summary, link, image_url, is_published, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [
                title.trim(),
                summary ? summary.trim() : null,
                link ? link.trim() : null,
                image_url ? image_url.trim() : null,
                publishedValue,
                (req.user as any).id,
            ]
        );

        const [rows] = await (pool.query as any)('SELECT * FROM news WHERE id = ?', [(result as any).insertId]);
        res.status(201).json({
            success: true,
            data: rows[0],
            message: isCouncilMember ? 'News item submitted for admin review. It will appear publicly once published by an admin.' : undefined,
        });
    } catch (err: any) {
        next(err);
    }
};

// PUT /api/news/:id  (founding_member or council_member — council_member owns only)
export const updateNews = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, summary, link, image_url, is_published } = req.body;

        const [check] = await (pool.query as any)('SELECT id, created_by, is_published FROM news WHERE id = ?', [String(req.params.id)]);
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'News item not found.' });
        }

        // council_member may only edit news they created
        if ((req.user as any).role === 'council_member' && check[0].created_by !== (req.user as any).id) {
            res.status(403).json({ success: false, message: 'You can only edit news items you created.' });
        }

        // council_member cannot change is_published — keep existing value
        const publishedValue = (req.user as any).role === 'council_member'
            ? check[0].is_published
            : (is_published !== undefined ? Boolean(is_published) : true);

        await (pool.query as any)(
            'UPDATE news SET title=?, summary=?, link=?, image_url=?, is_published=? WHERE id=?',
            [
                title.trim(),
                summary ? summary.trim() : null,
                link ? link.trim() : null,
                image_url ? image_url.trim() : null,
                publishedValue,
                String(req.params.id),
            ]
        );

        const [rows] = await (pool.query as any)('SELECT * FROM news WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};

// PATCH /api/news/:id/publish  (founding_member ONLY) — toggle publish state
export const togglePublishNews = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)('SELECT id, is_published FROM news WHERE id = ?', [String(req.params.id)]);
        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'News item not found.' });
        }

        const newState = !rows[0].is_published;
        await (pool.query as any)('UPDATE news SET is_published = ? WHERE id = ?', [newState, String(req.params.id)]);

        const [updated] = await (pool.query as any)('SELECT * FROM news WHERE id = ?', [String(req.params.id)]);
        res.json({
            success: true,
            data: updated[0],
            message: newState ? 'News item published.' : 'News item unpublished.',
        });
    } catch (err: any) {
        next(err);
    }
};

// DELETE /api/news/:id  (founding_member or council_member — council_member owns only)
export const deleteNews = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [check] = await (pool.query as any)('SELECT id, created_by FROM news WHERE id = ?', [String(req.params.id)]);
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'News item not found.' });
        }

        // Ownership check for council_member
        if ((req.user as any).role === 'council_member' && check[0].created_by !== (req.user as any).id) {
            res.status(403).json({ success: false, message: 'You can only delete news items you created.' });
        }

        await (pool.query as any)('DELETE FROM news WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: { message: 'News item deleted successfully.' } });
    } catch (err: any) {
        next(err);
    }
};
