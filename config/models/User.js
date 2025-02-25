const pool = require('../config/db');

const getUsers = async () => {
    const result = await pool.query('SELECT * FROM Users');
    return result.rows;
};

const addUser = async (username, email, password) => {
    const result = await pool.query(
        'INSERT INTO Users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
        [username, email, password]
    );
    return result.rows[0];
};

module.exports = { getUsers, addUser };