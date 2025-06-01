import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 5060;

// In-memory user database for testing
const users = [];

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword,
            role: 'user',
            subscriptionStatus: 'inactive',
            sessionsRemaining: 0
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
                subscriptionStatus: newUser.subscriptionStatus
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

        if (!user || !(await bcrypt.compare(password, user.password))) {
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
                subscriptionStatus: user.subscriptionStatus
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
            subscriptionStatus: user.subscriptionStatus
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// CSRF token endpoint (simplified for testing)
app.get('/api/csrf-token', (req, res) => {
    res.json({ token: 'test-csrf-token' });
});

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Start server
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
