const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'CALL',
      'EMAIL',
      'VISIT',
      'NOTE',
      'PAYMENT_RECEIVED',
      'PAYMENT_FAILED',
      'ACCOUNT_UPDATED',
      'ACCOUNT_CREATED'
    ],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, 
  },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
