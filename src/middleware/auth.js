import jwt from 'jsonwebtoken';
import { logError } from '../services/loggingService.js';
import { User } from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        logError('Authentication error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

export const authenticateWebSocket = async (token) => {
    try {
        if (!token) {
            throw new Error('Authentication token required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    } catch (error) {
        logError('WebSocket authentication error:', error);
        throw error;
    }
};

export const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (req.user.role !== role) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};