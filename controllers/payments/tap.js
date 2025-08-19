const axios = require('axios');
const TAP_BASE_URL = 'https://api.tap.company/v2/';

async function retrieveCharge(chargeId) {
    const res = await axios.get(`${TAP_BASE_URL}charges/${chargeId}`, {
        headers: {
            Authorization: `Bearer ${process.env.TAP_PAYMENTS_SECRET_TEST}`,
            'Content-Type': 'application/json'
        }
    });
    return res.data;
}

function computeExpectedFinal(originalAmount, discountAmount) {
    const orig = Number(originalAmount || 0);
    const disc = Number(discountAmount || 0);
    return Number((orig - disc).toFixed(2));
}

module.exports = { retrieveCharge, computeExpectedFinal };