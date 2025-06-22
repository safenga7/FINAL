import { body, query, param, validationResult } from 'express-validator';
import { logError } from '../services/loggingService.js';

export const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        logError('Validation error:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    };
};

export const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain both letters and numbers')
];

export const chatMessageValidation = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ max: 1000 })
        .withMessage('Message cannot exceed 1000 characters')
];

export const validateMessage = [
    param('id')
        .isUUID()
        .withMessage('Invalid session ID'),
    body('content')
        .notEmpty()
        .withMessage('Message content cannot be empty')
        .isString()
        .withMessage('Message content must be text')
        .isLength({ max: 2000 })
        .withMessage('Message content cannot exceed 2000 characters')
];

export const subscriptionValidation = [
    body('planId')
        .isIn(['basic', 'standard', 'premium'])
        .withMessage('Invalid subscription plan')
];

export const sessionValidation = [
    body('psychologistId')
        .isInt()
        .withMessage('Valid psychologist ID is required'),
    body('date')
        .isISO8601()
        .withMessage('Valid date is required'),
    body('time')
        .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Valid time is required in HH:MM format')
];

export const validateSession = [
    body('psychologistId')
        .isUUID()
        .withMessage('Invalid psychologist ID'),
    body('startTime')
        .isISO8601()
        .withMessage('Invalid date format')
        .custom(value => {
            const startTime = new Date(value);
            const now = new Date();
            if (startTime < now) {
                throw new Error('Start time must be in the future');
            }
            return true;
        })
];

export const validateSessionUpdate = [
    param('id')
        .isUUID()
        .withMessage('Invalid session ID'),
    body('status')
        .optional()
        .isIn(['scheduled', 'in-progress', 'completed', 'cancelled'])
        .withMessage('Invalid session status'),
    body('notes')
        .optional()
        .isString()
        .withMessage('Notes must be text')
        .isLength({ max: 5000 })
        .withMessage('Notes cannot exceed 5000 characters')
];

export const validateSessionAccess = async (req, res, next) => {
    try {
        const session = await Session.findSessionWithMessages(req.params.id, req.user.id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        req.session = session;
        next();
    } catch (error) {
        logError('Session access validation error:', error);
        res.status(403).json({ message: 'Not authorized to access this session' });
    }
};

export const psychologistValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('specialization').trim().notEmpty().withMessage('Specialization is required'),
    body('yearsOfExperience')
        .isInt({ min: 0 })
        .withMessage('Years of experience must be a positive number'),
    body('languages')
        .isArray()
        .withMessage('Languages must be an array')
        .notEmpty()
        .withMessage('At least one language is required'),
    body('sessionPrice')
        .isFloat({ min: 0 })
        .withMessage('Session price must be a positive number')
];

export const availabilityQueryValidation = [
    query('date')
        .isISO8601()
        .withMessage('Valid date is required in ISO format (YYYY-MM-DD)')
];