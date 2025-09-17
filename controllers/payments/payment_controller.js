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
        const products = await appleReceiptVerify.validate({ receipt });
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
            metadata,
            description,
            post: {
                url: `${process.env.BASE_URL}${redirectApiUrl}`,
                return_uri: `${process.env.BASE_URL}/payments/payment-success`
            },
            redirect: {
                url: `${process.env.BASE_URL}/payments/payment-close`
            }
        };

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
        console.log(response);

        return { success: true, url: response.data.transaction.url, charge_id: response.data.id };
    } catch (error) {
        console.error(error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}



exports.subscribeToPackage = async (req, res, next) => {
    try {
        const { package_id, pricing_id, coupon_code, payment_method, apple_receipt } = req.body;

        if (!payment_method || !['tap', 'iap'].includes(payment_method)) {
            throw { statusCode: 400, message: "Invalid payment_method. Must be 'tap' or 'iap'" };
        }

        if (payment_method === 'iap' && !apple_receipt) {
            throw { statusCode: 400, message: "apple_receipt is required for IAP payment method" };
        }

        // --- Validate package, pricing, user ---
        const package = await Package.findByPk(package_id);
        if (!package) throw { statusCode: 404, message: "Package not found" };

        const pricing = await PricingModel.findOne({ where: { package_id, id: pricing_id } });
        if (!pricing) throw { statusCode: 404, message: "Pricing not found" };

        const user = await User.findByPk(req.userId);
        if (!user) throw { statusCode: 404, message: "User not found" };

        const oldSubscription = await Subscription.findOne({
            where: { user_id: req.userId, is_active: true }
        });
        if (oldSubscription) throw { statusCode: 403, message: "You already have a subscription" };

        // --- Calculate final amount with coupon ---
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
            if (coupon.expiry_date < new Date()) throw { statusCode: 400, message: "Coupon expired" };
            if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) throw { statusCode: 400, message: "Coupon usage limit reached" };

            discountAmount = coupon.discount_type === 'percentage'
                ? pricing.price * (coupon.discount_value / 100)
                : coupon.discount_value;

            discountAmount = Math.min(discountAmount, pricing.price);
            finalAmount = pricing.price - discountAmount;
            appliedCoupon = coupon;
        }

        if (payment_method === 'tap') {

            const paymentLink = await createTapPaymentLink({
                user,
                amount: finalAmount,
                currency: 'SAR',
                description: `Fitness Package Subscription - ${package.name}${appliedCoupon ? ` (Coupon: ${coupon_code})` : ''}`,
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

            if (!paymentLink.success) {
                throw { statusCode: 500, message: "Failed to create payment link" };
            }

            return res.status(200).json({
                success: true,
                payment_url: paymentLink.url
            });
        } else {
            print("111");
            // --- Validate Apple receipt ---
            const { success, products } = await validateAppleReceipt(apple_receipt);

            if (!success || !products.length) {
                throw { statusCode: 400, message: "Invalid Apple receipt" };
            }
            print(success);
            // Find the relevant purchase in the receipt
            const purchase = products.find(p => p.productId === package.apple_product_id);
            if (!purchase) {
                throw { statusCode: 400, message: "Receipt does not contain the requested package" };
            }

            // Create subscription immediately since payment is already verified
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
                apple_transaction_id: purchase.transactionId,
                coupon_id: appliedCoupon?.id || null,
                discount_applied: discountAmount || 0,
                is_active: true
            });

            if (appliedCoupon) {
                await appliedCoupon.update({ used_count: (appliedCoupon.used_count || 0) + 1 });
            }

            return res.status(201).json({
                success: true,
                message: "Subscription created successfully",
                subscription
            });
        }

    } catch (e) {
        res.status(e.statusCode || 500).json({ success: false, message: e.message || "Internal Server Error" });
    }
};

