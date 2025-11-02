const Coupon = require('../../models/fitness/coupon');
const MealDay = require('../../models/meals/meal_day');
const Meal = require('../../models/meals/meal');
const MealPlan = require('../../models/meals/meal_plan');
const Type = require('../../models/meals/type');
const UserMealSelection = require('../../models/meals/user_meal_selection');
const Package = require('../../models/package');
const PricingModel = require('../../models/pricing_model');
const Subscription = require('../../models/subscription');
const User = require('../../models/user');

const axios = require('axios');
const MealSubscription = require('../../models/meals/meal_subscription');
const Address = require('../../models/meals/address');
const DeliveryTime = require('../../models/meals/delivery_time');
const { Op } = require('sequelize');
const { computeExpectedFinal, retrieveCharge } = require('./tap');
const { verifyTapSignature } = require('../../helpers/payments_helper');
const TAP_BASE_URL = 'https://api.tap.company/v2/';
const appleReceiptVerify = require('node-apple-receipt-verify');

// Configure Apple receipt verification
appleReceiptVerify.config({
    secret: process.env.APPLE_SHARED_SECRET,
    environment: process.env.NODE_ENV === 'production' ? ['production'] : ['sandbox'],
    excludeOldTransactions: true // Only get latest renewal for subscriptions
});

async function validateAppleReceipt(receipt) {
    try {
        const receiptBase64 = Buffer.from(receipt).toString("base64");

        const products = await appleReceiptVerify.validate({
            receipt: receiptBase64
        });
        return { success: true, products };
    } catch (error) {
        if (error instanceof appleReceiptVerify.EmptyError) {
            throw { statusCode: 400, message: "Receipt contains no purchases" };
        } else if (error instanceof appleReceiptVerify.ServiceUnavailableError) {
            throw { statusCode: 503, message: "Apple validation service unavailable" };
        }
        throw { statusCode: 400, message: error.message || "Invalid receipt" };
    }
}
// --- RevenueCat helpers ---
const RC_API_BASE = "https://api.revenuecat.com/v1";

// Pull full, canonical subscriber state from RevenueCat
async function fetchRevenueCatSubscriber(appUserId, isSandbox = false) {
    const headers = {
        Authorization: `Bearer ${process.env.RC_SECRET_API_KEY}`, // RevenueCat Secret API Key
        "X-Platform": "ios",
    };
    if (isSandbox) headers["X-Is-Sandbox"] = "true";

    const url = `${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`;
    const { data } = await axios.get(url, { headers });
    return data; // { subscriber: { entitlements, subscriptions, ... } }
}

/**
 * Decide if the user has an active entitlement.
 * Returns { active, productId, expiration, transactionId }
 */
function resolveEntitlementState(subscriberPayload, entitlementKey) {
    const ents = subscriberPayload?.subscriber?.entitlements || {};
    const ent = ents?.[entitlementKey];

    if (!ent) return { active: false };

    const exp = ent.expires_date ? new Date(ent.expires_date) : null;
    const active = !!ent.is_active || (exp && exp > new Date());

    const productId = ent.product_identifier || null;

    // Try to get a stable transaction id (for idempotency)
    const subs = subscriberPayload?.subscriber?.subscriptions || {};
    const subObj = productId ? subs[productId] : null;
    const transactionId =
        subObj?.original_purchase_transaction_id ||
        subObj?.transaction_id ||
        null;

    return { active, productId, expiration: exp, transactionId };
}

