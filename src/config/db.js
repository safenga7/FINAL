import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            ssl: process.env.DB_SSL === 'true' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        retry: {
            max: 3,
            match: [
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/
            ],
            backoffBase: 1000,
            backoffExponent: 1.5,
        }
    }
);

// Handle unexpected errors
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
        process.exit(1); // Exit if we can't connect to the database
    });

// Handle connection lost and attempt reconnection
sequelize.beforeDisconnect(async (connection) => {
    console.log('Database connection lost. Attempting to reconnect...');
});

sequelize.afterDisconnect(async (connection) => {
    console.log('Reconnection attempt completed.');
});

process.on('SIGINT', async () => {
    try {
        await sequelize.close();
        console.log('Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error closing database connection:', error);
        process.exit(1);
    }
});

export { sequelize };