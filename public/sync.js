import { sequelize } from './src/config/db.js';
import { User } from './src/models/User.js';
import { Psychologist } from './src/models/Psychologist.js';
import Session from './src/models/Session.js';
import dotenv from 'dotenv';

dotenv.config();

// Define model relationships
User.hasMany(Session);
Session.belongsTo(User);

Psychologist.hasMany(Session);
Session.belongsTo(Psychologist);

// Sync database with force option based on environment
const shouldForce = process.env.NODE_ENV === 'development' && process.argv.includes('--force');

sequelize.sync({ force: shouldForce })
  .then(() => {
    console.log('Database synced successfully');
    if (shouldForce) {
      console.log('Database was force reset');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error syncing database:', err);
    process.exit(1);
  });