const express = require('express');
const { registerPsychologist } = require('../controllers/psychologistController');

const router = express.Router();

router.post('/register', registerPsychologist);

module.exports = router;