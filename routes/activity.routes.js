//routes\activity.routes.js
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const auth = require('../middleware/auth.middleware');

router.post('/accounts/:id/activities', auth, activityController.logActivity);
router.get('/accounts/:id/activities', auth, activityController.getActivities);
router.get('/activities/bulk', auth, activityController.getBulkActivities);

module.exports = router;
