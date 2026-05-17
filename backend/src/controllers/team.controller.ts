import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import { uploadToBlob, deleteFromBlob } from '../services/azure.service.js';

const paginate = (query: any, total: number) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    return { page, limit, offset, totalPages };
};

// GET /api/team
export const getTeam = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [[{ total }]] = await (pool.query as any)('SELECT COUNT(*) AS total FROM team_members');
        const { page, limit, offset, totalPages } = paginate(req.query, total);

        const [rows] = await (pool.query as any)(
            'SELECT * FROM team_members ORDER BY id ASC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        res.json({ success: true, data: rows, total, page, limit, totalPages });
    } catch (err: any) {
        next(err);
    }
};

// GET /api/team/:id
export const getTeamMemberById = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)('SELECT * FROM team_members WHERE id = ?', [String(req.params.id)]);
        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'Team member not found.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};

// POST /api/team  (admin only)
export const createTeamMember = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, role, bio, linkedin_url, email } = req.body;

        let photo_url: any = null;
        if (req.file) {
            // Upload to Azure Blob Storage under team/photos/
            photo_url = await uploadToBlob(
                'team/photos',
                req.file!.originalname,
                req.file!.buffer,
                req.file!.mimetype
            );
        }

        const [result] = await (pool.query as any)(
            'INSERT INTO team_members (name, role, bio, linkedin_url, email, photo_url) VALUES (?, ?, ?, ?, ?, ?)',
            [name.trim(), role.trim(), bio ? bio.trim() : null, linkedin_url ? linkedin_url.trim() : null, email ? email.trim() : null, photo_url]
        );

        const [rows] = await (pool.query as any)('SELECT * FROM team_members WHERE id = ?', [(result as any).insertId]);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};

// PUT /api/team/:id  (admin only)
export const updateTeamMember = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, role, bio, linkedin_url, email } = req.body;

        const [check] = await (pool.query as any)('SELECT id, photo_url FROM team_members WHERE id = ?', [String(req.params.id)]);
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'Team member not found.' });
        }

        let photo_url = check[0].photo_url;
        if (req.file) {
            // Delete old photo blob
            await deleteFromBlob(photo_url);
            // Upload new photo
            photo_url = await uploadToBlob(
                'team/photos',
                req.file!.originalname,
                req.file!.buffer,
                req.file!.mimetype
            );
        }

        await (pool.query as any)(
            'UPDATE team_members SET name=?, role=?, bio=?, linkedin_url=?, email=?, photo_url=? WHERE id=?',
            [name.trim(), role.trim(), bio ? bio.trim() : null, linkedin_url ? linkedin_url.trim() : null, email ? email.trim() : null, photo_url, String(req.params.id)]
        );

        const [rows] = await (pool.query as any)('SELECT * FROM team_members WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};

// DELETE /api/team/:id  (admin only)
export const deleteTeamMember = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [check] = await (pool.query as any)('SELECT id, photo_url FROM team_members WHERE id = ?', [String(req.params.id)]);
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'Team member not found.' });
        }

        // Delete photo blob from Azure Storage
        await deleteFromBlob(check[0].photo_url);

        await (pool.query as any)('DELETE FROM team_members WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: { message: 'Team member deleted successfully.' } });
    } catch (err: any) {
        next(err);
    }
};
