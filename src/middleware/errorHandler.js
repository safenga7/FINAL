import { logError } from '../services/loggingService.js';

export const errorHandler = (err, req, res, next) => {
    // Log error with context
    logError(err, `${req.method} ${req.url}`);

    // Handle CSRF errors
    if (err.code === 'INVALID_CSRF_TOKEN' || err.code === 'CSRF_MISMATCH') {
        return res.status(403).json({
            message: 'Invalid security token',
            error: 'Please refresh the page and try again'
        });
    }

    // Handle Stripe errors
    if (err.type && err.type.startsWith('Stripe')) {
        return res.status(400).json({
            message: 'Payment processing error',
            error: err.message
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Invalid or expired authentication token',
            error: err.message
        });
    }

    // Handle database errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            message: 'Validation error',
            errors: err.errors.map(e => ({ field: e.path, message: e.message }))
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            message: 'Resource already exists',
            errors: err.errors.map(e => ({ field: e.path, message: e.message }))
        });
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            message: 'Invalid reference',
            error: 'Referenced resource does not exist'
        });
    }

    // Handle AI service errors
    if (err.code === 'AI_SERVICE_ERROR') {
        return res.status(503).json({
            message: 'AI service temporarily unavailable',
            error: err.message
        });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation failed',
            errors: err.errors
        });
    }

    // Handle rate limit errors
    if (err.type === 'RATE_LIMIT_ERROR') {
        return res.status(429).json({
            message: 'Too many requests',
            error: err.message
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
};