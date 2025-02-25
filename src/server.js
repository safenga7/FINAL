import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import psychologistRoutes from './routes/psychologistRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { sequelize } from './config/db.js';

// تحميل متغيرات البيئة من ملف .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة البيانات
sequelize.authenticate()
  .then(() => {
    console.log('Connected to PostgreSQL');
  })
  .catch(err => {
    console.error('Could not connect to PostgreSQL', err);
  });

// تعريف المسارات
app.use('/api/users', userRoutes);
app.use('/api/psychologists', psychologistRoutes);
app.use('/api/sessions', sessionRoutes);

// Middleware لإدارة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// بدء تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});