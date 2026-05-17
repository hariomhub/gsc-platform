import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import { uploadToBlob, deleteFromBlob } from '../services/azure.service.js';
import verifyRecaptcha from '../middleware/verifyRecaptcha.js';
import { notifyAllMembers, NOTIF_TYPES } from '../services/notification.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const isDupEntry = (err) =>
    err.code === 'ER_DUP_ENTRY' || (err.message && err.message.includes('Duplicate entry'));

// ── GET /api/nominations/awards ───────────────────────────────────────────────
export const getAwards = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const showAll = (req.query.all as string) === 'true';
        const [awards] = await (pool.query as any)(
            `SELECT * FROM awards ${showAll ? '' : 'WHERE is_active = 1'} ORDER BY created_at DESC`
        );
        const [cats] = await (pool.query as any)(`SELECT * FROM award_categories ORDER BY created_at ASC`);

        const result = awards.map((a) => ({
            ...a,
            categories: cats.filter((c) => c.award_id === a.id),
        }));

        res.json({ success: true, data: result });
    } catch (err: any) {
        next(err);
    }
};

// ── GET /api/nominations/nominees ─────────────────────────────────────────────
export const getNominees = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { award_id, category_id, timeline, search } = req.query;
        const showAll = (req.query.all as string) === 'true';

        let sql = `
            SELECT n.*,
                   ac.name     AS category_name,
                   ac.timeline AS category_timeline,
                   a.name      AS award_name
            FROM nominees n
            JOIN award_categories ac ON ac.id = n.category_id
            JOIN awards           a  ON a.id  = n.award_id
            WHERE ${showAll ? '1=1' : 'n.is_active = 1'}
        `;
        const params: any[] = [];

        if (award_id)    { sql += ' AND n.award_id    = ?'; params.push(award_id); }
        if (category_id) { sql += ' AND n.category_id = ?'; params.push(category_id); }
        if (timeline)    { sql += ' AND ac.timeline   = ?'; params.push(timeline); }
        if (search)      { sql += ' AND n.name LIKE ?';     params.push(`%${search}%`); }

        if ((req.query.is_winner as string) !== undefined) {
            sql += ' AND n.is_winner = ?';
            params.push((req.query.is_winner as string) === 'true' ? 1 : 0);
        }

        sql += ' ORDER BY n.created_at DESC';

        const [rows] = await (pool.query as any)(sql, params);
        res.json({ success: true, data: rows });
    } catch (err: any) {
        next(err);
    }
};

// ── GET /api/nominations/nominees/:id ────────────────────────────────────────
export const getNomineeById = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)(
            `SELECT n.*,
                    ac.name     AS category_name,
                    ac.timeline AS category_timeline,
                    a.name      AS award_name
             FROM nominees n
             JOIN award_categories ac ON ac.id = n.category_id
             JOIN awards           a  ON a.id  = n.award_id
             WHERE n.id = ?`,
            [String(req.params.id)]
        );
        if (!(rows as any).length) res.status(404).json({ success: false, message: 'Nominee not found.' });

        const [[{ vote_count }]] = await (pool.query as any)(
            `SELECT COUNT(*) AS vote_count FROM votes WHERE nominee_id = ?`,
            [String(req.params.id)]
        );
        res.json({ success: true, data: { ...rows[0], vote_count } });
    } catch (err: any) {
        next(err);
    }
};

