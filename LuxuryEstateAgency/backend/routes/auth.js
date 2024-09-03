const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const config = require('../config');

const router = express.Router();
const connection = mysql.createConnection(config.db);

connection.connect();

// Signup
router.post('/signup', async (req, res) => {
  const { fullname, email, username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (fullname, email, username, password) VALUES (?, ?, ?, ?)';
    connection.query(query, [fullname, email, username, hashedPassword], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.status(201).json({ message: 'User created' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error hashing password' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ?';

  connection.query(query, [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, 'your_jwt_secret', {
      expiresIn: '1h'
    });
    res.json({ token });
  });
});

module.exports = router;
