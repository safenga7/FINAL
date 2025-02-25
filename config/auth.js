const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const secret = 'your-secret-key';

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, secret);
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = { generateToken, verifyToken, hashPassword, comparePassword };