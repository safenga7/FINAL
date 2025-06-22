import dotenv from 'dotenv';
import { logWarning } from '../services/loggingService.js';

dotenv.config();

const whitelist = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5000'
];

if (process.env.ADDITIONAL_CORS_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',');
    whitelist.push(...additionalOrigins);
}

export const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) {
            return callback(null, true);
        }

        if (whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            logWarning(`Blocked request from unauthorized origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Headers'
    ],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 600 // Cache preflight requests for 10 minutes
};