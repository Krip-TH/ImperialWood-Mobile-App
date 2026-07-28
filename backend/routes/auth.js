const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = express.Router();

function publicUser(user) {
  return {
    id: String(user.id),
    fullName: user.full_name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.created_at,
  };
}

function createToken(user) {
  return jwt.sign(
    { id: String(user.id), username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/login', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const role = req.body.role === 'admin' ? 'admin' : 'client';

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const [rows] = await pool.execute(
      `SELECT id, full_name, username, email, phone, password_hash, role, created_at
       FROM IW_Users
       WHERE username = ? AND role = ?
       LIMIT 1`,
      [username, role]
    );
    const user = rows[0];
    const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    return res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim();
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');

    if (!fullName || !username || !email || !phone || password.length < 6) {
      return res.status(400).json({ error: 'Valid registration details are required.' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM IW_Users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      `INSERT INTO IW_Users (full_name, username, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?, 'client')`,
      [fullName, username, email, phone, passwordHash]
    );
    const [rows] = await pool.execute(
      `SELECT id, full_name, username, email, phone, role, created_at
       FROM IW_Users WHERE id = ?`,
      [result.insertId]
    );
    const user = rows[0];

    return res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email is already registered.' });
    }
    return next(error);
  }
});

module.exports = router;
