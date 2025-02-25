import { sequelize } from './src/config/db.js';

sequelize.sync({ force: true })
  .then(() => {
    console.log('Database synced');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error syncing database', err);
    process.exit(1);
  });