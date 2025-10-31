const express = require('express');
const router = express.Router();
const { retrieveCharge } = require('../controllers/payments/tap');



// If you have auth middleware, import it
// const requireAuth = require('../middleware/requireAuth');

const payments = require('../controllers/payments/payment_controller');

// ---------- FRONTEND-CALLED ROUTES (JSON) ----------
// Create a Tap payment link for a fitness package
router.post(
    '/subscribe-package',
    /* requireAuth, */            // uncomment if you use auth
    express.json(),               // normal JSON body
    payments.subscribeToPackage
);

// Create a Tap payment link for a meal plan
router.post(
    '/subscribe-meal',
    /* requireAuth, */
    express.json(),
    payments.subscribeToMealPlan
);

// NOTE: Webhook routes (complete-subscription, complete-meal-subscription) have been moved to 
// routes/payment_public_route.js to avoid requiring authentication (webhooks use signature verification)
// 
// NOTE: Public redirect routes (payment-close, payment-success) have also been moved to 
// routes/payment_public_route.js to avoid requiring authentication

module.exports = router;