exports.completeSubscription = async (req, res) => {
    try {
        // 1) Verify signature
        if (!verifyTapSignature(req)) {
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        // 2) Parse raw body
        let parsed;
        try {
            parsed = JSON.parse(req.body.toString('utf8'));
        } catch {
            return res.status(400).json({ success: false, message: 'Invalid JSON' });
        }

        const { id: charge_id, metadata } = parsed;
        if (!charge_id || !metadata) {
            return res.status(400).json({ success: false, message: 'Missing charge_id or metadata' });
        }

        const { user_id, package_id, pricing_id, discount_amount, original_amount, coupon_id } = metadata;

        // 3) Idempotency
        const existing = await Subscription.findOne({ where: { payment_charge_id: charge_id } });
        if (existing) {
            return res.status(200).json({ success: true, message: 'Already processed', subscription: existing });
        }

        // 4) Retrieve & validate charge
        const charge = await retrieveCharge(charge_id);
        if (charge.status !== 'CAPTURED') {
            return res.status(400).json({ success: false, message: `Charge not captured (status=${charge.status})` });
        }

        const expectedFinal = computeExpectedFinal(original_amount, discount_amount);
        const chargeAmount = Number(charge.amount);
        const chargeCurrency = String(charge.currency || '').toUpperCase();

        if (Number.isNaN(chargeAmount) || chargeAmount !== expectedFinal) {
            return res.status(400).json({ success: false, message: 'Charge amount mismatch' });
        }
        if (chargeCurrency !== 'SAR') {
            return res.status(400).json({ success: false, message: 'Charge currency mismatch' });
        }
        // Optional strict metadata round-trip checks:
        if (String(charge.metadata?.user_id) !== String(user_id)) {
            return res.status(400).json({ success: false, message: 'Metadata mismatch (user_id)' });
        }

        // 5) Your existing creation logic
        const user = await User.findByPk(user_id);
        const pkg = await Package.findByPk(package_id);
        const pricing = await PricingModel.findByPk(pricing_id);
        const appliedCoupon = coupon_id ? await Coupon.findByPk(coupon_id) : null;

        if (!user || !pkg || !pricing) {
            return res.status(404).json({ success: false, message: 'User/Package/Pricing not found' });
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
            await appliedCoupon.update({ used_count: (appliedCoupon.used_count || 0) + 1 });
        }

        return res.status(201).json({ success: true, message: 'Subscription completed successfully', subscription });
    } catch (e) {
        console.error(e);
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
                original_amount: Number(mealPlan.price),
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
    try {
        // 1) Verify signature
        if (!verifyTapSignature(req)) {
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        // 2) Parse raw body
        let parsed;
        try {
            parsed = JSON.parse(req.body.toString('utf8'));
        } catch {
            return res.status(400).json({ success: false, message: 'Invalid JSON' });
        }

        const { id: charge_id, metadata } = parsed;
        if (!charge_id || !metadata) {
            return res.status(400).json({ success: false, message: 'Missing charge_id or metadata' });
        }

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
            discount_amount = 0,
            coupon_id
        } = metadata;

        // 3) Idempotency
        const existingByCharge = await MealSubscription.findOne({ where: { payment_charge_id: charge_id } });
        if (existingByCharge) {
            return res.status(200).json({ success: true, message: 'Meal subscription already completed (idempotent).', subscription: existingByCharge });
        }

        // 4) Retrieve & validate charge
        const charge = await retrieveCharge(charge_id);
        if (charge.status !== 'CAPTURED') {
            return res.status(400).json({ success: false, message: `Charge not captured (status=${charge.status})` });
        }

        const expectedFinal = computeExpectedFinal(original_amount, discount_amount);
        const chargeAmount = Number(charge.amount);
        const chargeCurrency = String(charge.currency || '').toUpperCase();

        if (Number.isNaN(chargeAmount) || chargeAmount !== expectedFinal) {
            return res.status(400).json({ success: false, message: 'Charge amount mismatch' });
        }
        if (chargeCurrency !== 'SAR') {
            return res.status(400).json({ success: false, message: 'Charge currency mismatch' });
        }
        if (String(charge.metadata?.user_id) !== String(user_id)) {
            return res.status(400).json({ success: false, message: 'Metadata mismatch (user_id)' });
        }

        // 5) Creation logic
        const user = await User.findByPk(user_id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const mealPlan = await MealPlan.findByPk(meal_plan_id, { include: [{ model: Type, as: 'types' }] });
        if (!mealPlan) return res.status(404).json({ success: false, message: 'Meal Plan not found' });

        const deliveryTime = await DeliveryTime.findByPk(delivery_time_id);
        if (!deliveryTime) return res.status(404).json({ success: false, message: 'Delivery time not found' });

        const appliedCoupon = coupon_id ? await Coupon.findByPk(coupon_id) : null;

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

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + Number(mealPlan.number_of_days));

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

        const planTypeIds = (mealPlan.types || []).map((t) => t.id);
        const selections = [];
        let cursor = new Date(startDate);

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
            await UserMealSelection.bulkCreate(selections, { ignoreDuplicates: true });
        }

        if (appliedCoupon) {
            await appliedCoupon.update({ used_count: (appliedCoupon.used_count || 0) + 1 });
        }

        return res.status(201).json({
            success: true,
            message: 'Meal Subscription completed successfully',
            subscription
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};
