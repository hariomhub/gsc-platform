import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
/**
 * eventRegistrationsController.js
 * Handles event registration: register, cancel, list my registrations, admin list
 */

import pool from '../config/database.js';
import { sendEventRegistrationEmail } from '../services/email.service.js';

// ── POST /api/events/:id/register ─────────────────────────────────────────────
export const registerForEvent = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const eventId = parseInt(String(req.params.id), 10);
        const userId = (req.user as any).id;
        const { name, email, organization, phone, notes, consent_to_share } = req.body;

        if (!name || !email) {
            res.status(422).json({ success: false, message: 'Name and email are required.' });
        }

        if (!consent_to_share) {
            res.status(422).json({ success: false, message: 'You must agree to share your personal details to register for this event.' });
        }

        // Check event exists and is upcoming
        const [[event]] = await (pool.query as any)(
            'SELECT id, title, is_upcoming FROM events WHERE id = ?',
            [eventId]
        );
        if (!event) {
            res.status(404).json({ success: false, message: 'Event not found.' });
        }
        if (!event.is_upcoming) {
            res.status(400).json({ success: false, message: 'Registration is only available for upcoming events.' });
        }

        // Check for duplicate registration
        const [[existing]] = await (pool.query as any)(
            'SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [userId, eventId]
        );
        if (existing) {
            res.status(409).json({ success: false, message: 'You are already registered for this event.' });
        }

        // Insert registration
        const [result] = await (pool.query as any)(
            `INSERT INTO event_registrations (event_id, user_id, name, email, organization, phone, notes, consent_to_share)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [eventId, userId, name, email, organization || null, phone || null, notes || null, consent_to_share]
        );

        // Return the created registration with event info
        const [[registration]] = await (pool.query as any)(
            `SELECT r.*, e.title AS event_title, e.date AS event_date, e.location AS event_location,
                    e.event_category
             FROM event_registrations r
             JOIN events e ON e.id = r.event_id
             WHERE r.id = ?`,
            [(result as any).insertId]
        );

        // Fire-and-forget confirmation email — never blocks the API response
        sendEventRegistrationEmail({
            name:           name,
            email:          email,
            organization:   organization || null,
            event:          registration,
            registrationId: registration.id,
        });

        res.status(201).json({
            success: true,
            message: `Successfully registered for "${event.title}".`,
            data: registration,
        });
    } catch (err: any) {
        next(err);
    }
};

// ── GET /api/events/my-registrations ─────────────────────────────────────────
export const getMyRegistrations = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req.user as any).id;

        const [rows] = await (pool.query as any)(
            `SELECT r.id, r.event_id, r.name, r.email, r.organization, r.phone, r.notes,
                    r.registered_at,
                    e.title AS event_title, e.date AS event_date, e.location AS event_location,
                    e.event_category, e.is_upcoming, e.description AS event_description,
                    e.banner_image
             FROM event_registrations r
             JOIN events e ON e.id = r.event_id
             WHERE r.user_id = ?
             ORDER BY e.date ASC`,
            [userId]
        );

        res.json({ success: true, data: rows });
    } catch (err: any) {
        next(err);
    }
};

// ── DELETE /api/events/:id/register ──────────────────────────────────────────
export const cancelRegistration = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const eventId = parseInt(String(req.params.id), 10);
        const userId = (req.user as any).id;

        const [result] = await (pool.query as any)(
            'DELETE FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [userId, eventId]
        );

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ success: false, message: 'Registration not found.' });
        }

        res.json({ success: true, message: 'Registration cancelled.' });
    } catch (err: any) {
        next(err);
    }
};



// ── GET /api/events/:id/registrations (admin) ─────────────────────────────────
export const getEventRegistrations = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const eventId = parseInt(String(req.params.id), 10);

        const [rows] = await (pool.query as any)(
            `SELECT r.*, u.name AS user_name, u.email AS user_email
             FROM event_registrations r
             JOIN users u ON u.id = r.user_id
             WHERE r.event_id = ?
             ORDER BY r.registered_at DESC`,
            [eventId]
        );

        res.json({ success: true, data: rows, count: (rows as any).length });
    } catch (err: any) {
        next(err);
    }
};
