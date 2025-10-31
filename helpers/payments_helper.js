const crypto = require('crypto');

const SIGNATURE_HEADER = 'x-tap-signature';

function verifyTapSignature(req) {
    const signature = req.header(SIGNATURE_HEADER);
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

    const payload = req.body;
    if (!payload || !Buffer.isBuffer(payload)) {
        console.error('[SECURITY] Invalid payload for signature verification');
        return false;
    }

    const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');

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