// ── POST /api/nominations/nominees/:id/vote ───────────────────────────────────
export const castVote = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const nomineeId = parseInt(String(req.params.id), 10);
        const { isAnonymous, anonymousEmail, recaptchaToken } = req.body;

        const isAnon = Boolean(isAnonymous);
        let userId: any = null;
        let voterEmail = null;

        if (isAnon) {
            if (!anonymousEmail || !anonymousEmail.trim()) {
                res.status(400).json({ success: false, message: 'Email is required for anonymous voting.' });
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(anonymousEmail)) {
                res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
            }
            const recaptchaSecretConfigured = !!process.env.RECAPTCHA_SECRET_KEY;
            if (recaptchaSecretConfigured) {
                if (!recaptchaToken) {
                    res.status(400).json({ success: false, message: 'reCAPTCHA verification is required for anonymous voting.' });
                }
                const remoteIp = req.ip || req.connection.remoteAddress;
                // recaptcha check moved to middleware
            }
            voterEmail = anonymousEmail.trim().toLowerCase();
        } else {
            if (!req.user! || !(req.user as any).id) {
                res.status(401).json({ success: false, message: 'Authentication required for non-anonymous voting.' });
            }
            userId = (req.user as any).id;
        }

        const [nomRows] = await (pool.query as any)(
            'SELECT id, category_id, award_id, is_active FROM nominees WHERE id = ?',
            [nomineeId]
        );
        if (!nomRows.length || !nomRows[0].is_active) {
            res.status(404).json({ success: false, message: 'Nominee not found or inactive.' });
        }

        const { category_id, award_id } = nomRows[0];

        let existingVoteQuery, existingVoteParams;
        if (isAnon) {
            existingVoteQuery  = `SELECT id FROM votes WHERE category_id = ? AND is_anonymous = 1 AND anonymous_email = ?`;
            existingVoteParams = [category_id, voterEmail];
        } else {
            existingVoteQuery  = `SELECT id FROM votes WHERE category_id = ? AND user_id = ?`;
            existingVoteParams = [category_id, userId];
        }

        const [existingVotes] = await (pool.query as any)(existingVoteQuery, existingVoteParams);
        if (existingVotes.length > 0) {
            res.status(409).json({ success: false, message: 'You have already voted in this category.' });
        }

        await (pool.query as any)(
            `INSERT INTO votes (user_id, nominee_id, category_id, award_id, is_anonymous, anonymous_email) VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, nomineeId, category_id, award_id, isAnon, voterEmail]
        );

        res.status(201).json({ success: true, message: 'Vote cast successfully!' });
    } catch (err: any) {
        if (isDupEntry(err)) {
            res.status(409).json({ success: false, message: 'You have already voted in this category.' });
        }
        next(err);
    }
};

// ── GET /api/nominations/my-votes ────────────────────────────────────────────
export const getMyVotes = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)(
            `SELECT category_id, nominee_id FROM votes WHERE user_id = ?`,
            [(req.user as any).id]
        );
        res.json({ success: true, data: rows });
    } catch (err: any) {
        next(err);
    }
};

// ── GET /api/nominations/leaderboard  (admin only) ──────────────────────────
export const getLeaderboard = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [awards]     = await (pool.query as any)(`SELECT * FROM awards ORDER BY id`);
        const [categories] = await (pool.query as any)(`SELECT * FROM award_categories ORDER BY award_id, id`);
        const [nominees]   = await (pool.query as any)(`
            SELECT n.id AS nominee_id, n.name, n.designation, n.company, n.photo_url,
                   n.linkedin_url, n.category_id, n.award_id,
                   COUNT(v.id) AS vote_count
            FROM nominees n
            LEFT JOIN votes v ON v.nominee_id = n.id
            WHERE n.is_active = 1
            GROUP BY n.id
            ORDER BY n.category_id, vote_count DESC
        `);

        const result = awards.map((a) => ({
            award_id:   a.id,
            award_name: a.name,
            categories: categories
                .filter((c) => c.award_id === a.id)
                .map((c) => ({
                    category_id:   c.id,
                    category_name: c.name,
                    timeline:      c.timeline,
                    nominees:      (nominees as any).filter((n) => n.category_id === c.id),
                })),
        }));

        res.json({ success: true, data: result });
    } catch (err: any) {
        next(err);
    }
};

// ── AWARD CRUD (admin) ────────────────────────────────────────────────────────
export const createAward = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, description, is_active = true } = req.body;
        const [r] = await (pool.query as any)(
            `INSERT INTO awards (name, description, is_active) VALUES (?, ?, ?)`,
            [name.trim(), description?.trim() || null, Boolean(is_active)]
        );
        const [[row]] = await (pool.query as any)(`SELECT * FROM awards WHERE id = ?`, [(r as any).insertId]);
        res.status(201).json({ success: true, data: row });
    } catch (err: any) { next(err); }
};

export const updateAward = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, description, is_active } = req.body;
        await (pool.query as any)(
            `UPDATE awards SET name=?, description=?, is_active=? WHERE id=?`,
            [name.trim(), description?.trim() || null, Boolean(is_active), String(req.params.id)]
        );
        const [[row]] = await (pool.query as any)(`SELECT * FROM awards WHERE id = ?`, [String(req.params.id)]);
        res.json({ success: true, data: row });
    } catch (err: any) { next(err); }
};

export const deleteAward = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await (pool.query as any)(`DELETE FROM awards WHERE id = ?`, [String(req.params.id)]);
        res.json({ success: true, message: 'Award deleted.' });
    } catch (err: any) { next(err); }
};

// ── CATEGORY CRUD (admin) ─────────────────────────────────────────────────────
export const createCategory = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { award_id, name, timeline } = req.body;
        const [r] = await (pool.query as any)(
            `INSERT INTO award_categories (award_id, name, timeline) VALUES (?, ?, ?)`,
            [award_id, name.trim(), timeline]
        );
        const [[row]] = await (pool.query as any)(`SELECT * FROM award_categories WHERE id = ?`, [(r as any).insertId]);
        res.status(201).json({ success: true, data: row });
    } catch (err: any) { next(err); }
};

export const updateCategory = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, timeline } = req.body;
        await (pool.query as any)(
            `UPDATE award_categories SET name=?, timeline=? WHERE id=?`,
            [name.trim(), timeline, String(req.params.id)]
        );
        const [[row]] = await (pool.query as any)(`SELECT * FROM award_categories WHERE id = ?`, [String(req.params.id)]);
        res.json({ success: true, data: row });
    } catch (err: any) { next(err); }
};

export const deleteCategory = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await (pool.query as any)(`DELETE FROM award_categories WHERE id = ?`, [String(req.params.id)]);
        res.json({ success: true, message: 'Category deleted.' });
    } catch (err: any) { next(err); }
};

// ── NOMINEE CRUD (admin) ──────────────────────────────────────────────────────
export const createNominee = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { award_id, category_id, name, designation, company, linkedin_url, achievements, description, is_active = true, is_winner = false } = req.body;
        const [r] = await (pool.query as any)(
            `INSERT INTO nominees (award_id, category_id, name, designation, company, linkedin_url, achievements, description, is_active, is_winner)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [award_id, category_id, name.trim(), designation?.trim(), company?.trim(), linkedin_url?.trim() || null, achievements?.trim() || null, description?.trim() || null, Boolean(is_active), Boolean(is_winner)]
        );
        const [[row]] = await (pool.query as any)(`SELECT * FROM nominees WHERE id = ?`, [(r as any).insertId]);

        // Notify all members — fire and forget
        notifyAllMembers(
            NOTIF_TYPES.NOMINEE_ADDED,
            `New Nominee: ${name.trim()}`,
            `${company ? `${company.trim()} — ` : ''}nominated for recognition`,
            { url: '/nominees', nomineeId: String((r as any).insertId) }
        );

        res.status(201).json({ success: true, data: row });
    } catch (err: any) { next(err); }
};