async function createTapPaymentLink({ user, amount, description, redirectApiUrl, metadata }) {
    try {
        const payload = {
            amount,
            currency: 'SAR',
            customer: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email
            },
            source: {
                id: "src_all"
            },
            // Explicitly enable 3DS authentication
            threeDSecure: true,
            card_threeDSecure: true,
            metadata,
            description,
            post: {
                url: `${process.env.BASE_URL}${redirectApiUrl}`,
                return_uri: `${process.env.BASE_URL}/payments/payment-success`
            },
            redirect: {
                url: `${process.env.BASE_URL}/payments/payment-close` // Public route, no auth required
            }
        };

        console.log('[DEBUG] Creating Tap payment link with payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(
            `${TAP_BASE_URL}charges`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.TAP_PAYMENTS_SECRET_TEST}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('[DEBUG] Tap API Response Status:', response.status);
        console.log('[DEBUG] Tap API Response Data:', JSON.stringify(response.data, null, 2));
        
        // Check if response structure is correct
        if (!response.data) {
            console.error('[ERROR] No data in Tap response');
            return { success: false, error: 'No data in Tap API response' };
        }

        if (!response.data.transaction) {
            console.error('[ERROR] No transaction object in Tap response. Full response:', JSON.stringify(response.data, null, 2));
            return { success: false, error: 'No transaction object in Tap API response', rawResponse: response.data };
        }

        if (!response.data.transaction.url) {
            console.error('[ERROR] No transaction.url in Tap response. Transaction object:', JSON.stringify(response.data.transaction, null, 2));
            return { success: false, error: 'No payment URL in Tap API response', rawResponse: response.data };
        }

        const paymentUrl = response.data.transaction.url;
        const chargeId = response.data.id;

        console.log('[DEBUG] Payment URL extracted:', paymentUrl);
        console.log('[DEBUG] Charge ID:', chargeId);

        return { success: true, url: paymentUrl, charge_id: chargeId };
    } catch (error) {
        console.error('[ERROR] Tap payment link creation failed:');
        console.error('[ERROR] Error message:', error.message);
        console.error('[ERROR] Error response data:', error.response?.data);
        console.error('[ERROR] Error response status:', error.response?.status);
        return { success: false, error: error.response?.data || error.message };
    }
}
exports.subscribeToPackage = async (req, res, next) => {
    try {
        const {
            package_id,
            pricing_id,
            coupon_code,
            payment_method,

            // NEW: from client after RevenueCat purchase
            app_user_id,
            expected_entitlement,   // optional if stored on package
            environment             // optional: 'SANDBOX' | 'PRODUCTION'
        } = req.body;

        if (!payment_method || !['tap', 'iap'].includes(payment_method)) {
            throw { statusCode: 400, message: "Invalid payment_method. Must be 'tap' or 'iap'" };
        }

        // --- Validate package, pricing, user ---
        const pkg = await Package.findByPk(package_id);
        if (!pkg) throw { statusCode: 404, message: "Package not found" };

        const pricing = await PricingModel.findOne({ where: { package_id, id: pricing_id } });
        if (!pricing) throw { statusCode: 404, message: "Pricing not found" };

        const user = await User.findByPk(req.userId);
        if (!user) throw { statusCode: 404, message: "User not found" };

        const oldSubscription = await Subscription.findOne({
            where: { user_id: req.userId, is_active: true }
        });
        if (oldSubscription) throw { statusCode: 403, message: "You already have a subscription" };

        // --- Calculate final amount with coupon (shared with Tap) ---
        let finalAmount = pricing.price;
        let discountAmount = 0;
        let appliedCoupon = null;

        if (coupon_code) {
            const coupon = await Coupon.findOne({
                where: {
                    code: coupon_code,
                    is_active: true,
                    [Op.or]: [{ package_id: null }, { package_id }]
                }
            });
            if (!coupon) throw { statusCode: 400, message: "Coupon not found or invalid" };
            if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
                throw { statusCode: 400, message: "Coupon expired" };
            }
            if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
                throw { statusCode: 400, message: "Coupon usage limit reached" };
            }

            discountAmount = coupon.discount_type === 'percentage'
                ? pricing.price * (coupon.discount_value / 100)
                : coupon.discount_value;

            discountAmount = Math.min(discountAmount, pricing.price);
            finalAmount = pricing.price - discountAmount;
            appliedCoupon = coupon;
        }

        if (payment_method === 'tap') {
            // ---- Tap path unchanged ----
            console.log('[DEBUG] subscribeToPackage - Creating Tap payment link');
            console.log('[DEBUG] Final amount:', finalAmount);
            console.log('[DEBUG] Package:', pkg.name);
            
            const paymentLink = await createTapPaymentLink({
                user,
                amount: finalAmount,
                currency: 'SAR',
                description: `Fitness Package Subscription - ${pkg.name}${appliedCoupon ? ` (Coupon: ${coupon_code})` : ''}`,
                redirectApiUrl: '/payments/complete-subscription',
                metadata: {
                    api: 'subscribeToPackage',
                    user_id: req.userId,
                    package_id,
                    pricing_id,
                    original_amount: pricing.price,
                    discount_amount: discountAmount,
                    coupon_code: coupon_code || null,
                    coupon_id: appliedCoupon?.id || null
                }
            });

            console.log('[DEBUG] Payment link result:', JSON.stringify(paymentLink, null, 2));

            if (!paymentLink.success) {
                console.error('[ERROR] Payment link creation failed:', paymentLink.error);
                throw { 
                    statusCode: 500, 
                    message: `Failed to create payment link: ${paymentLink.error || 'Unknown error'}` 
                };
            }

            if (!paymentLink.url) {
                console.error('[ERROR] Payment link created but URL is missing:', paymentLink);
                throw { 
                    statusCode: 500, 
                    message: "Payment link created but URL is missing" 
                };
            }

            console.log('[DEBUG] Returning payment URL to client:', paymentLink.url);

            return res.status(200).json({
                success: true,
                payment_url: paymentLink.url
            });
        }

        // ---- IAP via RevenueCat (verify BEFORE creating local subscription) ----
        // 1) Basic checks for RC-based verification
        if (!app_user_id) {
            throw { statusCode: 400, message: "app_user_id is required for IAP" };
        }

        // Prefer an entitlement saved on the package, otherwise expect from client
        const entitlementKey = pkg.entitlement_id || expected_entitlement;
        if (!entitlementKey) {
            throw { statusCode: 400, message: "Missing entitlement id (set Package.entitlement_id or send expected_entitlement)" };
        }

        // 2) Pull canonical state from RevenueCat
        const isSandbox = environment === 'SANDBOX' || process.env.NODE_ENV !== 'production';
        const rcPayload = await fetchRevenueCatSubscriber(String(app_user_id), isSandbox);
        const { active, productId, expiration, transactionId } = resolveEntitlementState(rcPayload, entitlementKey);

        if (!active) {
            throw { statusCode: 400, message: "Entitlement not active in RevenueCat" };
        }

        // Optionally enforce product mapping: the RC product should match your package's product id
        if (pkg.apple_product_id && productId && pkg.apple_product_id !== productId) {
            throw { statusCode: 400, message: "Purchased product does not match requested package" };
        }

        // 3) Idempotency: if we already created a sub for this RC transaction, return it
        if (transactionId) {
            const existing = await Subscription.findOne({ where: { apple_transaction_id: transactionId } });
            if (existing) {
                return res.status(200).json({ success: true, message: "Already verified", subscription: existing });
            }
        }

        // 4) Create the local subscription (your same timing logic)
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + pricing.number_of_days + 1);

        const subscription = await Subscription.create({
            user_id: req.userId,
            package_id,
            start_date: startDate,
            end_date: endDate,
            pricing_id,
            payment_method: 'iap',
            apple_transaction_id: transactionId || null,
            rc_product_id: productId || null,
            rc_environment: environment || (rcPayload?.subscriber?.environment ?? null),
            coupon_id: appliedCoupon?.id || null,
            discount_applied: discountAmount || 0,
            is_active: true
        });

        if (appliedCoupon) {
            await appliedCoupon.update({ used_count: (appliedCoupon.used_count || 0) + 1 });
        }

        return res.status(201).json({
            success: true,
            message: "Subscription created successfully (RevenueCat verified)",
            subscription
        });

    } catch (e) {
        console.error('[ERROR] subscribeToPackage error:', e);
        console.error('[ERROR] Error statusCode:', e.statusCode);
        console.error('[ERROR] Error message:', e.message);
        console.error('[ERROR] Error stack:', e.stack);
        res.status(e.statusCode || 500).json({ success: false, message: e.message || "Internal Server Error" });
    }
};


