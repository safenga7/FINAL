import Session from '../models/Session.js';
import { User } from '../models/User.js';
import { Psychologist } from '../models/Psychologist.js';
import { logError, logInfo } from '../services/loggingService.js';
import { getWebSocketService } from '../services/websocketService.js';

export const createSession = async (req, res) => {
    try {
        const { psychologistId, startTime } = req.body;
        const userId = req.user.id;

        const session = await Session.create({
            userId,
            psychologistId,
            startTime: new Date(startTime),
            status: 'scheduled'
        });

        logInfo(`Session created: ${session.id}`);
        res.status(201).json(session);
    } catch (error) {
        logError('Error creating session:', error);
        res.status(500).json({ message: 'Failed to create session' });
    }
};

export const getSession = async (req, res) => {
    try {
        const session = await Session.findSessionWithMessages(req.params.id, req.user.id);
        res.json(session);
    } catch (error) {
        logError('Error fetching session:', error);
        res.status(404).json({ message: 'Session not found' });
    }
};

export const getSessions = async (req, res) => {
    try {
        const sessions = await Session.findActiveSessionsForUser(req.user.id);
        res.json(sessions);
    } catch (error) {
        logError('Error fetching sessions:', error);
        res.status(500).json({ message: 'Failed to fetch sessions' });
    }
};

export const updateSession = async (req, res) => {
    try {
        const session = await Session.findSessionWithMessages(req.params.id, req.user.id);
        
        // Only allow updating specific fields
        const allowedUpdates = ['status', 'notes'];
        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        if (updates.status === 'completed') {
            updates.endTime = new Date();
        }

        await session.update(updates);
        
        // If status changed to in-progress or completed, notify via WebSocket
        if (updates.status && ['in-progress', 'completed'].includes(updates.status)) {
            const wsService = getWebSocketService();
            wsService.broadcastToSession(session.id, {
                type: 'session_update',
                sessionId: session.id,
                status: updates.status
            });
        }

        res.json(session);
    } catch (error) {
        logError('Error updating session:', error);
        res.status(500).json({ message: 'Failed to update session' });
    }
};

export const addMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const session = await Session.findSessionWithMessages(req.params.id, req.user.id);

        const message = await session.addMessage(req.user.id, content);

        // Broadcast message via WebSocket
        const wsService = getWebSocketService();
        wsService.broadcastToSession(session.id, {
            type: 'chat',
            message: {
                ...message,
                sessionId: session.id
            }
        });

        res.status(201).json(message);
    } catch (error) {
        logError('Error adding message:', error);
        res.status(500).json({ message: 'Failed to add message' });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const session = await Session.findSessionWithMessages(req.params.id, req.user.id);
        const updated = await session.markMessagesAsRead(req.user.id);

        if (updated) {
            // Notify other participants via WebSocket
            const wsService = getWebSocketService();
            wsService.broadcastToSession(session.id, {
                type: 'messages_read',
                userId: req.user.id,
                sessionId: session.id
            }, req.user.id);
        }

        res.json({ success: true });
    } catch (error) {
        logError('Error marking messages as read:', error);
        res.status(500).json({ message: 'Failed to mark messages as read' });
    }
};

export const deleteSession = async (req, res) => {
    try {
        const session = await Session.findSessionWithMessages(req.params.id, req.user.id);
        
        // Only allow cancelling future sessions
        if (session.status !== 'scheduled') {
            return res.status(400).json({ 
                message: 'Only scheduled sessions can be cancelled' 
            });
        }

        await session.update({ 
            status: 'cancelled',
            endTime: new Date()
        });

        // Notify participants via WebSocket
        const wsService = getWebSocketService();
        wsService.broadcastToSession(session.id, {
            type: 'session_cancelled',
            sessionId: session.id
        });

        res.json({ message: 'Session cancelled successfully' });
    } catch (error) {
        logError('Error cancelling session:', error);
        res.status(500).json({ message: 'Failed to cancel session' });
    }
};