export const updateNominee = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { award_id, category_id, name, designation, company, linkedin_url, achievements, description, is_active, is_winner } = req.body;

        // Fetch current state to detect winner change
        const [[existing]] = await (pool.query as any)(`SELECT is_winner FROM nominees WHERE id = ?`, [String(req.params.id)]);

        await (pool.query as any)(
            `UPDATE nominees SET award_id=?, category_id=?, name=?, designation=?, company=?,
             linkedin_url=?, achievements=?, description=?, is_active=?, is_winner=? WHERE id=?`,
            [award_id, category_id, name.trim(), designation?.trim(), company?.trim(), linkedin_url?.trim() || null, achievements?.trim() || null, description?.trim() || null, Boolean(is_active), Boolean(is_winner ?? false), String(req.params.id)]
        );
        const [[row]] = await (pool.query as any)(`SELECT * FROM nominees WHERE id = ?`, [String(req.params.id)]);

        // Only notify when winner status is being set to true for the first time
        if (is_winner && existing && !existing.is_winner) {
            notifyAllMembers(
                NOTIF_TYPES.WINNER_ANNOUNCED,
                `Winner Announced: ${name.trim()}`,
                `Congratulations to our latest award winner${company ? ` from ${company.trim()}` : ''}`,
                { url: '/winners', nomineeId: String(req.params.id) }
            );
        }

        res.json({ success: true, data: row });
    } catch (err: any) { next(err); }
};

export const deleteNominee = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [[nom]] = await (pool.query as any)(`SELECT photo_url FROM nominees WHERE id = ?`, [String(req.params.id)]);

        await deleteFromBlob(nom?.photo_url);

        await (pool.query as any)(`DELETE FROM nominees WHERE id = ?`, [String(req.params.id)]);
        res.json({ success: true, message: 'Nominee deleted.' });
    } catch (err: any) { next(err); }
};

// ── POST /api/nominations/nominees/:id/photo  (admin, multipart) ─────────────
export const uploadNomineePhoto = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [[nom]] = await (pool.query as any)(`SELECT id, photo_url FROM nominees WHERE id = ?`, [String(req.params.id)]);
        if (!nom) res.status(404).json({ success: false, message: 'Nominee not found.' });
        if (!req.file) res.status(422).json({ success: false, message: 'No image provided.' });

        await deleteFromBlob(nom.photo_url);

        const photo_url = await uploadToBlob(
            'nominees/photos',
            req.file!.originalname,
            req.file!.buffer,
            req.file!.mimetype
        );

        await (pool.query as any)(`UPDATE nominees SET photo_url = ? WHERE id = ?`, [photo_url, nom.id]);

        const [[updated]] = await (pool.query as any)(`SELECT * FROM nominees WHERE id = ?`, [nom.id]);
        res.json({ success: true, data: updated });
    } catch (err: any) { next(err); }
};