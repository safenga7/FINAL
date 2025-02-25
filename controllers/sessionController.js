const Session = require('../models/Session');

const bookSession = async (req, res) => {
  const { userId, psychologistId, date, time } = req.body;

  try {
    const session = await Session.create({ userId, psychologistId, date, time });
    res.status(201).json({ message: 'Session booked successfully', session });
  } catch (err) {
    res.status(400).json({ message: 'Error booking session', error: err.message });
  }
};

module.exports = { bookSession };