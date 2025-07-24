const express = require('express');
const router = express.Router();
const tapController = require('../controllers/payments/tap_controller');
const isAuth = require('../middlewares/isAuth');

// Process payment with token
router.post('/process-token', isAuth, tapController.processTokenPayment);

module.exports = router; 