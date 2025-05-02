import helmet from 'helmet';
import { doubleCsrf } from 'csrf-csrf';
import { logError } from '../services/loggingService.js';

// Basic security headers
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'js.stripe.com'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", process.env.AI_MODEL_URL],
            frameSrc: ['js.stripe.com'],
            objectSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
});

// CSRF Protection with csrf-csrf
const { doubleCsrfProtection, generateToken } = doubleCsrf({
    getSecret: () => process.env.JWT_SECRET,
    cookieName: "x-csrf-token",
    cookieOptions: {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production"
    },
    size: 64,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
    getTokenFromRequest: (req) => req.headers["x-csrf-token"]
});

export const csrfProtection = doubleCsrfProtection;
export const generateCsrfToken = generateToken;

// Security middleware composition
export const securityMiddleware = [
    // Security headers
    (req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    },

    // Validate content type for specific routes
    (req, res, next) => {
        if (req.method === 'POST' || req.method === 'PUT') {
            if (!req.is('application/json') && !req.is('multipart/form-data')) {
                return res.status(415).json({
                    error: 'Unsupported Media Type'
                });
            }
        }
        next();
    }
];