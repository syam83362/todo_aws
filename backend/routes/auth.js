const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'Name, email and password are required' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const payload = { id: user._id.toString(), email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: { id: user._id.toString(), name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    // Handle duplicate key race condition
    if (err.code === 11000) {
      return res.status(409).json({ message: 'User already exists' });
    }
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user._id.toString(), email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user._id.toString(), name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

