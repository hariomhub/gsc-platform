import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
/**
 * membershipController.js
 * Handles membership upgrade applications from logged-in users.
 *
 *  POST /api/membership/apply/council   — apply for Council Member upgrade
 *  POST /api/membership/apply/executive — legacy alias for the above
 *
 * Founding Member is admin-only — created directly in DB, no public application.
 */

import pool from '../config/database.js';
import {
    sendCouncilApplicationAdminEmail,
    sendMembershipApplicationReceivedEmail,
} from '../services/email.service.js';

// ── Helper: notify all founding_member admins ─────────────────────────────────
const notifyAdmins = async (applicationRow) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        (sendCouncilApplicationAdminEmail as any)({ adminEmail, adminName: "GSC Admin", application: applicationRow });
    } else {
        const [admins] = await (pool.query as any)(
            `SELECT name, email FROM users WHERE role = 'founding_member' AND status != 'rejected'`
        );
        for (const admin of (admins as any)) {
            sendCouncilApplicationAdminEmail({
                adminEmail: admin.email,
                adminName:  admin.name,
                application: applicationRow,
            });
        }
    }
};

// ── POST /api/membership/apply/council ───────────────────────────────────────
export const applyCouncil = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req.user as any).id;

        // Block if already council_member or founding_member
        const [[user]] = await (pool.query as any)(
            `SELECT role, status FROM users WHERE id = ?`, [userId]
        );
        if (!user) res.status(404).json({ success: false, message: 'User not found.' });
        if (['council_member', 'founding_member'].includes(user.role)) {
            res.status(409).json({
                success: false,
                message: `You already have a ${user.role === 'council_member' ? 'Council Member' : 'Founding Member'} membership.`,
            });
        }

        // Block duplicate pending application
        const [existing] = await (pool.query as any)(
            `SELECT id FROM membership_applications
             WHERE user_id = ? AND requested_role = 'council_member' AND status = 'pending'`,
            [userId]
        );
        if (existing.length > 0) {
            res.status(409).json({
                success: false,
                message: 'You already have a pending Council Member application.',
            });
        }

        const {
            organization_name, job_title, linkedin_url, phone,
            professional_bio, areas_of_expertise, why_council_member,
        } = req.body;

        const [result] = await (pool.query as any)(
            `INSERT INTO membership_applications
             (user_id, requested_role, full_name, email, organization_name, job_title, linkedin_url, phone,
              professional_bio, areas_of_expertise, why_founding_member, payment_reference, amount_paid)
             VALUES (?, 'council_member', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APP-ONLY', 0.00)`,
            [
                userId,
                (req.user as any).name,
                (req.user as any).email,
                organization_name    || null,
                job_title            || null,
                linkedin_url         || null,
                phone                || null,
                professional_bio     || null,
                areas_of_expertise   || null,
                why_council_member   || null,
            ]
        );

        const applicationRow = {
            id:                (result as any).insertId,
            requested_role:    'council_member',
            full_name:         (req.user as any).name,
            email:             (req.user as any).email,
            organization_name: organization_name || null,
            job_title:         job_title         || null,
            linkedin_url:      linkedin_url      || null,
            payment_reference: 'APP-ONLY',
            amount_paid:       0.00,
            created_at:        new Date(),
        };

        // Email: applicant confirmation + admin notification
        sendMembershipApplicationReceivedEmail({
            name:          (req.user as any).name,
            email:         (req.user as any).email,
            requestedRole: 'council_member',
        });
        await notifyAdmins(applicationRow);

        res.status(201).json({
            success: true,
            data: {
                message: 'Your Council Member application has been submitted. You will be notified once reviewed by our admin team.',
                applicationId: (result as any).insertId,
            },
        });
    } catch (err: any) {
        next(err);
    }
};

// Legacy alias — kept so any old '/apply/executive' calls still work
export const applyExecutive = applyCouncil;

// applyFounding removed — Founding Members are created manually in DB only
