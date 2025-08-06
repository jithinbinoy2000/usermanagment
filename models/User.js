const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['ADMIN', 'MANAGER', 'AGENT', 'VIEWER'], default: 'VIEWER' },
  failedAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
