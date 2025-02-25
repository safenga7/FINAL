import { sequelize } from './src/config/db.js';

sequelize.sync({ force: true }) // force: true سيقوم بحذف الجداول وإعادة إنشائها
  .then(() => {
    console.log('Database synced');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error syncing database', err);
    process.exit(1);
  });