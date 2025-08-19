require('dotenv').config();

const tapConfig = {
    // Sandbox/Production URLs
    baseURL: process.env.TAP_ENVIRONMENT === 'production'
        ? 'https://api.tap.company/v2'
        : 'https://api.tap.company/v2',

    // API Keys
    secretKey: process.env.TAP_PAYMENTS_SECRET_TEST,
    publishableKey: process.env.TAP_PUBLISHABLE_KEY,

    // Webhook settings
    webhookSecret: process.env.TAP_WEBHOOK_SECRET,

    // Application settings
    applicationName: "Evolve App",

    // Currency settings (adjust based on your region)
    defaultCurrency: process.env.TAP_DEFAULT_CURRENCY || 'SAR',

    // Return URLs
    returnURL: process.env.TAP_RETURN_URL || `${process.env.BASE_URL}/payments/callback`,
    cancelURL: process.env.TAP_CANCEL_URL || `${process.env.BASE_URL}/payments/cancel`,
    webhookURL: process.env.TAP_WEBHOOK_URL || `${process.env.BASE_URL}/payments/webhook`,

    // Environment
    environment: process.env.TAP_ENVIRONMENT || 'sandbox'
};

// Validate required configuration
const requiredKeys = ['secretKey', 'publishableKey'];
const missingKeys = requiredKeys.filter(key => !tapConfig[key]);

if (missingKeys.length > 0) {
    console.error('Missing required Tap configuration:', missingKeys);
    console.error('Please set the following environment variables:');
    missingKeys.forEach(key => {
        console.error(`- TAP_${key.toUpperCase()}`);
    });
}

module.exports = tapConfig; 