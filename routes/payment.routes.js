//routes\payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller'); 
const auth = require('../middleware/auth.middleware');

router.post('/accounts/:id/payments', auth, paymentController.recordPayment);
router.get('/accounts/:id/payments', auth, paymentController.getPayments);
router.put('/payments/:id', auth, paymentController.updatePaymentStatus);

module.exports = router;
