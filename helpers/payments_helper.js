const crypto = require('crypto');

// Tap Payments uses 'hashstring' header for webhook signatures
const SIGNATURE_HEADER = 'hashstring';
const ALTERNATIVE_HEADER = 'x-tap-signature'; // Some versions might use this

function verifyTapSignature(req) {
    // Try hashstring first (Tap's standard), then fallback to x-tap-signature
    const signature = req.header(SIGNATURE_HEADER) || req.header(ALTERNATIVE_HEADER);
    const isTestMode = process.env.NODE_ENV !== 'production';
    
    // SECURITY: In production, signature is REQUIRED
    if (!signature) {
        console.log('[SECURITY] No signature header found. Test mode:', isTestMode);
        if (isTestMode) {
            console.log('[WARNING] Allowing webhook without signature in test mode only');
            return true; // Only allow in test mode
        }
        console.error('[SECURITY] Missing signature header - rejecting webhook');
        return false;
    }

    const secret = process.env.TAP_WEBHOOK_SECRET;
    if (!secret) {
        console.log('[WARNING] TAP_WEBHOOK_SECRET not set. Test mode:', isTestMode);
        if (isTestMode) {
            console.log('[WARNING] Allowing webhook without secret in test mode only');
            return true; // Only allow in test mode
        }
        console.error('[SECURITY] TAP_WEBHOOK_SECRET not configured - rejecting webhook');
        return false;
    }

    // Get raw body for signature verification
    // Note: If body is already parsed, we need the raw string
    let rawPayload;
    if (Buffer.isBuffer(req.body)) {
        // Body is raw buffer - use it directly
        rawPayload = req.body;
    } else if (typeof req.body === 'object' && req.body !== null) {
        // Body was already parsed - need to stringify for verification
        // However, this is not ideal - we should use raw body
        // For now, stringify and use it
        rawPayload = Buffer.from(JSON.stringify(req.body), 'utf8');
        console.log('[WARNING] Body was already parsed - using stringified version for signature');
    } else if (typeof req.body === 'string') {
        rawPayload = Buffer.from(req.body, 'utf8');
    } else {
        console.error('[SECURITY] Invalid payload for signature verification');
        return false;
    }

    const computed = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

    if (isTestMode) {
        console.log('[DEBUG] Signature verification (test mode):');
        console.log('[DEBUG] Received signature:', signature);
        console.log('[DEBUG] Computed signature:', computed);
    }

    try {
        const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
        if (!isValid) {
            if (isTestMode) {
                console.log('[WARNING] Signature mismatch, but allowing in test mode only');
                return true; // Only allow in test mode
            }
            console.error('[SECURITY] Signature verification failed - possible webhook spoofing');
            return false;
        }
        
        if (!isTestMode) {
            console.log('[SECURITY] Signature verified successfully');
        }
        return true;
    } catch (error) {
        console.error('[ERROR] Signature verification error:', error);
        if (isTestMode) {
            console.log('[WARNING] Signature verification error, but allowing in test mode only');
            return true; // Only allow in test mode
        }
        return false;
    }
}

module.exports = { verifyTapSignature };
