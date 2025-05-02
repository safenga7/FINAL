import express from 'express';
import { generateResponse, checkHealth } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { validate, chatMessageValidation } from '../middleware/validation.js';
import { securityMiddleware } from '../middleware/security.js';

const router = express.Router();

// Health check endpoint - no auth required
router.get('/health', checkHealth);

// Protected AI endpoints with validation and rate limiting
router.post(
    '/generate',
    authenticateToken,
    aiLimiter,
    securityMiddleware,
    validate(chatMessageValidation),
    generateResponse
);

export default router;