const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { retrieveCharge } = require('../controllers/payments/tap');
const payments = require('../controllers/payments/payment_controller');

// Rate limiting for webhook endpoints (prevent abuse)
// Tap webhooks should be infrequent - max 10 per minute per IP
const webhookLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Max 10 webhook calls per minute per IP
    message: {
        error: 'Too many webhook requests. Please contact support if this persists.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // In test mode, be more lenient with rate limiting
        return process.env.NODE_ENV !== 'production';
    }
});

// ---------- TAP WEBHOOK (SERVER-TO-SERVER) - NO AUTH NEEDED ----------
// IMPORTANT: Webhooks use signature verification, not authentication headers
// These must use RAW body so you can verify the signature and parse manually.
// Security layers:
// 1. Signature verification (HMAC-SHA256)
// 2. Rate limiting (prevent abuse)
// 3. Charge verification with Tap API (must verify charge exists)
// 4. Metadata validation (ensure charge was created by our system)
// 5. Idempotency checks (prevent duplicate processing)
router.post(
    '/complete-subscription',
    webhookLimiter, // Rate limiting
    express.raw({ type: 'application/json' }),
    payments.completeSubscription
);

router.post(
    '/complete-meal-subscription',
    webhookLimiter, // Rate limiting
    express.raw({ type: 'application/json' }),
    payments.completeMealSubscription
);

// ---------- PUBLIC FRONTEND REDIRECT PAGES (NO AUTH) ----------
// These routes are called by Tap after payment, so no authentication is required

// Page Tap redirects to after checkout; used to close WebView or show a message
router.get('/payment-close', async (req, res) => {
  console.log('[DEBUG] payment-close route called');
  console.log('[DEBUG] Query params:', JSON.stringify(req.query, null, 2));
  
  res.type('html');

  const tapId = req.query.tap_id || req.query.id || '';
  console.log('[DEBUG] Extracted tapId:', tapId);
  
  let payload = {
    ok: false,
    status: 'unknown',
    code: 'missing_tap_id',
    message: 'We could not confirm the payment.'
  };

  if (tapId) {
    try {
      console.log('[DEBUG] Retrieving charge for tapId:', tapId);
      const charge = await retrieveCharge(tapId);
      console.log('[DEBUG] Charge retrieved. Status:', charge?.status);
      console.log('[DEBUG] Full charge object:', JSON.stringify(charge, null, 2));

      // Tap basics
      const status = charge?.status || 'unknown';        // CAPTURED | FAILED | DECLINED | CANCELLED | ...
      const code   = charge?.response?.code || '';       // e.g. authentication_failed, declined, do_not_honor
      const msg    = charge?.response?.message || '';

      // Friendly mapping
      const friendly = (() => {
        if (status === 'CAPTURED') {
          return { ok: true, message: 'Payment successful.' };
        }
        if (code.includes('authentication') || /3ds|unauth/i.test(msg)) {
          return { ok: false, message: 'Your bank could not verify 3-D Secure. Please try again or use another card.' };
        }
        if (code.includes('insufficient')) {
          return { ok: false, message: 'Insufficient funds. Please try another card.' };
        }
        if (status === 'CANCELLED') {
          return { ok: false, message: 'Payment was canceled.' };
        }
        if (status === 'DECLINED') {
          return { ok: false, message: 'Your bank declined the transaction.' };
        }
        return { ok: false, message: msg || 'Payment could not be completed.' };
      })();

      payload = {
        ok: friendly.ok,
        status,
        code: code || 'unknown',
        message: friendly.message,
        tap_id: tapId,
        amount: charge?.amount,
        currency: charge?.currency,
        reference: charge?.reference?.transaction || null
      };
      console.log('[DEBUG] Payload created:', JSON.stringify(payload, null, 2));
    } catch (e) {
      console.error('[ERROR] Error retrieving charge in payment-close:', e);
      console.error('[ERROR] Error message:', e.message);
      console.error('[ERROR] Error stack:', e.stack);
      payload = {
        ok: false,
        status: 'error',
        code: 'charge_lookup_failed',
        message: 'Could not verify payment status. Please try again.',
      };
    }
  } else {
    console.log('[DEBUG] No tapId provided, using default payload');
  }

  // Minimal HTML + JS that posts result back to the host app, with fallbacks
  const json = JSON.stringify(payload).replace(/</g, '\\u003c'); // safe for inline
  console.log('[DEBUG] Sending payment-close HTML response');
  console.log('[DEBUG] Final payload:', JSON.stringify(payload, null, 2));
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${payload.ok ? 'Payment Successful' : 'Payment Status'}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;line-height:1.4}
    .ok{color:#127f2d}.bad{color:#b00020}.muted{color:#666}
    .box{border:1px solid #eee;border-radius:12px;padding:16px}
    button{padding:10px 14px;border-radius:10px;border:1px solid #ddd;background:#fafafa;cursor:pointer}
  </style>
</head>
<body>
  <div class="box">
    <h2 class="${payload.ok ? 'ok' : 'bad'}">${payload.ok ? 'Payment successful' : 'Payment not completed'}</h2>
    <p>${payload.message}</p>
    <p class="muted">Status: ${payload.status}${payload.code ? ` • Code: ${payload.code}` : ''}</p>
    <p class="muted">${payload.amount ? `Amount: ${payload.amount} ${payload.currency || ''}` : ''}</p>
    <button onclick="tryClose()">Close</button>
  </div>

  <script>
    const result = ${json};

    function postToHostApp() {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'tap_payment_result', payload: result }));
        return true;
      }
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.close) {
        window.webkit.messageHandlers.close.postMessage(JSON.stringify({ type: 'tap_payment_result', payload: result }));
        return true;
      }
      return false;
    }

    function tryClose() {
      const posted = postToHostApp();
      if (!posted) {
        // best-effort browser close
        window.close();
      }
    }

    // Auto-post on load
    (function(){ tryClose(); })();
  </script>
</body>
</html>`);
});


// (Optional) Success page if you want a user-facing confirmation route
router.get('/payment-success', (req, res) => {
    console.log('[DEBUG] payment-success route called');
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

