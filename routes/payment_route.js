const express = require('express');
const router = express.Router();



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


// ---------- FRONTEND REDIRECT PAGES ----------
// Page Tap redirects to after checkout; used to close WebView or show a message
router.get('/payment-close', (req, res) => {
    // Minimal HTML that signals your mobile WebView to close, with safe fallbacks
    res.type('html').send(`
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Closing…</title></head>
  <body>
    <script>
      try {
        // React Native WebView close
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage("close");
        }
        // iOS WKWebView message handler (if you added one named "close")
        else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.close) {
          window.webkit.messageHandlers.close.postMessage("close");
        } else {
          // Attempt to close browser tab as a fallback
          window.close();
        }
      } catch (e) {}
      // Optional: show a simple message if close didn't work
    </script>
    <p>Processing your payment… you can close this window.</p>
  </body>
</html>`);
});

// (Optional) Success page if you want a user-facing confirmation route
router.get('/payment-success', (req, res) => {
    res.type('html').send(`
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Payment Successful</title></head>
  <body>
    <h1>Payment Successful</h1>
    <p>Your subscription is being activated.</p>
  </body>
</html>`);
});

module.exports = router;

