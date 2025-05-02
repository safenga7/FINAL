import helmet from 'helmet';
import { doubleCsrf } from 'csrf-csrf';
import { logError } from '../services/loggingService.js';

// Basic security headers
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'js.stripe.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", process.env.AI_MODEL_URL],
            frameSrc: ['js.stripe.com'],
            fontSrc: ["'self'", 'fonts.gstatic.com'],
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

// CSRF Protection configuration
const { doubleCsrfProtection, generateToken } = doubleCsrf({
    getSecret: () => process.env.JWT_SECRET,
    cookieName: "XSRF-TOKEN",
    cookieOptions: {
        httpOnly: false,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
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

    // Validate content type for specific methods
    (req, res, next) => {
        if (req.method === 'POST' || req.method === 'PUT') {
            const contentType = req.headers['content-type'];
            if (!contentType || 
                (!contentType.includes('application/json') && 
                 !contentType.includes('multipart/form-data') &&
                 !contentType.includes('application/x-www-form-urlencoded'))) {
                return res.status(415).json({
                    error: 'Unsupported Media Type'
                });
            }
        }
        next();
    },

    // Validate request body size
    (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'], 10);
        if (contentLength > 10 * 1024 * 1024) { // 10MB limit
            return res.status(413).json({
                error: 'Request entity too large'
            });
        }
        next();
    },

    // Add security headers for specific routes
    (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
        }
        next();
    }
];