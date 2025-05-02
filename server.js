import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5091;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Simple in-memory database
let users = [];

// Load users from file if exists
try {
    const usersData = fs.readFileSync('users.json', 'utf8');
    users = JSON.parse(usersData);
    console.log(`Loaded ${users.length} users from database`);
} catch (error) {
    console.log('No existing users database found, starting with empty array');
}

// Save users to file
function saveUsers() {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    console.log(`Saved ${users.length} users to database`);
}

// Routes
app.post('/api/users/register', (req, res) => {
    try {
        const { name, email, password, phone, gender, birthdate } = req.body;

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
            phone: phone || '',
            gender: gender || '',
            birthdate: birthdate || '',
            role: 'user',
            subscriptionStatus: 'active',
            sessionsRemaining: 10
        };

        users.push(newUser);
        saveUsers();

        // Generate token
        const token = jwt.sign(
            { id: newUser.id, role: newUser.role },
            'your_jwt_secret',
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

app.post('/api/users/login', (req, res) => {
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
            'your_jwt_secret',
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

        const decoded = jwt.verify(token, 'your_jwt_secret');
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

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
