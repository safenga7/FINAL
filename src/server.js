import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import userRoutes from './routes/userRoutes.js';
import psychologistRoutes from './routes/psychologistRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { sequelize } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { securityHeaders, csrfProtection, generateCsrfToken } from './middleware/security.js';
import { sanitizeRequest } from './middleware/sanitization.js';
import { initializeWebSocket } from './services/websocketService.js';
import cookieParser from 'cookie-parser';
import Logger, { logHttpRequest, logInfo, logError } from './services/loggingService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const server = createServer(app);

// Initialize WebSocket service
try {
    initializeWebSocket(server);
    logInfo('WebSocket service initialized successfully');
} catch (error) {
    logError('Failed to initialize WebSocket service:', error);
}

// Logging middleware - log all requests
app.use(logHttpRequest);

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Cookie parser (required for CSRF)
app.use(cookieParser());

// Special handling for Stripe webhook
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
app.use(express.json());

// Request sanitization - after body parsing but before routes
app.use(sanitizeRequest);

// Static files
app.use(express.static('public'));

// CSRF token endpoint - must be before CSRF protection
app.get('/api/csrf-token', (req, res) => {
    try {
        const token = generateCsrfToken(req, res);
        res.cookie('XSRF-TOKEN', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.json({ token });
    } catch (error) {
        logError('Error generating CSRF token:', error);
        res.status(500).json({
            message: 'Error generating security token',
            error: 'Please try refreshing the page'
        });
    }
});

// Apply general rate limiting to all routes except webhooks
app.use('/api(?!/payments/webhook)', apiLimiter);

// Apply CSRF protection to all routes except webhooks and AI health checks
app.use(/\/((?!payments\/webhook|ai\/health).)*/, csrfProtection);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/psychologists', psychologistRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use(errorHandler);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await sequelize.authenticate();

        // Check AI service
        const aiResponse = await fetch(`${process.env.AI_MODEL_URL}/health`);
        const aiHealth = await aiResponse.json();

        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: true,
                ai: aiHealth.status === 'healthy'
            }
        };

        logInfo('Health check passed');
        res.json(status);
    } catch (error) {
        const errorStatus = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: error instanceof Error && error.name === 'SequelizeConnectionError' ? false : true,
                ai: error instanceof TypeError ? false : true
            }
        };

        if (process.env.NODE_ENV === 'development') {
            errorStatus.error = error.message;
        }

        logError('Health check failed', error);
        res.status(503).json(errorStatus);
    }
});

// Handle server errors and graceful shutdown
const handleServerError = (error) => {
    if (error.code === 'EADDRINUSE') {
        logError(`Port ${PORT} is in use. Trying again in 5 seconds...`);
        setTimeout(() => {
            server.close();
            server.listen(PORT);
        }, 5000);
    } else {
        logError('Server error:', error);
        process.exit(1);
    }
};

// Graceful shutdown handler
const gracefulShutdown = async () => {
    logInfo('Received shutdown signal. Starting graceful shutdown...');
    
    server.close(() => {
        logInfo('Server closed');
        
        // Close database connection
        sequelize.close().then(() => {
            logInfo('Database connection closed');
            process.exit(0);
        }).catch(err => {
            logError('Error closing database:', err);
            process.exit(1);
        });
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        logError('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

// Attach error handler
server.on('error', handleServerError);

// Handle various shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', (error) => {
    logError(`${error.message}: Uncaught Exception:`, error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    logError('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
});

// Start server
server.listen(PORT, () => {
    logInfo(`Server running on port ${PORT}`);
});