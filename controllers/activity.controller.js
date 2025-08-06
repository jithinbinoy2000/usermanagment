const Activity = require('../models/Activity');
const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');


const sanitizeInput = (data) => sanitize(data);

const ALLOWED_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'OTHER'];

// Log a single activity
exports.logActivity = async (req, res) => {
  try {
    let { type, message } = req.body;
    const { id: accountId } = req.params;

    // Sanitize input
    type = sanitizeInput(type);
    message = sanitizeInput(message);

    if (!type || !message) {
      return res.status(400).json({ success: false, message: 'Type and message are required.' });
    }

    if (!ALLOWED_TYPES.includes(type.toUpperCase())) {
      return res.status(400).json({ success: false, message: `Invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}` });
    }

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ success: false, message: 'Invalid account ID.' });
    }

    const activity = new Activity({
      accountId,
      type: type.toUpperCase(),
      message,
      createdBy: req.user.id,
    });

    await activity.save();
    res.status(201).json({ success: true, message: 'Activity logged', data: activity });

  } catch (err) {
    console.error('Log Activity Error:', err.message);
    res.status(500).json({ success: false, message: 'Could not log activity' });
  }
};

//  Get activities for a single account with pagination
exports.getActivities = async (req, res) => {
  try {
    const { id: accountId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ success: false, message: 'Invalid account ID.' });
    }

    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid pagination parameters.' });
    }

    const activities = await Activity.find({ accountId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Activity.countDocuments({ accountId });

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: activities,
    });

  } catch (err) {
    console.error('Get Activities Error:', err.message);
    res.status(500).json({ success: false, message: 'Could not fetch activities' });
  }
};

// Get bulk activities for multiple accounts WITH pagination
exports.getBulkActivities = async (req, res) => {
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

    const activities = await Activity.find({ accountId: { $in: accountIds } })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Activity.countDocuments({ accountId: { $in: accountIds } });

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: activities,
    });

  } catch (err) {
    console.error('Get Bulk Activities Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve bulk activities' });
  }
};
