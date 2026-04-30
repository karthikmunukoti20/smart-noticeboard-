const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { email, password, role, company_name } = req.body;

  try {
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, role, company_name) VALUES ($1, $2, $3, $4) RETURNING id, email, role, company_name',
      [email, password_hash, role || 'buyer', company_name]
    );

    const payload = {
      user: {
        id: newUser.rows[0].id,
        role: newUser.rows[0].role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: newUser.rows[0] });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // --- START DEMO BYPASS LOGIC ---
  // These demo accounts work even without a database connection
  const demoUsers = {
    'admin':              { id: 999, role: 'admin',  email: 'admin@datamarket.com',  passes: ['admin', 'admin123', '123'] },
    'staff':              { id: 888, role: 'staff',  email: 'staff@datamarket.com',  passes: ['staff', 'staff123', '123'] },
    'seller':             { id: 777, role: 'seller', email: 'seller@datamarket.com', passes: ['seller', 'seller123', '123'] },
    'user':               { id: 666, role: 'buyer',  email: 'user@datamarket.com',   passes: ['user',  'user123',   '123'] },
    'admin@datamarket.com':  { id: 999, role: 'admin',  email: 'admin@datamarket.com',  passes: ['admin', 'admin123', '123'] },
    'staff@datamarket.com':  { id: 888, role: 'staff',  email: 'staff@datamarket.com',  passes: ['staff', 'staff123', '123'] },
    'seller@datamarket.com': { id: 777, role: 'seller', email: 'seller@datamarket.com', passes: ['seller','seller123','123'] },
    'user@datamarket.com':   { id: 666, role: 'buyer',  email: 'user@datamarket.com',   passes: ['user',  'user123',  '123'] },
  };

  const isDemoUser = demoUsers[email.toLowerCase()];
  if (isDemoUser && isDemoUser.passes.includes(password)) {
    const payload = { user: { id: isDemoUser.id, role: isDemoUser.role, email: isDemoUser.email } };
    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: isDemoUser.id, email: isDemoUser.email, role: isDemoUser.role } });
    });
  }
  // --- END DEMO BYPASS LOGIC ---

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        email: user.email
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { email: user.email, role: user.role } });
      }
    );
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ msg: 'Server connectivity issue. Using Demo Profile if available.' });
  }
});

// @route   GET api/auth/me
// @desc    Get user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const userResult = await db.query('SELECT id, email, role, company_name, contact_email FROM users WHERE id = $1', [req.user.id]);
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/admin/users
// @desc    Get all users (Admin only)
// @access  Private
router.get('/admin/users', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized as admin' });
  }
  try {
    const usersResult = await db.query('SELECT id, email, role, company_name, created_at FROM users ORDER BY created_at DESC');
    res.json(usersResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
