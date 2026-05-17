import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import { notifyUser, NOTIF_TYPES } from '../services/notification.service.js';

const paginate = (query: any, total: number) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    return { page, limit, offset, totalPages };
};

// Safe JSON parse for tags field
const parseTags = (raw) => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
        return raw.split(',').map((t) => t.trim()).filter(Boolean);
    }
};

const parseTagsInRows = (rows) => (rows as any).map((r) => ({ ...r, tags: parseTags(r.tags) }));

// GET /api/qna
export const getPosts = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { tags, search, sort } = req.query;
        const orderBy = sort === 'most_voted' ? 'p.vote_count DESC' : 'p.created_at DESC';

        let countSql = `SELECT COUNT(*) AS total FROM qna_posts p WHERE 1=1`;
        let dataSql  = `
            SELECT p.*, u.name AS author_name, u.role AS author_role
            FROM qna_posts p
            JOIN users u ON p.author_id = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (tags) {
            const clause = ' AND p.tags LIKE ?';
            countSql += clause; dataSql += clause;
            params.push(`%${tags}%`);
        }
        if (search) {
            const clause = ' AND (p.title LIKE ? OR p.body LIKE ?)';
            countSql += clause; dataSql += clause;
            params.push(`%${search}%`, `%${search}%`);
        }

        const [[{ total }]] = await (pool.query as any)(countSql, params);
        const { page, limit, offset, totalPages } = paginate(req.query, total);

        dataSql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
        const [rows] = await (pool.query as any)(dataSql, [...params, limit, offset]);

        res.json({ success: true, data: parseTagsInRows(rows), total, page, limit, totalPages });
    } catch (err: any) {
        next(err);
    }
};

// GET /api/qna/:id  (with answers)
export const getPostById = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [posts] = await (pool.query as any)(
            `SELECT p.*, u.name AS author_name, u.role AS author_role
             FROM qna_posts p JOIN users u ON p.author_id = u.id
             WHERE p.id = ?`,
            [String(req.params.id)]
        );
        if ((posts as any).length === 0) {
            res.status(404).json({ success: false, message: 'Post not found.' });
        }

        const [answers] = await (pool.query as any)(
            `SELECT a.*, u.name AS author_name, u.role AS author_role
             FROM qna_answers a JOIN users u ON a.author_id = u.id
             WHERE a.post_id = ?
             ORDER BY a.created_at ASC`,
            [String(req.params.id)]
        );

        const post = { ...posts[0], tags: parseTags(posts[0].tags) };
        res.json({ success: true, data: { ...post, answers } });
    } catch (err: any) {
        next(err);
    }
};

// POST /api/qna  (authenticated users only)
export const createPost = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, body, tags } = req.body;

        let tagsJson: any = null;
        if (tags) {
            const tagArray = Array.isArray(tags)
                ? tags.map((t) => t.trim()).filter(Boolean)
                : tags.split(',').map((t) => t.trim()).filter(Boolean);
            if (tagArray.length) tagsJson = JSON.stringify(tagArray);
        }

        const [result] = await (pool.query as any)(
            'INSERT INTO qna_posts (title, body, tags, author_id) VALUES (?, ?, ?, ?)',
            [title.trim(), body.trim(), tagsJson, (req.user as any).id]
        );

        const [rows] = await (pool.query as any)(
            `SELECT p.*, u.name AS author_name, u.role AS author_role
             FROM qna_posts p JOIN users u ON p.author_id = u.id
             WHERE p.id = ?`,
            [(result as any).insertId]
        );

        res.status(201).json({ success: true, data: { ...rows[0], tags: parseTags(rows[0].tags) } });
    } catch (err: any) {
        next(err);
    }
};

// DELETE /api/qna/:id  (owner or admin)
export const deletePost = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)('SELECT author_id FROM qna_posts WHERE id = ?', [String(req.params.id)]);
        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'Post not found.' });
        }

        if (rows[0].author_id !== (req.user as any).id && (req.user as any).role !== 'founding_member') {
            res.status(403).json({ success: false, message: 'You are not authorised to delete this post.' });
        }

        await (pool.query as any)('DELETE FROM qna_posts WHERE id = ?', [String(req.params.id)]);
        res.json({ success: true, data: { message: 'Post deleted successfully.' } });
    } catch (err: any) {
        next(err);
    }
};

// POST /api/qna/:id/answers  (authenticated users only)
export const createAnswer = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { body } = req.body;

        // Fetch post — need author_id for notification
        const [posts] = await (pool.query as any)(
            'SELECT id, author_id, title FROM qna_posts WHERE id = ?',
            [String(req.params.id)]
        );
        if ((posts as any).length === 0) {
            res.status(404).json({ success: false, message: 'Post not found.' });
        }

        const [result] = await (pool.query as any)(
            'INSERT INTO qna_answers (post_id, author_id, body) VALUES (?, ?, ?)',
            [String(req.params.id), (req.user as any).id, body.trim()]
        );

        // Update denormalized answer_count
        await (pool.query as any)('UPDATE qna_posts SET answer_count = answer_count + 1 WHERE id = ?', [String(req.params.id)]);

        const [rows] = await (pool.query as any)(
            `SELECT a.*, u.name AS author_name, u.role AS author_role
             FROM qna_answers a JOIN users u ON a.author_id = u.id
             WHERE a.id = ?`,
            [(result as any).insertId]
        );

        // Notify post author — only if answerer is different from post author
        if (posts[0].author_id !== (req.user as any).id) {
            notifyUser(
                posts[0].author_id,
                'QNA_ANSWERED',
                `${(req.user as any).name} answered your question`,
                posts[0].title,
                { url: `/community-qna/${String(req.params.id)}` }
            );
        }

        res.status(201).json({ success: true, data: rows[0] });
    } catch (err: any) {
        next(err);
    }
};

// DELETE /api/qna/answers/:id  (owner or admin)
export const deleteAnswer = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [rows] = await (pool.query as any)('SELECT author_id, post_id FROM qna_answers WHERE id = ?', [String(req.params.id)]);
        if ((rows as any).length === 0) {
            res.status(404).json({ success: false, message: 'Answer not found.' });
        }

        if (rows[0].author_id !== (req.user as any).id && (req.user as any).role !== 'founding_member') {
            res.status(403).json({ success: false, message: 'You are not authorised to delete this answer.' });
        }

        await (pool.query as any)('DELETE FROM qna_answers WHERE id = ?', [String(req.params.id)]);
        await (pool.query as any)(
            'UPDATE qna_posts SET answer_count = GREATEST(0, answer_count - 1) WHERE id = ?',
            [rows[0].post_id]
        );

        res.json({ success: true, data: { message: 'Answer deleted successfully.' } });
    } catch (err: any) {
        next(err);
    }
};

// POST /api/qna/:id/vote  (authenticated users only, one vote per user per post)
export const votePost = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const postId = String(req.params.id);
        const userId = (req.user as any).id;

        const [posts] = await (pool.query as any)('SELECT id FROM qna_posts WHERE id = ?', [postId]);
        if ((posts as any).length === 0) {
            res.status(404).json({ success: false, message: 'Post not found.' });
        }

        const [existing] = await (pool.query as any)(
            'SELECT id FROM qna_votes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existing.length > 0) {
            await (pool.query as any)('DELETE FROM qna_votes WHERE post_id = ? AND user_id = ?', [postId, userId]);
            await (pool.query as any)('UPDATE qna_posts SET vote_count = GREATEST(0, vote_count - 1) WHERE id = ?', [postId]);
            res.json({ success: true, data: { voted: false, message: 'Vote removed.' } });
        }

        await (pool.query as any)('INSERT INTO qna_votes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
        await (pool.query as any)('UPDATE qna_posts SET vote_count = vote_count + 1 WHERE id = ?', [postId]);

        res.json({ success: true, data: { voted: true, message: 'Vote added.' } });
    } catch (err: any) {
        next(err);
    }
};