exports.completeSubscription = async (req, res) => {
    // Webhook response strategy:
    // - 200 OK: Successfully processed (even if payment declined - we've handled it)
    // - 400 Bad Request: Client errors (bad signature, invalid data) - don't retry
    // - 500 Internal Server Error: Server errors (DB issues) - Tap should retry
    
    try {
        // 1) Verify signature
        console.log("**************************completeSubscription**************************");
        console.log('[DEBUG] completeSubscription - Request received');
        console.log('[DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));
        console.log('[DEBUG] Request body type:', typeof req.body);
        console.log('[DEBUG] Request body length:', req.body?.length || 'N/A');
        
        if (!verifyTapSignature(req)) {
            console.error('[ERROR] Invalid Tap webhook signature');
            // Invalid signature = don't retry (likely configuration issue)
            return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
        }
        console.log('[DEBUG] Tap signature verified successfully');

        // 2) Parse body - handle both raw buffer and already-parsed JSON
        let parsed;
        try {
            // Check if body is already parsed (object) or raw (buffer)
            if (Buffer.isBuffer(req.body)) {
                // Body is raw buffer - parse it
                const bodyString = req.body.toString('utf8');
                console.log('[DEBUG] Raw body string (from buffer):', bodyString);
                parsed = JSON.parse(bodyString);
            } else if (typeof req.body === 'object' && req.body !== null) {
                // Body is already parsed as JSON (might happen if middleware parsed it)
                parsed = req.body;
                console.log('[DEBUG] Body already parsed as object');
            } else if (typeof req.body === 'string') {
                // Body is a string - parse it
                console.log('[DEBUG] Body is string:', req.body);
                parsed = JSON.parse(req.body);
            } else {
                console.error('[ERROR] Unexpected body type:', typeof req.body);
                return res.status(400).json({ success: false, message: 'Invalid body format' });
            }
            console.log('[DEBUG] Parsed body:', JSON.stringify(parsed, null, 2));
        } catch (parseError) {
            console.error('[ERROR] JSON parse error:', parseError);
            console.error('[ERROR] Body type:', typeof req.body);
            console.error('[ERROR] Body value:', req.body);
            // Invalid JSON = bad request, don't retry
            return res.status(400).json({ success: false, message: 'Invalid JSON' });
        }

        const { id: charge_id, metadata, status } = parsed;
        console.log('[DEBUG] Charge ID:', charge_id);
        console.log('[DEBUG] Charge Status from webhook:', status);
        console.log('[DEBUG] Metadata:', JSON.stringify(metadata, null, 2));
        
        if (!charge_id || !metadata) {
            console.error('[ERROR] Missing charge_id or metadata. charge_id:', charge_id, 'metadata:', metadata);
            // Missing required data = bad request, don't retry
            return res.status(400).json({ success: false, message: 'Missing charge_id or metadata' });
        }
        
        // Handle declined/cancelled payments early - webhook processed but payment failed
        const chargeStatus = status || parsed.status;
        if (chargeStatus === 'DECLINED' || chargeStatus === 'CANCELLED' || chargeStatus === 'FAILED') {
            console.log('[INFO] Payment was declined/cancelled. Charge ID:', charge_id);
            console.log('[INFO] Decline reason:', parsed.response?.message || parsed.response?.code || 'Unknown');
            // Webhook processed successfully, but payment failed - return 200 OK (webhook handled)
            // but clearly indicate payment_status = failed
            return res.status(200).json({ 
                success: false,
                payment_status: 'failed',
                charge_status: chargeStatus,
                message: `Payment ${chargeStatus.toLowerCase()} - webhook received and logged`,
                decline_reason: parsed.response?.message || parsed.response?.code || 'Unknown',
                charge_id: charge_id
            });
        }

        const { user_id, package_id, pricing_id, discount_amount, original_amount, coupon_id } = metadata;
        console.log('[DEBUG] Extracted metadata - user_id:', user_id, 'package_id:', package_id, 'pricing_id:', pricing_id);

        // Security: Validate required metadata exists
        if (!user_id || !package_id || !pricing_id) {
            console.error('[ERROR] Missing required metadata fields');
            return res.status(400).json({ success: false, message: 'Missing required metadata fields' });
        }

        // 3) Idempotency - Check if already processed
        console.log('[DEBUG] Checking for existing subscription with charge_id:', charge_id);
        const existing = await Subscription.findOne({ where: { payment_charge_id: charge_id } });
        if (existing) {
            console.log('[DEBUG] Subscription already exists (idempotent):', existing.id);
            return res.status(200).json({ 
                success: true, 
                payment_status: 'already_processed',
                message: 'Webhook already processed (idempotent)',
                subscription: existing,
                charge_id: charge_id
            });
        }
        console.log('[DEBUG] No existing subscription found, proceeding...');

        // 4) CRITICAL SECURITY: Retrieve & validate charge from Tap API
        // This verifies the charge exists and was actually processed by Tap
        console.log('[DEBUG] Retrieving charge from Tap API for charge_id:', charge_id);
        let charge;
        try {
            charge = await retrieveCharge(charge_id);
            console.log('[DEBUG] Charge retrieved. Status:', charge?.status);
            console.log('[DEBUG] Full charge object:', JSON.stringify(charge, null, 2));
        } catch (chargeError) {
            console.error('[ERROR] Failed to retrieve charge from Tap API:', chargeError);
            // If we can't verify the charge with Tap, don't create subscription
            return res.status(400).json({ 
                success: false, 
                message: 'Unable to verify charge with Tap API' 
            });
        }

        // Security: Verify charge ID matches
        if (charge.id !== charge_id) {
            console.error('[ERROR] Charge ID mismatch');
            return res.status(400).json({ success: false, message: 'Charge ID mismatch' });
        }
        
        if (charge.status !== 'CAPTURED') {
            console.log('[INFO] Charge not captured. Status:', charge.status);
            console.log('[INFO] Charge response:', JSON.stringify(charge.response, null, 2));
            // Non-CAPTURED status - webhook processed but payment failed
            return res.status(200).json({ 
                success: false,
                payment_status: 'failed',
                charge_status: charge.status,
                message: `Payment ${charge.status.toLowerCase()} - webhook processed`,
                decline_reason: charge.response?.message || charge.response?.code || 'Unknown',
                charge_id: charge_id
            });
        }
        console.log('[DEBUG] Charge is CAPTURED, proceeding with subscription creation');

        const expectedFinal = computeExpectedFinal(original_amount, discount_amount);
        const chargeAmount = Number(charge.amount);
        const chargeCurrency = String(charge.currency || '').toUpperCase();

        if (Number.isNaN(chargeAmount) || chargeAmount !== expectedFinal) {
            return res.status(400).json({ success: false, message: 'Charge amount mismatch' });
        }
        if (chargeCurrency !== 'SAR') {
            return res.status(400).json({ success: false, message: 'Charge currency mismatch' });
        }
        // SECURITY: Verify metadata round-trip - ensures charge was created by us
        if (String(charge.metadata?.user_id) !== String(user_id)) {
            console.error('[ERROR] Metadata mismatch (user_id). Charge:', charge.metadata?.user_id, 'Webhook:', user_id);
            return res.status(400).json({ success: false, message: 'Metadata mismatch (user_id)' });
        }
        if (String(charge.metadata?.package_id) !== String(package_id)) {
            console.error('[ERROR] Metadata mismatch (package_id)');
            return res.status(400).json({ success: false, message: 'Metadata mismatch (package_id)' });
        }
        if (String(charge.metadata?.pricing_id) !== String(pricing_id)) {
            console.error('[ERROR] Metadata mismatch (pricing_id)');
            return res.status(400).json({ success: false, message: 'Metadata mismatch (pricing_id)' });
        }

        // SECURITY: Verify charge was created with our API (api field in metadata)
        if (charge.metadata?.api !== 'subscribeToPackage') {
            console.error('[ERROR] Charge metadata API field mismatch');
            return res.status(400).json({ success: false, message: 'Invalid charge source' });
        }

        // 5) Validate entities exist
        const user = await User.findByPk(user_id);
        const pkg = await Package.findByPk(package_id);
        const pricing = await PricingModel.findByPk(pricing_id);
        const appliedCoupon = coupon_id ? await Coupon.findByPk(coupon_id) : null;

        if (!user || !pkg || !pricing) {
            console.error('[ERROR] User/Package/Pricing not found. user:', !!user, 'package:', !!pkg, 'pricing:', !!pricing);
            return res.status(404).json({ success: false, message: 'User/Package/Pricing not found' });
        }

        // SECURITY: Verify user doesn't already have an active subscription
        // (prevent duplicate subscriptions even if someone tries to replay webhooks)
        const activeSubscription = await Subscription.findOne({
            where: { user_id, is_active: true }
        });
        if (activeSubscription && activeSubscription.payment_charge_id !== charge_id) {
            console.error('[ERROR] User already has an active subscription');
            return res.status(400).json({ 
                success: false, 
                message: 'User already has an active subscription',
                existing_subscription_id: activeSubscription.id
            });
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + pricing.number_of_days + 1); // align with your current logic

        const subscription = await Subscription.create({
            user_id,
            package_id,
            start_date: startDate,
            end_date: endDate,
            pricing_id,
            payment_charge_id: charge_id,
            coupon_id: appliedCoupon?.id || null,
            discount_applied: discount_amount || 0,
            is_active: true
        });

        if (appliedCoupon) {
            console.log('[DEBUG] Updating coupon usage count for coupon_id:', appliedCoupon.id);
            await appliedCoupon.update({ used_count: (appliedCoupon.used_count || 0) + 1 });
        }

        console.log('[DEBUG] Subscription created successfully. ID:', subscription.id);
        console.log('[DEBUG] Subscription details:', JSON.stringify(subscription.toJSON(), null, 2));
        
        // Payment successful (CAPTURED) and subscription created
        return res.status(200).json({ 
            success: true,
            payment_status: 'success',
            charge_status: 'CAPTURED',
            message: 'Payment successful and subscription created',
            subscription: subscription,
            charge_id: charge_id
        });
    } catch (e) {
        console.error('[ERROR] completeSubscription error:');
        console.error('[ERROR] Error message:', e.message);
        console.error('[ERROR] Error stack:', e.stack);
        console.error('[ERROR] Full error object:', e);
        
        // Server errors (DB issues, etc.) - return 500 so Tap retries
        // This allows Tap to retry on transient failures (network, DB connection issues)
        return res.status(500).json({ success: false, message: e.message || 'Internal Server Error' });
    }
};

exports.subscribeToMealPlan = async (req, res, next) => {
    try {
        const {
            meal_plan_id,
            delivery_time_id,
            address_label,
            street,
            city,
            building,
            state,
            postal_code,
            delivery_notes,
            coupon_code
        } = req.body;
        console.log("**************************subscribeToMealPlan**************************");
        console.log('[DEBUG] subscribeToMealPlan - Request received');
        console.log('[DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));
        console.log('[DEBUG] Request body type:', typeof req.body);
        console.log('[DEBUG] Request body length:', req.body?.length || 'N/A');
        console.log('[DEBUG] Request body:', JSON.stringify(req.body, null, 2));
        console.log('[DEBUG] Request userId:', req.userId);
        // --- Validate user and active subscription ---
        const user = await User.findByPk(req.userId);
        if (!user) throw { statusCode: 404, message: "User not found" };

        const oldSub = await MealSubscription.findOne({
            where: { user_id: req.userId, is_active: true }
        });
        if (oldSub) throw { statusCode: 400, message: "You are already subscribed" };

        // --- Validate plan and delivery time ---
        const mealPlan = await MealPlan.findByPk(meal_plan_id);
        if (!mealPlan) throw { statusCode: 404, message: "Meal Plan not found" };

        const deliveryTime = await DeliveryTime.findByPk(delivery_time_id);
        if (!deliveryTime) throw { statusCode: 404, message: "Delivery time not found" };

        // --- Compute amount (with optional coupon) ---
        // Assumes your MealPlan has a `price` field. Adjust if your schema uses another field.
        let finalAmount = Number(mealPlan.price_monthly);
        if (Number.isNaN(finalAmount)) throw { statusCode: 400, message: "Meal plan price is invalid" };

        let discountAmount = 0;
        let appliedCoupon = null;

        if (coupon_code) {
            // If your Coupon model targets meal plans, adapt the where-clause (e.g., meal_plan_id)
            const coupon = await Coupon.findOne({
                where: {
                    code: coupon_code,
                    is_active: true,
                    [Op.or]: [{ meal_plan_id: null }, { meal_plan_id }]
                }
            });

            if (!coupon) throw { statusCode: 400, message: "Coupon not found or invalid" };
            if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
                throw { statusCode: 400, message: "Coupon expired" };
            }
            if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
                throw { statusCode: 400, message: "Coupon usage limit reached" };
            }

            discountAmount =
                coupon.discount_type === "percentage"
                    ? finalAmount * (coupon.discount_value / 100)
                    : Number(coupon.discount_value);

            discountAmount = Math.max(0, Math.min(discountAmount, finalAmount));
            finalAmount = +(finalAmount - discountAmount).toFixed(2);
            appliedCoupon = coupon;
        }

        // --- Create Tap payment link (defer creation of Address/Subscription to the webhook) ---
        const paymentLink = await createTapPaymentLink({
            user,
            amount: finalAmount,
            description: `Meal Plan Subscription - ${mealPlan.name}${appliedCoupon ? ` (Coupon: ${coupon_code})` : ""}`,
            redirectApiUrl: "/payments/complete-meal-subscription",
            metadata: {
                api: "subscribeToMealPlan",
                user_id: req.userId,
                meal_plan_id,
                delivery_time_id,
                // Address details to be created on completion
                address_label,
                street,
                city,
                building,
                state,
                postal_code,
                delivery_notes,
                // Pricing details
                original_amount: Number(mealPlan.price_monthly),
                discount_amount: discountAmount,
                // Coupon details
                coupon_code: appliedCoupon ? coupon_code : null,
                coupon_id: appliedCoupon ? appliedCoupon.id : null
            }
        });

        if (!paymentLink.success) {
            throw { statusCode: 500, message: "Failed to create payment link" };
        }

        res.status(200).json({
            success: true,
            payment_url: paymentLink.url
        });
    } catch (error) {
        res
            .status(error.statusCode || 500)
            .json({ success: false, message: error.message || "Internal Server Error" });
    }
};
exports.completeMealSubscription = async (req, res) => {
    // Webhook response strategy:
    // - 200 OK: Successfully processed (even if payment declined/cancelled/failed — we've handled it)
    // - 400 Bad Request / 401 Unauthorized: Client errors (bad signature, invalid data) — don't retry
    // - 500 Internal Server Error: Server errors (DB issues) — Tap should retry

    try {
        // 1) Verify signature
        console.log("**************************completeMealSubscription**************************");
        console.log('[DEBUG] completeMealSubscription - Request received');
        console.log('[DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));
        console.log('[DEBUG] Request body type:', typeof req.body);
        console.log('[DEBUG] Request body length:', req.body?.length || 'N/A');

        if (!verifyTapSignature(req)) {
            console.error('[ERROR] Invalid Tap webhook signature');
            return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
        }
        console.log('[DEBUG] Tap signature verified successfully');

        // 2) Parse body - support raw buffer, string, and already-parsed JSON
        let parsed;
        try {
            if (Buffer.isBuffer(req.body)) {
                const bodyString = req.body.toString('utf8');
                console.log('[DEBUG] Raw body string (from buffer):', bodyString);
                parsed = JSON.parse(bodyString);
            } else if (typeof req.body === 'object' && req.body !== null) {
                parsed = req.body;
                console.log('[DEBUG] Body already parsed as object');
            } else if (typeof req.body === 'string') {
                console.log('[DEBUG] Body is string:', req.body);
                parsed = JSON.parse(req.body);
            } else {
                console.error('[ERROR] Unexpected body type:', typeof req.body);
                return res.status(400).json({ success: false, message: 'Invalid body format' });
            }
            console.log('[DEBUG] Parsed body:', JSON.stringify(parsed, null, 2));
        } catch (parseError) {
            console.error('[ERROR] JSON parse error:', parseError);
            console.error('[ERROR] Body type:', typeof req.body);
            console.error('[ERROR] Body value:', req.body);
            return res.status(400).json({ success: false, message: 'Invalid JSON' });
        }

        const { id: charge_id, metadata, status } = parsed;
        console.log('[DEBUG] Charge ID:', charge_id);
        console.log('[DEBUG] Charge Status from webhook:', status);
        console.log('[DEBUG] Metadata:', JSON.stringify(metadata, null, 2));

        if (!charge_id || !metadata) {
            console.error('[ERROR] Missing charge_id or metadata. charge_id:', charge_id, 'metadata:', metadata);
            return res.status(400).json({ success: false, message: 'Missing charge_id or metadata' });
        }

        // Handle declined/cancelled/failed payments early — processed, but payment failed => 200 OK
        const chargeStatus = status || parsed.status;
        if (chargeStatus === 'DECLINED' || chargeStatus === 'CANCELLED' || chargeStatus === 'FAILED') {
            console.log('[INFO] Payment was not successful. Charge ID:', charge_id);
            console.log('[INFO] Decline reason:', parsed.response?.message || parsed.response?.code || 'Unknown');
            return res.status(200).json({
                success: false,
                payment_status: 'failed',
                charge_status: chargeStatus,
                message: `Payment ${chargeStatus.toLowerCase()} - webhook received and logged`,
                decline_reason: parsed.response?.message || parsed.response?.code || 'Unknown',
                charge_id
            });
        }

        // Extract expected metadata
        const {
            user_id,
            meal_plan_id,
            delivery_time_id,
            address_label,
            street,
            city,
            building,
            state,
            postal_code,
            delivery_notes,
            original_amount,
            discount_amount,
            coupon_id
        } = metadata;

        console.log('[DEBUG] Extracted metadata - user_id:', user_id, 'meal_plan_id:', meal_plan_id, 'delivery_time_id:', delivery_time_id);

        // Security: Validate required metadata exists
        if (!user_id || !meal_plan_id || !delivery_time_id || original_amount == null) {
            console.error('[ERROR] Missing required metadata fields');
            return res.status(400).json({ success: false, message: 'Missing required metadata fields' });
        }

        // 3) Idempotency - by charge_id
        console.log('[DEBUG] Checking for existing meal subscription with charge_id:', charge_id);
        const existing = await MealSubscription.findOne({ where: { payment_charge_id: charge_id } });
        if (existing) {
            console.log('[DEBUG] Meal subscription already exists (idempotent):', existing.id);
            return res.status(200).json({
                success: true,
                payment_status: 'already_processed',
                message: 'Webhook already processed (idempotent)',
                subscription: existing,
                charge_id
            });
        }
        console.log('[DEBUG] No existing meal subscription found, proceeding...');

        // 4) Retrieve & validate charge from Tap API
        console.log('[DEBUG] Retrieving charge from Tap API for charge_id:', charge_id);
        let charge;
        try {
            charge = await retrieveCharge(charge_id);
            console.log('[DEBUG] Charge retrieved. Status:', charge?.status);
            console.log('[DEBUG] Full charge object:', JSON.stringify(charge, null, 2));
        } catch (chargeError) {
            console.error('[ERROR] Failed to retrieve charge from Tap API:', chargeError);
            return res.status(400).json({ success: false, message: 'Unable to verify charge with Tap API' });
        }

        // Security: Verify charge ID matches
        if (charge.id !== charge_id) {
            console.error('[ERROR] Charge ID mismatch');
            return res.status(400).json({ success: false, message: 'Charge ID mismatch' });
        }

        // Return 200 with failed status if not captured (same behavior as packages)
        if (charge.status !== 'CAPTURED') {
            console.log('[INFO] Charge not captured. Status:', charge.status);
            console.log('[INFO] Charge response:', JSON.stringify(charge.response, null, 2));
            return res.status(200).json({
                success: false,
                payment_status: 'failed',
                charge_status: charge.status,
                message: `Payment ${charge.status.toLowerCase()} - webhook processed`,
                decline_reason: charge.response?.message || charge.response?.code || 'Unknown',
                charge_id
            });
        }
        console.log('[DEBUG] Charge is CAPTURED, proceeding with meal subscription creation');

        // Amount/currency checks
        const expectedFinal = computeExpectedFinal(original_amount, discount_amount);
        const chargeAmount = Number(charge.amount);
        const chargeCurrency = String(charge.currency || '').toUpperCase();

        if (Number.isNaN(chargeAmount) || chargeAmount !== expectedFinal) {
            console.error('[ERROR] Charge amount mismatch. expected:', expectedFinal, 'actual:', chargeAmount);
            return res.status(400).json({ success: false, message: 'Charge amount mismatch' });
        }
        if (chargeCurrency !== 'SAR') {
            console.error('[ERROR] Charge currency mismatch. expected: SAR actual:', chargeCurrency);
            return res.status(400).json({ success: false, message: 'Charge currency mismatch' });
        }

        // SECURITY: Verify metadata round-trip (ensures charge was created by us)
        if (String(charge.metadata?.user_id) !== String(user_id)) {
            console.error('[ERROR] Metadata mismatch (user_id). Charge:', charge.metadata?.user_id, 'Webhook:', user_id);
            return res.status(400).json({ success: false, message: 'Metadata mismatch (user_id)' });
        }
        if (String(charge.metadata?.meal_plan_id) !== String(meal_plan_id)) {
            console.error('[ERROR] Metadata mismatch (meal_plan_id)');
            return res.status(400).json({ success: false, message: 'Metadata mismatch (meal_plan_id)' });
        }
        if (String(charge.metadata?.delivery_time_id) !== String(delivery_time_id)) {
            console.error('[ERROR] Metadata mismatch (delivery_time_id)');
            return res.status(400).json({ success: false, message: 'Metadata mismatch (delivery_time_id)' });
        }

        // SECURITY: Verify charge was created by the correct API path in your system
        if (charge.metadata?.api !== 'subscribeToMealPlan') {
            console.error('[ERROR] Charge metadata API field mismatch');
            return res.status(400).json({ success: false, message: 'Invalid charge source' });
        }

        // 5) Validate entities exist
        const user = await User.findByPk(user_id);
        const mealPlan = await MealPlan.findByPk(meal_plan_id, { include: [{ model: Type, as: 'types' }] });
        const deliveryTime = await DeliveryTime.findByPk(delivery_time_id);
        const appliedCoupon = coupon_id ? await Coupon.findByPk(coupon_id) : null;

        if (!user || !mealPlan || !deliveryTime) {
            console.error('[ERROR] User/MealPlan/DeliveryTime not found. user:', !!user, 'mealPlan:', !!mealPlan, 'deliveryTime:', !!deliveryTime);
            return res.status(404).json({ success: false, message: 'User/MealPlan/DeliveryTime not found' });
        }

        // SECURITY: Optional — block duplicate active meal subscriptions per user
        const activeMealSubscription = await MealSubscription.findOne({ where: { user_id, is_active: true } });
        if (activeMealSubscription && activeMealSubscription.payment_charge_id !== charge_id) {
            console.error('[ERROR] User already has an active meal subscription');
            return res.status(400).json({
                success: false,
                message: 'User already has an active meal subscription',
                existing_subscription_id: activeMealSubscription.id
            });
        }

        // Create/update address
        console.log('[DEBUG] Creating address for user:', user_id);
        const address = await Address.create({
            user_id,
            address_label,
            city,
            street,
            building,
            state,
            postal_code,
            delivery_notes
        });

        // Dates (align with your existing logic — add +1 day if needed to include the last day)
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + Number(mealPlan.number_of_days) + 1); // align with package logic (+1)

        // Create subscription
        console.log('[DEBUG] Creating MealSubscription record');
        const subscription = await MealSubscription.create({
            user_id,
            meal_plan_id,
            start_date: startDate,
            end_date: endDate,
            type: 'monthly',
            delivery_time_id,
            address_id: address.id,
            payment_charge_id: charge_id,
            coupon_id: appliedCoupon?.id || null,
            discount_applied: Number(discount_amount) || 0,
            is_active: true
        });

        // Pre-generate user meal selections for each day in range based on plan types
        const planTypeIds = (mealPlan.types || []).map((t) => t.id);
        const selections = [];
        let cursor = new Date(startDate);

        console.log('[DEBUG] Generating meal selections from', startDate.toISOString(), 'to', endDate.toISOString());
        while (cursor <= endDate) {
            const currentDateStr = cursor.toISOString().split('T')[0];
            const dayName = cursor.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

            const mealDays = await MealDay.findAll({
                where: { date: currentDateStr },
                include: [
                    {
                        model: Meal,
                        as: 'meal',
                        required: true,
                        include: [
                            {
                                model: Type,
                                as: 'types',
                                where: { id: { [Op.in]: planTypeIds.length ? planTypeIds : [-1] } },
                                through: { attributes: [] },
                                required: planTypeIds.length > 0
                            }
                        ]
                    }
                ]
            });

            for (const md of mealDays) {
                selections.push({
                    user_id,
                    meal_subscription_id: subscription.id,
                    meal_id: md.meal_id,
                    date: currentDateStr,
                    day: dayName
                });
            }

            cursor.setDate(cursor.getDate() + 1);
        }

        if (selections.length) {
            console.log('[DEBUG] Bulk inserting user meal selections:', selections.length);
            await UserMealSelection.bulkCreate(selections, { ignoreDuplicates: true });
        } else {
            console.log('[DEBUG] No selections generated for the given date range/types');
        }

        if (appliedCoupon) {
            console.log('[DEBUG] Updating coupon usage count for coupon_id:', appliedCoupon.id);
            await appliedCoupon.update({ used_count: (appliedCoupon.used_count || 0) + 1 });
        }

        console.log('[DEBUG] Meal subscription created successfully. ID:', subscription.id);
        console.log('[DEBUG] Meal subscription details:', JSON.stringify(subscription.toJSON(), null, 2));

        // Payment successful (CAPTURED) and subscription created
        return res.status(200).json({
            success: true,
            payment_status: 'success',
            charge_status: 'CAPTURED',
            message: 'Payment successful and meal subscription created',
            subscription,
            charge_id
        });
    } catch (e) {
        console.error('[ERROR] completeMealSubscription error:');
        console.error('[ERROR] Error message:', e.message);
        console.error('[ERROR] Error stack:', e.stack);
        console.error('[ERROR] Full error object:', e);
        // Server errors — return 500 so Tap retries on transient failures
        return res.status(500).json({ success: false, message: e.message || 'Internal Server Error' });
    }
};
