const Account = require('../models/Account');
const { validationResult } = require('express-validator');
const cache = require('../utils/cache');
const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');

const sanitizeInput = (data) => sanitize(data);

//  sort fields
const allowedSortFields = ['createdAt', 'name', 'email', 'balance'];

// Create Account
exports.createAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let { name, email, phone, address, balance } = req.body;
    name = sanitizeInput(name);
    email = sanitizeInput(email);
    phone = sanitizeInput(phone);
    address = address ? sanitizeInput(address) : {};
    balance = sanitizeInput(balance);

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
    }

    const existingEmail = await Account.findOne({ email, isDeleted: false });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }

    const existingPhone = await Account.findOne({ phone, isDeleted: false });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Phone number already exists.' });
    }

    const account = new Account({
      name,
      email,
      phone,
      address,
      balance: balance || 0,
      createdBy: req.user.id
    });

    await account.save();

    // Invalidate all account lists for this user
    await cache.delPattern(`user_accounts:${req.user.id}:*`);

    // Cache this account
    await cache.set(cache.generateKey('account', account._id, req.user.id), account, 1800);

    return res.status(201).json({ success: true, message: 'Account created', data: account });
  } catch (err) {
    console.error('Create Account Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};

// Get all accounts
exports.getAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    let { page = 1, limit = 10, sort = 'createdAt', status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid pagination parameters.' });
    }

    if (!allowedSortFields.includes(sort)) sort = 'createdAt';

    const cacheKey = cache.generateKey('user_accounts', userId, page, limit, status || 'all', sort);
    let result = await cache.get(cacheKey);
    const fromCache = !!result;

    if (!result) {
      const filter = { isDeleted: false };
      if (status) filter.status = sanitizeInput(status);

      const accounts = await Account.find(filter)
        .sort({ [sort]: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const count = await Account.countDocuments(filter);

      result = { total: count, page, limit, data: accounts };

      await cache.set(cacheKey, result, 900);
    }

    res.json({ success: true, ...result, fromCache });
  } catch (err) {
    console.error('Get Accounts Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get accounts.' });
  }
};

// Get account by ID
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid account ID.' });
    }

    const userId = req.user.id;
    const cacheKey = cache.generateKey('account', id, userId);
    let account = await cache.get(cacheKey);

    if (!account) {
      account = await Account.findById(id);
      if (!account || account.isDeleted) {
        return res.status(404).json({ success: false, message: 'Account not found.' });
      }

      await cache.set(cacheKey, account, 1800);
    }

    res.json({ success: true, data: account });
  } catch (err) {
    console.error('Get Account By ID Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get account.' });
  }
};

// Update account
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid account ID.' });
    }

    const updates = sanitizeInput(req.body);
    const allowedUpdates = ['name', 'phone', 'address', 'status', 'balance'];
    const invalidFields = Object.keys(updates).filter(key => !allowedUpdates.includes(key));

    if (invalidFields.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid fields: ${invalidFields.join(', ')}` });
    }

    if (updates.email) {
      return res.status(400).json({ success: false, message: 'Email cannot be updated.' });
    }

    if (updates.phone) {
      const existingPhone = await Account.findOne({ phone: updates.phone, _id: { $ne: id }, isDeleted: false });
      if (existingPhone) {
        return res.status(409).json({ success: false, message: 'Phone number already exists.' });
      }
    }

    const userId = req.user.id;

    const account = await Account.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updates },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    await cache.set(cache.generateKey('account', id, userId), account, 1800);
    await cache.delPattern(`user_accounts:${userId}:*`);

    res.json({ success: true, message: 'Account updated', data: account });
  } catch (err) {
    console.error('Update Account Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update account.' });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid account ID.' });
    }

    const userId = req.user.id;

    const account = await Account.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    await cache.del(cache.generateKey('account', id, userId));
    await cache.delPattern(`user_accounts:${userId}:*`);

    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    console.error('Delete Account Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
};
