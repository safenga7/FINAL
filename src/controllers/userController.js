import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists',
                errors: { email: 'Email already registered' }
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ 
            name, 
            email, 
            password: hashedPassword,
            subscriptionStatus: 'inactive',
            sessionsRemaining: 0
        });

        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'User registered successfully', 
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus
            }
        });
    } catch (err) {
        res.status(400).json({ 
            message: 'Error registering user', 
            error: err.message 
        });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ 
                message: 'Invalid credentials',
                errors: { 
                    email: 'Invalid email or password' 
                }
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

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
    } catch (err) {
        res.status(400).json({ 
            message: 'Error logging in', 
            error: err.message 
        });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionPlan: user.subscriptionPlan,
            sessionsRemaining: user.sessionsRemaining,
            subscriptionEndDate: user.subscriptionEndDate
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching user profile',
            error: error.message 
        });
    }
};

export { registerUser, loginUser, getUserProfile };