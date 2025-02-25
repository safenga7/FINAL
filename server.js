const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة البيانات
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ryadom_db',
    password: 'your_password',
    port: 5432,
});

// API علشان تجيب كل المستخدمين
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// API علشان تضيف موعد جديد
app.post('/appointments', async (req, res) => {
    const { user_id, psychologist_id, appointment_date, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO Appointments (user_id, psychologist_id, appointment_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, psychologist_id, appointment_date, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});