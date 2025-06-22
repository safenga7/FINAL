import express from 'express';
import { createSubscription, handleWebhook, verifySubscription } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, subscriptionValidation } from '../middleware/validation.js';
import { securityMiddleware } from '../middleware/security.js';

const router = express.Router();

// Protected subscription routes with validation
router.post(
    '/create-subscription',
    authenticateToken,
    securityMiddleware,
    validate(subscriptionValidation),
    createSubscription
);
router.get('/verify-subscription', authenticateToken, verifySubscription);

// Stripe webhook endpoint - no auth needed but needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;