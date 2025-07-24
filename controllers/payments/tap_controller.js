const axios = require('axios');
const tapConfig = require('../../config/tap_config');

// Create Tap API instance
const tapAPI = axios.create({
    baseURL: tapConfig.baseURL,
    headers: {
        'Authorization': `Bearer ${tapConfig.secretKey}`,
        'Content-Type': 'application/json'
    }
});

/**
 * Verify webhook signature from Tap
 * @param {string} payload - Webhook payload
 * @param {string} signature - Webhook signature from headers
 * @returns {boolean} Whether signature is valid
 */
function verifyWebhookSignature(payload, signature) {
    try {
        if (!tapConfig.webhookSecret || !signature) {
            console.warn('Webhook secret or signature missing');
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', tapConfig.webhookSecret)
            .update(payload, 'utf8')
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        console.error('Webhook signature verification error:', error);
        return false;
    }
}

/**
 * Process payment with token from frontend
 */
async function processPaymentWithToken(paymentData) {
    try {
        const {
            amount,
            currency = tapConfig.defaultCurrency,
            token,
            customer,
            metadata = {},
            description = 'Payment'
        } = paymentData;

        // Validate required fields
        if (!token) {
            throw new Error('Payment token is required');
        }
        if (!amount || !customer || !customer.email) {
            throw new Error('Amount, customer, and customer email are required');
        }

        const chargeData = {
            amount: Number(amount),
            currency: currency,
            source: { id: token },
            customer: {
                email: customer.email,
                first_name: customer.first_name || '',
                last_name: customer.last_name || ''
            },
            metadata: metadata,
            description: description,
            receipt: { email: true, sms: true }
        };

        console.log('Processing payment with token:', token);

        const response = await tapAPI.post('/charges', chargeData);

        return {
            success: true,
            charge_id: response.data.id,
            status: response.data.status,
            amount: response.data.amount,
            currency: response.data.currency,
            message: 'Payment processed successfully'
        };

    } catch (error) {
        console.error('Payment Error:', error.response?.data || error.message);

        return {
            success: false,
            message: 'Payment failed',
            error: error.response?.data || error.message
        };
    }
}

/**
 * Express route: Process payment with token
 */
exports.processTokenPayment = async (req, res, next) => {
    try {
        const result = await processPaymentWithToken(req.body);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        next(error);
    }
};

// Export the function for use in other controllers
module.exports = {
    processPaymentWithToken,
    processTokenPayment: exports.processTokenPayment
};