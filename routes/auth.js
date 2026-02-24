const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Auth routes
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, contact, gender, address, birthDate } = req.body;
    console.log(`POST /api/signup - Attempting to sign up user: ${username} (${email})`);

    // Validate required fields
    if (!firstName || !lastName || !email || !username || !password) {
      console.log('Signup failed: Missing required fields');
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log(`Signup failed: User already exists - ${username} or ${email}`);
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      contact,
      gender,
      address,
      birthDate: birthDate ? new Date(birthDate) : undefined,
    });

    await newUser.save();
    console.log(`User signed up successfully: ${newUser.username} (ID: ${newUser._id})`);

    // Generate JWT
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    // Return user and token
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Error during signup:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`POST /api/login - Attempting login for: ${username}`);

    if (!username || !password) {
      console.log('Login failed: Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username or email
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
      console.log(`Login failed: User not found - ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log(`Login failed: Invalid password for user - ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`User logged in successfully: ${user.username} (ID: ${user._id})`);

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    // Return user and token
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    console.log(`POST /api/change-password - Request for: ${username}`);

    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Username and new password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log(`Change password failed: User not found - ${username}`);
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log(`Password changed successfully for user: ${user.username}`);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error during change password:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
