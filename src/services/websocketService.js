import { WebSocketServer } from 'ws';
import { logInfo, logError } from './loggingService.js';
import { authenticateWebSocket } from '../middleware/auth.js';
import Session from '../models/Session.js';

class WebSocketService {
    constructor(server) {
        this.wss = new WebSocketServer({ server });
        this.clients = new Map(); // Map to store client connections with user IDs
        this.sessions = new Map(); // Map to store active chat sessions
        this.initialize();
    }

    async initialize() {
        this.wss.on('connection', async (ws, req) => {
            try {
                // Extract token from query string
                const url = new URL(req.url, 'ws://localhost');
                const token = url.searchParams.get('token');
                const sessionId = url.searchParams.get('sessionId');

                // Authenticate user
                const user = await authenticateWebSocket(token);
                const userId = user.id;

                // If session ID is provided, validate and join session
                if (sessionId) {
                    const session = await Session.findByPk(sessionId);
                    if (!session) {
                        throw new Error('Invalid session');
                    }

                    // Verify user is part of this session
                    if (session.userId !== userId && session.psychologistId !== userId) {
                        throw new Error('Unauthorized for this session');
                    }

                    // Join session room
                    this.joinSession(sessionId, userId, ws);
                }

                // Store the connection with user ID
                this.clients.set(userId, ws);
                logInfo(`WebSocket client connected: User ${userId}`);

                ws.on('message', async (message) => {
                    try {
                        const data = JSON.parse(message);
                        await this.handleMessage(userId, sessionId, data);
                    } catch (error) {
                        logError('WebSocket message handling error:', error);
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid message format'
                        }));
                    }
                });

                ws.on('close', () => {
                    this.handleDisconnect(userId, sessionId);
                });

                // Send initial connection success message
                ws.send(JSON.stringify({
                    type: 'connection',
                    message: 'Connected successfully',
                    userId: userId,
                    sessionId: sessionId
                }));

            } catch (error) {
                logError('WebSocket connection error:', error);
                ws.close(4002, 'Authentication failed');
            }
        });
    }

    async handleMessage(userId, sessionId, data) {
        const ws = this.clients.get(userId);
        if (!ws) return;

        switch (data.type) {
            case 'chat':
                if (!sessionId) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'No active session'
                    }));
                    return;
                }
                await this.handleChatMessage(sessionId, userId, data);
                break;

            case 'typing':
                if (sessionId) {
                    this.broadcastToSession(sessionId, {
                        type: 'typing',
                        userId: userId,
                        isTyping: data.isTyping
                    }, userId);
                }
                break;

            case 'read':
                if (sessionId) {
                    this.broadcastToSession(sessionId, {
                        type: 'read',
                        userId: userId,
                        messageIds: data.messageIds
                    }, userId);
                }
                break;

            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unknown message type'
                }));
        }
    }

    async handleChatMessage(sessionId, senderId, data) {
        try {
            // Save message to database
            const session = await Session.findByPk(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Broadcast message to session participants
            this.broadcastToSession(sessionId, {
                type: 'chat',
                message: data.message,
                senderId: senderId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logError('Error handling chat message:', error);
            const ws = this.clients.get(senderId);
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Failed to send message'
                }));
            }
        }
    }

    joinSession(sessionId, userId, ws) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, new Map());
        }
        const sessionClients = this.sessions.get(sessionId);
        sessionClients.set(userId, ws);
    }

    handleDisconnect(userId, sessionId) {
        // Remove from clients map
        this.clients.delete(userId);

        // Remove from session if applicable
        if (sessionId && this.sessions.has(sessionId)) {
            const sessionClients = this.sessions.get(sessionId);
            sessionClients.delete(userId);

            // If session is empty, clean it up
            if (sessionClients.size === 0) {
                this.sessions.delete(sessionId);
            }

            // Notify other session participants
            this.broadcastToSession(sessionId, {
                type: 'user_disconnected',
                userId: userId
            }, userId);
        }

        logInfo(`WebSocket client disconnected: User ${userId}`);
    }

    broadcastToSession(sessionId, message, excludeUserId = null) {
        const sessionClients = this.sessions.get(sessionId);
        if (!sessionClients) return;

        sessionClients.forEach((ws, userId) => {
            if (userId !== excludeUserId && ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }

    // Send message to a specific user
    sendToUser(userId, message) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    // Get active connections count
    getActiveConnections() {
        return this.clients.size;
    }

    // Get active sessions count
    getActiveSessions() {
        return this.sessions.size;
    }
}

let wsService;

export const initializeWebSocket = (server) => {
    wsService = new WebSocketService(server);
    return wsService;
};

export const getWebSocketService = () => wsService;