const Payment = require('../models/Payment');
const Account = require('../models/Account');
const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');
// Allowed statuses for payment
const VALID_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

// Utility function to sanitize input
const sanitizeInput = (data) => sanitize(data);

// Record Payment
exports.recordPayment = async (req, res) => {
  try {
    const { id: accountId } = req.params;
    let { amount, method, transactionId } = req.body;

    // Sanitize inputs
    amount = sanitizeInput(amount);
    method = sanitizeInput(method);
    transactionId = sanitizeInput(transactionId);

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a valid number greater than 0' });
    }

    // Validate accountId
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ success: false, message: 'Invalid account ID' });
    }

    // Check if account exists
    const account = await Account.findOne({ _id: accountId, isDeleted: false });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    // Ensure sufficient balance
    if (account.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient account balance' });
    }

    // Optional: Check for duplicate transactionId
    if (transactionId) {
      const duplicate = await Payment.findOne({ transactionId });
      if (duplicate) return res.status(409).json({ success: false, message: 'Duplicate transaction ID' });
    }

    // Create payment record
    const payment = new Payment({
      account: accountId,
      amount,
      method: method || 'UNKNOWN',
      transactionId: transactionId || null,
      status: 'COMPLETED', // Default to completed
      createdBy: req.user.id,
    });

    await payment.save();

    // Update account balance
    account.balance -= amount;
    await account.save();

    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });

  } catch (error) {
    console.error('Error recording payment:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//  Get Payment History for an Account (with pagination)
exports.getPayments = async (req, res) => {
  try {
    const { id: accountId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Validate accountId
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ success: false, message: 'Invalid account ID' });
    }

    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid pagination parameters' });
    }

    const payments = await Payment.find({ account: accountId })
      .sort({ paidAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Payment.countDocuments({ account: accountId });

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: payments,
    });

  } catch (error) {
    console.error('Error fetching payments:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
};

//  Get Bulk Payments for Multiple Accounts (with pagination)
exports.getBulkPayments = async (req, res) => {
  try {
    const { accountIds = [] } = req.body;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide accountIds as an array.' });
    }

    // Validate all IDs
    const invalidIds = accountIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid account IDs: ${invalidIds.join(', ')}` });
    }

    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid pagination parameters.' });
    }

    const payments = await Payment.find({ account: { $in: accountIds } })
      .sort({ paidAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Payment.countDocuments({ account: { $in: accountIds } });

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: payments,
    });

  } catch (err) {
    console.error('Get Bulk Payments Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve bulk payments' });
  }
};

//  Update Payment Status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id: paymentId } = req.params;
    let { status } = req.body;

    // Sanitize input
    status = sanitizeInput(status);

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid payment status. Allowed: ${VALID_STATUSES.join(', ')}` });
    }

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.status = status;
    await payment.save();

    res.status(200).json({ success: true, message: 'Payment status updated', data: payment });

  } catch (error) {
    console.error('Error updating payment:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update payment status' });
  }
};
