import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { uploadToBlob } from '../services/azure.service.js';

// GET /api/profile
export const getProfile = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)(
            'SELECT id, name, email, role, professional_sub_type, pending_sub_type_upgrade, status, bio, photo_url, linkedin_url, organization_name, created_at FROM users WHERE id = ?',
            [(req.user as any).id]
        );

        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'Profile not found.' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};

// PUT /api/profile
export const updateProfile = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, bio, linkedin_url, organization_name } = req.body;

        const [current] = await (pool.query as any)('SELECT photo_url FROM users WHERE id = ?', [(req.user as any).id]);
        if (current.length === 0) {
            res.status(404).json({ success: false, message: 'User not found.' });
        }

        let photo_url: any = undefined;
        if (req.file) {
            // Upload new avatar to Azure Blob Storage under profiles/avatars/
            photo_url = await uploadToBlob(
                'profiles/avatars',
                req.file!.originalname,
                req.file!.buffer,
                req.file!.mimetype
            );
        }

        const finalPhotoUrl = photo_url !== undefined ? photo_url : current[0].photo_url;

        await (pool.query as any)(
            'UPDATE users SET name=?, bio=?, linkedin_url=?, organization_name=?, photo_url=? WHERE id=?',
            [
                name.trim(),
                bio ? bio.trim() : null,
                linkedin_url ? linkedin_url.trim() : null,
                organization_name ? organization_name.trim() : null,
                finalPhotoUrl,
                (req.user as any).id,
            ]
        );

        const [rows] = await (pool.query as any)(
            'SELECT id, name, email, role, professional_sub_type, pending_sub_type_upgrade, status, bio, photo_url, linkedin_url, organization_name, created_at FROM users WHERE id = ?',
            [(req.user as any).id]
        );

        res.json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};

// PUT /api/profile/password
export const changePassword = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;

        const [rows] = await (pool.query as any)('SELECT password_hash FROM users WHERE id = ?', [(req.user as any).id]);
        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'User not found.' });
        }

        const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!valid) {
            res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await (pool.query as any)('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, (req.user as any).id]);

        res.json({ success: true, data: { message: 'Password changed successfully.' } });
    } catch (err: any) {
        next(err);
    }
};

// GET /api/profile/my-resources
export const getMyResources = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)(
            `SELECT r.id, r.title, r.description, r.abstract, r.demo_url, r.type, r.status, r.created_at
             FROM resources r
             WHERE r.uploader_id = ?
             ORDER BY r.created_at DESC`,
            [(req.user as any).id]
        );
        res.json({ success: true, data: rows });
    } catch (err: any) {
        next(err);
    }
};

// DELETE /api/profile/resources/:id  — only if uploader_id matches
export const deleteMyResource = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [check] = await (pool.query as any)(
            'SELECT id, uploader_id FROM resources WHERE id = ?',
            [String(req.params.id)]
        );
        if (check.length === 0) {
            res.status(404).json({ success: false, message: 'Resource not found.' });
        }
        if (check[0].uploader_id !== (req.user as any).id) {
            res.status(403).json({ success: false, message: 'You can only delete your own resources.' });
        }
        await (pool.query as any)('DELETE FROM resources WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: { message: 'Resource deleted.' } });
    } catch (err: any) {
        next(err);
    }
};
