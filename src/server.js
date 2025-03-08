import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { sequelize } from './config/db.js'; // تأكد من أن هذا الملف يحتوي على اتصال Sequelize بـ PostgreSQL
import userRoutes from './routes/userRoutes.js';
import psychologistRoutes from './routes/psychologistRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة البيانات PostgreSQL
sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Could not connect to PostgreSQL', err));

// تعريف مجلد الـ static files (مثل HTML, CSS, JS)
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));

// تعريف الـ routes
app.use('/api/users', userRoutes);
app.use('/api/psychologists', psychologistRoutes);
app.use('/api/sessions', sessionRoutes);

// صفحة التسجيل
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const user = await sequelize.models.User.create({ username, email, password });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

// صفحة تسجيل الدخول
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await sequelize.models.User.findOne({ where: { email, password } });
    if (user) {
      res.status(200).json({ message: 'Login successful', user });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// Serve static files (للتطبيقات التي تستخدم React أو Vue أو غيرها)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware لإدارة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});