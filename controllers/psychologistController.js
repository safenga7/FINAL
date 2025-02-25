const Psychologist = require('../models/Psychologist');

const registerPsychologist = async (req, res) => {
  const { name, email, password, specialization } = req.body;

  try {
    const psychologist = await Psychologist.create({ name, email, password, specialization });
    res.status(201).json({ message: 'Psychologist registered successfully', psychologist });
  } catch (err) {
    res.status(400).json({ message: 'Error registering psychologist', error: err.message });
  }
};

module.exports = { registerPsychologist };