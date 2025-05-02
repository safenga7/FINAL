import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate, loginValidation, registerValidation } from '../middleware/validation.js';

const router = express.Router();

// Apply validation middleware along with rate limiting
router.post('/register', authLimiter, validate(registerValidation), registerUser);
router.post('/login', authLimiter, validate(loginValidation), loginUser);
router.get('/me', authenticateToken, getUserProfile);

export default router;