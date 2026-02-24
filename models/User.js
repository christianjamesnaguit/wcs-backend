const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  birthDate: Date,
  avatar: { type: String, default: 'https://placehold.co/200x200?text=User' },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
