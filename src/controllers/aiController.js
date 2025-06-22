import { generateAIResponse } from '../services/aiService.js';
import { User } from '../models/User.js';
import { logError, logInfo, logDebug } from '../services/loggingService.js';
import sanitizeHtml from 'sanitize-html';

const MAX_MESSAGE_LENGTH = 1000;

export const generateResponse = async (req, res) => {
    try {
        const { message } = req.body;

        // Input validation
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                message: 'Invalid input',
                error: 'Message is required and must be a string'
            });
        }

        if (message.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({
                message: 'Message too long',
                error: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`
            });
        }

        // Sanitize input
        const sanitizedMessage = sanitizeHtml(message, {
            allowedTags: [],
            allowedAttributes: {}
        });

        logDebug(`Processing AI request for user ${req.user.id}`);

        // For testing purposes, we'll allow all users to use the AI chat
        // In a production environment, you would want to check subscription status
        // and remaining sessions

        // Check if user has active subscription - disabled for testing
        /*
        if (req.user.subscriptionStatus !== 'active') {
            return res.status(403).json({
                message: 'Active subscription required to use AI chat'
            });
        }
        */

        // Check if user has remaining sessions - disabled for testing
        /*
        if (req.user.sessionsRemaining <= 0) {
            return res.status(403).json({
                message: 'No remaining sessions in current subscription plan'
            });
        }
        */

        // Log for testing
        logInfo(`Allowing AI chat for user ${req.user.id} regardless of subscription status`);


        // Generate response
        const aiResponse = await generateAIResponse(sanitizedMessage);

        logInfo(`Successfully generated AI response for user ${req.user.id}`);

        // Update user's session count
        await User.update(
            { sessionsRemaining: req.user.sessionsRemaining - 1 },
            { where: { id: req.user.id } }
        );

        // Get updated session count
        const updatedUser = await User.findByPk(req.user.id);

        res.json({
            response: aiResponse.response,
            cached: aiResponse.cached || false,
            sessionsRemaining: updatedUser.sessionsRemaining
        });
    } catch (error) {
        logError(error, 'AI Controller Error');

        // Handle specific error types
        if (error.message === 'AI service is not available') {
            return res.status(503).json({
                message: 'Service temporarily unavailable',
                error: 'AI service is currently offline'
            });
        }

        if (error.message === 'AI service rate limit exceeded') {
            return res.status(429).json({
                message: 'Too many requests',
                error: 'Please try again later'
            });
        }

        res.status(500).json({
            message: 'Error generating AI response',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const checkHealth = async (req, res) => {
    try {
        // Generate a simple test message to verify AI service
        const testResponse = await generateAIResponse('test health check');

        logInfo('AI health check passed');

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            latency: testResponse.latency || 'N/A'
        });
    } catch (error) {
        logError(error, 'AI Health Check Error');

        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: process.env.NODE_ENV === 'development' ? error.message : 'Service unavailable'
        });
    }
};