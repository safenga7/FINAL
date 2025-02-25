const express = require('express');
const { getAllUsers, createUser } = require('../controllers/userController');

const router = express.Router();

router.get('/', getAllUsers);
router.post('/', createUser);

module.exports = router;
router.get('/:id', userController.getUser);
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

module.exports = router;
