import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { logInfo, logError } from '../services/loggingService.js';

dotenv.config();

// Connection state tracking
let isConnecting = false;
let isConnected = false;
let reconnectTimer = null;
const maxReconnectAttempts = 5;
let reconnectAttempts = 0;

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 20000,
            evict: 30000
        },
        dialectOptions: {
            ssl: process.env.DB_SSL === 'true' ? {
                require: true,
                rejectUnauthorized: false
            } : false,
            connectTimeout: 30000,
            keepAlive: true
        },
        retry: {
            max: 3,
            timeout: 30000,
            match: [
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/,
                /TimeoutError/,
                /deadlock detected/i
            ],
            backoffBase: 3000,
            backoffExponent: 1.2,
            report: (msg) => logError('Database retry:', msg)
        }
    }
);

const connectWithRetry = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) return;
    isConnecting = true;

    try {
        await sequelize.authenticate();
        isConnected = true;
        isConnecting = false;
        reconnectAttempts = 0;
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        logInfo('Database connection established successfully.');
    } catch (err) {
        isConnecting = false;
        logError('Unable to connect to the database:', err);
        
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(3000 * Math.pow(1.5, reconnectAttempts), 30000);
            logInfo(`Attempting reconnection in ${delay/1000} seconds...`);
            
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(connectWithRetry, delay);
        } else {
            logError('Max reconnection attempts reached. Exiting...');
            process.exit(1);
        }
    }
};

// Handle connection events
sequelize.afterConnect(() => {
    if (!isConnected) {
        isConnected = true;
        logInfo('Database connection established.');
    }
});

sequelize.beforeDisconnect(() => {
    if (isConnected) {
        isConnected = false;
        logInfo('Database connection lost.');
    }
});

// Only attempt reconnect if we're not already trying to connect
sequelize.afterDisconnect(() => {
    if (!isConnected && !isConnecting && reconnectAttempts < maxReconnectAttempts) {
        connectWithRetry();
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
        }
        await sequelize.close();
        logInfo('Database connection closed gracefully.');
        process.exit(0);
    } catch (error) {
        logError('Error closing database connection:', error);
        process.exit(1);
    }
});

// Initial connection
connectWithRetry();

export { sequelize };