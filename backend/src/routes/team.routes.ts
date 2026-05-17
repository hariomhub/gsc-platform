import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import * as teamController from '../controllers/team.controller.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(422).json({ success: false, message: errors.array()[0].msg });
    }
    next();
};

// Multer for team member photos — memory storage; blob upload in controller
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for team member photos.'), false);
        }
    },
});

const teamValidation = [
    body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 255 }).withMessage('Name must be 255 characters or fewer.'),
    body('role').trim().notEmpty().withMessage('Role/title is required.').isLength({ max: 255 }).withMessage('Role must be 255 characters or fewer.'),
    body('bio').optional().trim(),
    body('linkedin_url').optional({ checkFalsy: true }).trim().isURL().withMessage('LinkedIn URL must be a valid URL.'),
    body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Email must be a valid email address.'),
];

// Public
router.get('/', teamController.getTeam);
router.get('/:id', teamController.getTeamMemberById);

// Admin only
router.post('/', auth, requireRole('founding_member'), (upload.single('photo') as any), teamValidation, validate, teamController.createTeamMember);
router.put('/:id', auth, requireRole('founding_member'), (upload.single('photo') as any), teamValidation, validate, teamController.updateTeamMember);
router.delete('/:id', auth, requireRole('founding_member'), teamController.deleteTeamMember);

export default router;
