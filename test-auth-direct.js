import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import { sequelize } from './src/config/db.js';
import { User } from './src/models/User.js';

// Configuration
const API_URL = 'http://localhost:5001';
const TEST_USER = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`, // Use timestamp to ensure unique email
    password: 'TestPassword123'
};

// Helper function to log with timestamp
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

// Test direct database registration
async function testDirectRegistration() {
    log('Testing direct database registration...');
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: TEST_USER.email } });
        if (existingUser) {
            log('❌ User already exists');
            return null;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
        
        // Create user
        const user = await User.create({ 
            name: TEST_USER.name, 
            email: TEST_USER.email, 
            password: hashedPassword,
            subscriptionStatus: 'inactive',
            sessionsRemaining: 0
        });

        log('✅ User created directly in database');
        log(`User ID: ${user.id}, Email: ${TEST_USER.email}`);
        return user;
    } catch (error) {
        log(`❌ Direct registration error: ${error.message}`);
        return null;
    }
}

// Test direct database login
async function testDirectLogin() {
    log('Testing direct database login...');
    try {
        // Find user
        const user = await User.findOne({ where: { email: TEST_USER.email } });
        if (!user) {
            log('❌ User not found');
            return null;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(TEST_USER.password, user.password);
        if (!isPasswordValid) {
            log('❌ Invalid password');
            return null;
        }

        log('✅ Login successful via direct database query');
        log(`User ID: ${user.id}, Email: ${user.email}`);
        return user;
    } catch (error) {
        log(`❌ Direct login error: ${error.message}`);
        return null;
    }
}

// Run all tests
async function runTests() {
    log('Starting direct database authentication tests...');
    
    try {
        // Test database connection
        await sequelize.authenticate();
        log('✅ Database connection established');
        
        // Test registration
        const registeredUser = await testDirectRegistration();
        if (!registeredUser) {
            log('❌ Registration test failed, cannot proceed with login test');
            await sequelize.close();
            return;
        }
        
        // Test login
        const loggedInUser = await testDirectLogin();
        if (!loggedInUser) {
            log('❌ Login test failed');
            await sequelize.close();
            return;
        }
        
        log('All tests completed successfully');
        
        // Close database connection
        await sequelize.close();
        log('Database connection closed');
    } catch (error) {
        log(`❌ Test error: ${error.message}`);
        try {
            await sequelize.close();
        } catch (closeError) {
            log(`❌ Error closing database connection: ${closeError.message}`);
        }
    }
}

// Run the tests
runTests();
