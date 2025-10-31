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




// ---------- TAP WEBHOOK (SERVER-TO-SERVER) ----------
// IMPORTANT: These must use RAW body so you can verify the signature and parse manually.
router.post(
    '/complete-subscription',
    express.raw({ type: 'application/json' }),
    payments.completeSubscription
);

router.post(
    '/complete-meal-subscription',
    express.raw({ type: 'application/json' }),
    payments.completeMealSubscription
);


// NOTE: Public redirect routes (payment-close, payment-success) have been moved to 
// routes/payment_public_route.js to avoid requiring authentication

module.exports = router;

