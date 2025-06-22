import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';

const app = express();
const server = createServer(app);
const PORT = 5095;

// Middleware
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(bodyParser.json());
app.use(express.static('./'));

// Simple in-memory storage for testing
const users = [];
const messages = [];

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data);
            
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
            console.error('Error handling WebSocket message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
    
    // Send initial connection success message
    ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected successfully'
    }));
});

// Routes
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists',
                errors: { email: 'Email already registered' }
            });
        }
        
        // Create new user
        const newUser = { 
            id: users.length + 1,
            name, 
            email, 
            password,
            role: 'user',
            subscriptionStatus: 'active',
            sessionsRemaining: 10
        };
        
        users.push(newUser);
        
        // Generate token
        const token = jwt.sign(
            { id: newUser.id, role: newUser.role }, 
            'test_secret_key', 
            { expiresIn: '24h' }
        );
        
        console.log(`User registered: ${email}`);
        
        res.status(201).json({ 
            message: 'User registered successfully', 
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                subscriptionStatus: newUser.subscriptionStatus,
                sessionsRemaining: newUser.sessionsRemaining
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Error registering user', 
            error: error.message 
        });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = users.find(user => user.email === email);
        
        if (!user || user.password !== password) {
            return res.status(400).json({ 
                message: 'Invalid credentials',
                errors: { 
                    email: 'Invalid email or password' 
                }
            });
        }
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            'test_secret_key', 
            { expiresIn: '24h' }
        );
        
        console.log(`User logged in: ${email}`);
        
        res.json({ 
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus,
                sessionsRemaining: user.sessionsRemaining
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Error logging in', 
            error: error.message 
        });
    }
});

app.get('/api/users/me', (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }
        
        const decoded = jwt.verify(token, 'test_secret_key');
        const user = users.find(user => user.id === decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
            sessionsRemaining: user.sessionsRemaining
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

app.post('/api/ai/generate', (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }
        
        // Generate a simple response for testing
        const response = `This is a test response to: "${message}". In a production environment, this would be generated by an AI model.`;
        
        console.log(`AI response generated for message: ${message}`);
        
        res.json({
            response,
            sessionsRemaining: 10
        });
    } catch (error) {
        console.error('AI error:', error);
        res.status(500).json({ message: 'Error generating AI response' });
    }
});

// CSRF token endpoint (simplified for testing)
app.get('/api/csrf-token', (req, res) => {
    res.json({ token: 'test-csrf-token' });
});

// Start server
server.listen(PORT, () => {
    console.log(`Chat server running on port ${PORT}`);
});
