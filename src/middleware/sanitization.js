import sanitizeHtml from 'sanitize-html';
import { logWarning } from '../services/loggingService.js';

const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        return sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {},
            allowedIframeHostnames: []
        });
    }
    return value;
};

const sanitizeObject = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return sanitizeValue(obj);
};

export const sanitizeRequest = (req, res, next) => {
    try {
        if (req.body && Object.keys(req.body).length) {
            const originalBody = { ...req.body };
            req.body = sanitizeObject(req.body);

            // Log if anything was sanitized
            const sanitizedFields = Object.keys(originalBody).filter(
                key => JSON.stringify(originalBody[key]) !== JSON.stringify(req.body[key])
            );

            if (sanitizedFields.length) {
                logWarning(`Sanitized suspicious content in fields: ${sanitizedFields.join(', ')}`);
            }
        }

        if (req.query && Object.keys(req.query).length) {
            req.query = sanitizeObject(req.query);
        }

        if (req.params && Object.keys(req.params).length) {
            req.params = sanitizeObject(req.params);
        }

        next();
    } catch (error) {
        logWarning('Error in request sanitization:', error);
        next(error);
    }
};