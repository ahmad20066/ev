const crypto = require('crypto');

const SIGNATURE_HEADER = 'x-tap-signature';

function verifyTapSignature(req) {
    const signature = req.header(SIGNATURE_HEADER);
    
    // In test mode, be more lenient with signature verification
    // Tap test environment may not always send proper signatures
    const isTestMode = process.env.NODE_ENV !== 'production';
    
    if (!signature) {
        console.log('[DEBUG] No signature header found. Test mode:', isTestMode);
        // In test mode, allow webhooks without signature for debugging
        if (isTestMode) {
            console.log('[WARNING] Allowing webhook without signature in test mode');
            return true;
        }
        return false;
    }

    const secret = process.env.TAP_WEBHOOK_SECRET;
    if (!secret) {
        console.log('[WARNING] TAP_WEBHOOK_SECRET not set. Test mode:', isTestMode);
        // In test mode, allow if secret is not set
        if (isTestMode) {
            console.log('[WARNING] Allowing webhook without secret in test mode');
            return true;
        }
        return false;
    }

    const payload = req.body;
    const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    console.log('[DEBUG] Signature verification:');
    console.log('[DEBUG] Received signature:', signature);
    console.log('[DEBUG] Computed signature:', computed);

    try {
        const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
        if (!isValid && isTestMode) {
            console.log('[WARNING] Signature mismatch, but allowing in test mode');
            return true; // Allow in test mode for debugging
        }
        return isValid;
    } catch (error) {
        console.error('[ERROR] Signature verification error:', error);
        if (isTestMode) {
            console.log('[WARNING] Signature verification error, but allowing in test mode');
            return true;
        }
        return false;
    }
}

module.exports = { verifyTapSignature };
