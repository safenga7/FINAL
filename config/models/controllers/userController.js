const { getUsers, addUser } = require('../models/User');

const getAllUsers = async (req, res) => {
    try {
        const users = await getUsers();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

const createUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const user = await addUser(username, email, password);
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

module.exports = { getAllUsers, createUser };