import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('error', (err) => console.error('Redis Client Error:', err));
redis.on('connect', () => console.log('Redis Client Connected'));

export const cacheGet = async (key) => {
    try {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Cache Get Error:', error);
        return null;
    }
};

export const cacheSet = async (key, value, expireSeconds = 3600) => {
    try {
        await redis.setex(key, expireSeconds, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Cache Set Error:', error);
        return false;
    }
};

export const cacheDelete = async (key) => {
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error('Cache Delete Error:', error);
        return false;
    }
};