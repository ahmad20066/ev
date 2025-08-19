const crypto = require('crypto');

const SIGNATURE_HEADER = 'x-tap-signature';

function verifyTapSignature(req) {
    const signature = req.header(SIGNATURE_HEADER);
    if (!signature) return false;

    const secret = process.env.TAP_WEBHOOK_SECRET;
    if (!secret) return false;

    const payload = req.body;
    const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
    } catch {
        return false;
    }
}

module.exports = { verifyTapSignature };
