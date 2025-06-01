import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
});

// General API rate limiter
export const apiLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args)
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});

// Stricter rate limiter for auth endpoints
export const authLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args)
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many authentication attempts, please try again later'
});

// AI endpoint rate limiter
export const aiLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args)
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 requests per minute
    message: 'Rate limit exceeded for AI requests'
});