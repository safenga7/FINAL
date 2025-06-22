import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
    getPsychologists,
    getPsychologistById,
    getPsychologistAvailability,
    registerPsychologist
} from '../controllers/psychologistController.js';
import { validate, psychologistValidation, availabilityQueryValidation } from '../middleware/validation.js';
import { securityMiddleware } from '../middleware/security.js';

const router = express.Router();

// Public routes
router.get('/', getPsychologists);
router.get('/:id', getPsychologistById);
router.get(
    '/:id/availability',
    validate(availabilityQueryValidation),
    getPsychologistAvailability
);

// Protected routes
router.post(
    '/register',
    authenticateToken,
    securityMiddleware,
    validate(psychologistValidation),
    registerPsychologist
);

export default router;