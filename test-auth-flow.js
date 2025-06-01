import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://localhost:5010';
const TEST_USER = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`, // Use timestamp to ensure unique email
    password: 'TestPassword123'
};

// Helper function to log with timestamp
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

// Test registration
async function testRegistration() {
    log('Testing registration...');
    try {
        const response = await fetch(`${API_URL}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(TEST_USER)
        });

        const data = await response.json();
        
        if (response.ok) {
            log('✅ Registration successful');
            log(`User created with email: ${TEST_USER.email}`);
            return data.token;
        } else {
            log('❌ Registration failed');
            log(`Error: ${JSON.stringify(data)}`);
            return null;
        }
    } catch (error) {
        log(`❌ Registration error: ${error.message}`);
        return null;
    }
}

// Test login
async function testLogin() {
    log('Testing login...');
    try {
        const response = await fetch(`${API_URL}/api/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: TEST_USER.email,
                password: TEST_USER.password
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            log('✅ Login successful');
            return data.token;
        } else {
            log('❌ Login failed');
            log(`Error: ${JSON.stringify(data)}`);
            return null;
        }
    } catch (error) {
        log(`❌ Login error: ${error.message}`);
        return null;
    }
}

// Test user profile retrieval
async function testGetProfile(token) {
    log('Testing profile retrieval...');
    try {
        const response = await fetch(`${API_URL}/api/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            log('✅ Profile retrieval successful');
            log(`Profile data: ${JSON.stringify(data)}`);
            return true;
        } else {
            log('❌ Profile retrieval failed');
            log(`Error: ${JSON.stringify(data)}`);
            return false;
        }
    } catch (error) {
        log(`❌ Profile retrieval error: ${error.message}`);
        return false;
    }
}

// Run all tests
async function runTests() {
    log('Starting authentication tests...');
    
    // Test registration
    const registrationToken = await testRegistration();
    if (!registrationToken) {
        log('❌ Registration test failed, cannot proceed with login test');
        return;
    }
    
    // Test profile retrieval with registration token
    await testGetProfile(registrationToken);
    
    // Test login
    const loginToken = await testLogin();
    if (!loginToken) {
        log('❌ Login test failed, cannot proceed with profile test');
        return;
    }
    
    // Test profile retrieval with login token
    await testGetProfile(loginToken);
    
    log('All tests completed');
}

// Run the tests
runTests();
