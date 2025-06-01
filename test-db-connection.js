import { sequelize } from './src/config/db.js';
import { User } from './src/models/User.js';
import bcrypt from 'bcryptjs';

async function testDatabaseConnection() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        
        // Test user creation
        const testUser = {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'TestPassword123'
        };
        
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: testUser.email } });
        if (existingUser) {
            console.log('❌ User already exists');
            await sequelize.close();
            return;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        
        // Create user
        const user = await User.create({ 
            name: testUser.name, 
            email: testUser.email, 
            password: hashedPassword,
            subscriptionStatus: 'inactive',
            sessionsRemaining: 0
        });
        
        console.log('✅ User created successfully');
        console.log(`User ID: ${user.id}, Email: ${testUser.email}`);
        
        // Test user retrieval
        const retrievedUser = await User.findOne({ where: { email: testUser.email } });
        if (retrievedUser) {
            console.log('✅ User retrieved successfully');
            console.log(`User ID: ${retrievedUser.id}, Email: ${retrievedUser.email}`);
        } else {
            console.log('❌ User retrieval failed');
        }
        
        // Close database connection
        await sequelize.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('❌ Database test failed:', error);
        try {
            await sequelize.close();
        } catch (closeError) {
            console.error('❌ Error closing database connection:', closeError);
        }
    }
}

// Run the test
testDatabaseConnection();
