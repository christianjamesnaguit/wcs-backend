const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');
const { uploadAvatar } = require('../config/multer');
const bcrypt = require('bcrypt');

// User routes
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/user - Fetching user data for ${req.userId}`);
    const user = await User.findById(req.userId);
    if (!user) {
      console.log(`User not found: ${req.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`User data retrieved for ${user.username}`);
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    console.log(`PUT /api/user - Updating user data for ${req.userId}`);
    const user = await User.findById(req.userId);
    if (!user) {
      console.log(`User not found: ${req.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    const { firstName, lastName, email, username, contact, gender, address, birthDate } = req.body;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (username !== undefined) user.username = username;
    if (contact !== undefined) user.contact = contact;
    if (gender !== undefined) user.gender = gender;
    if (address !== undefined) user.address = address;
    if (birthDate !== undefined) user.birthDate = birthDate ? new Date(birthDate) : undefined;
    await user.save();
    console.log(`User updated: ${user.username}`);
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/avatar', authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    console.log(`POST /api/user/avatar - Uploading avatar for user ${req.userId}`);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const user = await User.findById(req.userId);
    if (!user) {
      console.log(`User not found: ${req.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    user.avatar = `/avatars/${req.file.filename}`;
    await user.save();
    console.log(`Avatar updated for user: ${user.username}`);
    res.json({ avatar: user.avatar });
  } catch (err) {
    console.error('Error uploading avatar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/password', authenticateToken, async (req, res) => {
  try {
    console.log(`PUT /api/user/password - Changing password for user ${req.userId}`);
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      console.log(`User not found: ${req.userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Stored password length:', user.password.length);
    console.log('Current password length:', currentPassword.length);
    let isValid;
    if (user.password.startsWith('$2b$')) {
      console.log('Password is hashed');
      isValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      console.log('Password is plain text (legacy)');
      isValid = currentPassword === user.password;
    }
    console.log('Password valid:', isValid);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    console.log(`Password changed for user: ${user.username}`);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/', authenticateToken, async (req, res) => {
  try {
    console.log(`DELETE /api/user - Deleting account for user ${req.userId}`);
    const user = await User.findById(req.userId);
    if (!user) {
      console.log(`User not found: ${req.userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    await User.findByIdAndDelete(req.userId);
    console.log(`User deleted: ${user.username}`);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
