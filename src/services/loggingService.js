import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'warn';
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }),
    new winston.transports.File({ filename: 'logs/all.log' }),
];

const Logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

export const logError = (error, context = '') => {
    const errorMessage = error instanceof Error ? error.stack : error.toString();
    Logger.error(`${context}: ${errorMessage}`);
};

export const logInfo = (message) => {
    Logger.info(message);
};

export const logWarning = (message) => {
    Logger.warn(message);
};

export const logDebug = (message) => {
    Logger.debug(message);
};

export const logHttpRequest = (req, res, next) => {
    Logger.http(`${req.method} ${req.url}`);
    next();
};

export default Logger;