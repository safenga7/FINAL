import express from 'express';
import { 
    createSession, 
    updateSession, 
    getSessions, 
    getSession,
    deleteSession,
    addMessage,
    markMessagesAsRead
} from '../controllers/sessionController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, sessionValidation } from '../middleware/validation.js';
import { securityMiddleware } from '../middleware/security.js';
import { body } from 'express-validator';

const router = express.Router();

// Apply authentication and security middleware to all routes
router.use(authenticateToken);
router.use(securityMiddleware);

const sessionStatusValidation = [
    body('status')
        .isIn(['confirmed', 'completed', 'cancelled'])
        .withMessage('Invalid status'),
    body('cancellationReason')
        .if(body('status').equals('cancelled'))
        .notEmpty()
        .withMessage('Cancellation reason is required when cancelling a session')
];

// Session management routes
router.post('/', validate(sessionValidation), createSession);
router.get('/', getSessions);
router.get('/:id', getSession);
router.put('/:id', validate(sessionStatusValidation), updateSession);
router.delete('/:id', deleteSession);

// Chat-related routes
router.post('/:id/messages', addMessage);
router.post('/:id/messages/read', markMessagesAsRead);

export default router;