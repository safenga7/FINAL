import express from 'express';
import { registerPsychologist } from '../controllers/psychologistController.js';

const router = express.Router();

router.post('/register', registerPsychologist);

export default router; // تصدير router كـ default