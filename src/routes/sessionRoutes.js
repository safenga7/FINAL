import express from 'express';
import { bookSession } from '../controllers/sessionController.js';

const router = express.Router();

router.post('/book', bookSession);

export default router; // تصدير router كـ default