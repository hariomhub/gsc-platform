import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
/**
 * notificationsController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles:
 *   - FCM token registration / removal
 *   - Bell icon feed (last 20 notifications)
 *   - Unread count for badge
 *   - Mark as read
 * ─────────────────────────────────────────────────────────────────────────────
 */

import pool from '../config/database.js';

// ── POST /api/notifications/register-token ────────────────────────────────────
export const registerToken = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token, platform = 'web' } = req.body;
        const userId = (req.user as any).id;

        if (!token || !token.trim()) {
            res.status(422).json({ success: false, message: 'Token is required.' });
        }

        // Upsert — if token exists update user_id + platform, else insert
        await (pool.query as any)(
            `INSERT INTO push_tokens (user_id, token, platform)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), platform = VALUES(platform), updated_at = NOW()`,
            [userId, token.trim(), platform]
        );

        res.json({ success: true, data: { message: 'Token registered.' } });
    } catch (err: any) {
        next(err);
    }
};

// ── DELETE /api/notifications/register-token ──────────────────────────────────
export const removeToken = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.body;

        if (!token || !token.trim()) {
            res.status(422).json({ success: false, message: 'Token is required.' });
        }

        await (pool.query as any)(
            `DELETE FROM push_tokens WHERE token = ? AND user_id = ?`,
            [token.trim(), (req.user as any).id]
        );

        res.json({ success: true, data: { message: 'Token removed.' } });
    } catch (err: any) {
        next(err);
    }
};

// ── GET /api/notifications ────────────────────────────────────────────────────
// Returns last 20 notifications relevant to this user (broadcast + personal)
export const getNotifications = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req.user as any).id;
        const limit  = Math.min(50, parseInt(String(req.query.limit ?? ""), 10) || 20);

        const [rows] = await (pool.query as any)(
            `SELECT
                n.id,
                n.type,
                n.title,
                n.body,
                n.data,
                n.target,
                n.created_at,
                CASE WHEN nr.id IS NOT NULL THEN 1 ELSE 0 END AS is_read
             FROM notifications n
             LEFT JOIN notification_reads nr
                ON nr.notification_id = n.id AND nr.user_id = ?
             WHERE n.target = 'all'
                OR (n.target = 'user' AND n.target_user_id = ?)
             ORDER BY n.created_at DESC
             LIMIT ?`,
            [userId, userId, limit]
        );

        // Parse JSON data field
        const notifications = (rows as any).map(n => ({
            ...n,
            data:    n.data ? (typeof n.data === 'string' ? JSON.parse(n.data) : n.data) : null,
            is_read: Boolean(n.is_read),
        }));

        res.json({ success: true, data: notifications });
    } catch (err: any) {
        next(err);
    }
};

// ── GET /api/notifications/unread-count ──────────────────────────────────────
export const getUnreadCount = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req.user as any).id;

        const [[{ count }]] = await (pool.query as any)(
            `SELECT COUNT(*) AS count
             FROM notifications n
             LEFT JOIN notification_reads nr
                ON nr.notification_id = n.id AND nr.user_id = ?
             WHERE (n.target = 'all' OR (n.target = 'user' AND n.target_user_id = ?))
               AND nr.id IS NULL`,
            [userId, userId]
        );

        res.json({ success: true, data: { count } });
    } catch (err: any) {
        next(err);
    }
};

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
export const markAsRead = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req.user as any).id;
        const notifId = parseInt(String(req.params.id), 10);

        await (pool.query as any)(
            `INSERT IGNORE INTO notification_reads (user_id, notification_id)
             VALUES (?, ?)`,
            [userId, notifId]
        );

        res.json({ success: true, data: { message: 'Marked as read.' } });
    } catch (err: any) {
        next(err);
    }
};

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
export const markAllAsRead = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req.user as any).id;

        // Get all unread notification IDs for this user
        const [unread] = await (pool.query as any)(
            `SELECT n.id FROM notifications n
             LEFT JOIN notification_reads nr
                ON nr.notification_id = n.id AND nr.user_id = ?
             WHERE (n.target = 'all' OR (n.target = 'user' AND n.target_user_id = ?))
               AND nr.id IS NULL`,
            [userId, userId]
        );

        if (unread.length > 0) {
            const values = unread.map(n => [userId, n.id]);
            await (pool.query as any)(
                `INSERT IGNORE INTO notification_reads (user_id, notification_id) VALUES ?`,
                [values]
            );
        }

        res.json({ success: true, data: { message: 'All notifications marked as read.' } });
    } catch (err: any) {
        next(err);
    }
};