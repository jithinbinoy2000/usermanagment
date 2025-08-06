//routes\account.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/account.controller');
const auth = require('../middleware/auth.middleware');
const { validateAccount } = require('../middleware/validateAccount');
const cacheMiddleware = require('../middleware/cache.middleware');

router.get('/', auth, cacheMiddleware(3600), controller.getAccounts); 
router.post('/', auth, validateAccount, controller.createAccount);
router.get('/:id', auth,cacheMiddleware(3600), controller.getAccountById);
router.put('/:id', auth, controller.updateAccount);
router.delete('/:id', auth, controller.deleteAccount);

module.exports = router;
