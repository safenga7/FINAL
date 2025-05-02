import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
<<<<<<< HEAD
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
=======
import path from 'path';
import { sequelize } from './config/db.js'; // تأكد من أن هذا الملف يحتوي على اتصال Sequelize بـ PostgreSQL
import userRoutes from './routes/userRoutes.js';
import psychologistRoutes from './routes/psychologistRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
>>>>>>> 196e54b195cb7032b61bb9d291fc729b52faf9c0

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = 5090; // Use port 5090 to avoid conflicts

// Initialize WebSocket service
try {
    initializeWebSocket(server);
    logInfo('WebSocket service initialized successfully');
} catch (error) {
    logError('Failed to initialize WebSocket service:', error);
    // Create a simple WebSocket server for testing
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ server });

    wss.on('connection', function connection(ws) {
        logInfo('WebSocket client connected');

        ws.on('message', function incoming(message) {
            try {
                const data = JSON.parse(message);
                logInfo('Received message:', data);

                // Echo back the message for testing
                if (data.type === 'message') {
                    ws.send(JSON.stringify({
                        type: 'message',
                        message: `Echo: ${data.message}`,
                        sender: 'bot'
                    }));
                }

                // Handle typing status
                if (data.type === 'typing') {
                    ws.send(JSON.stringify({
                        type: 'typing',
                        isTyping: data.isTyping
                    }));
                }
            } catch (error) {
                logError('Error handling WebSocket message:', error);
            }
        });

        ws.on('close', function close() {
            logInfo('WebSocket client disconnected');
        });

        // Send initial connection success message
        ws.send(JSON.stringify({
            type: 'connection',
            message: 'Connected successfully'
        }));
    });
}

// Logging middleware - log all requests
app.use(logHttpRequest);

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors({
    origin: '*', // Allow requests from any origin during development
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

<<<<<<< HEAD
// Request sanitization - after body parsing but before routes
app.use(sanitizeRequest);

// Static files
app.use(express.static('./')); // Serve files from the root directory

// CSRF token endpoint - must be before CSRF protection
app.get('/api/csrf-token', (req, res) => {
    try {
        // Generate CSRF token
        const token = generateCsrfToken(req, res);
        res.json({ token });
    } catch (error) {
        logError('Error generating CSRF token:', error);
        res.status(500).json({
            message: 'Error generating CSRF token',
            error: error.message
        });
    }
});

// Apply general rate limiting to all routes except webhooks
app.use('/api(?!/payments/webhook)', apiLimiter);

// Apply CSRF protection to all routes except webhooks, AI health checks, and user routes (for testing)
// In a production environment, you would want to apply CSRF protection to all routes
// app.use(/\/((?!payments\/webhook|ai\/health).)*/, csrfProtection);

// For testing purposes, we'll disable CSRF protection for now
// This allows us to test the login and registration functionality without CSRF tokens
console.log('⚠️ CSRF protection disabled for testing');

// Routes
=======
// الاتصال بقاعدة البيانات PostgreSQL
sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Could not connect to PostgreSQL', err));

// تعريف مجلد الـ static files (مثل HTML, CSS, JS)
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));

// تعريف الـ routes
>>>>>>> 196e54b195cb7032b61bb9d291fc729b52faf9c0
app.use('/api/users', userRoutes);
app.use('/api/psychologists', psychologistRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);

<<<<<<< HEAD
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

// Start server
server.listen(PORT, () => {
    logInfo(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
const shutdown = async (signal) => {
    logInfo(`${signal} signal received. Starting graceful shutdown...`);

    server.close(() => {
        logInfo('Server closed');

        sequelize.close().then(() => {
            logInfo('Database connection closed');
            process.exit(0);
        }).catch((err) => {
            logError('Error closing database connection:', err);
            process.exit(1);
        });
    });

    // Force close after 30 seconds
    setTimeout(() => {
        logError('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

// Handle different shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    logError('Uncaught Exception:', error);
    shutdown('uncaughtException');
=======
// صفحة التسجيل
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const user = await sequelize.models.User.create({ username, email, password });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

// صفحة تسجيل الدخول
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await sequelize.models.User.findOne({ where: { email, password } });
    if (user) {
      res.status(200).json({ message: 'Login successful', user });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// Serve static files (للتطبيقات التي تستخدم React أو Vue أو غيرها)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware لإدارة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
>>>>>>> 196e54b195cb7032b61bb9d291fc729b52faf9c0
});