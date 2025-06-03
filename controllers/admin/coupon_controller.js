const Coupon = require('../../models/fitness/coupon');

exports.createCoupon = async (req, res, next) => {
    try {
        const { code, discount_type, discount_value, expiry_date, usage_limit, is_active, package_id, meal_plan_id } = req.body;
        const coupon = await Coupon.create({
            code,
            discount_type,
            discount_value,
            expiry_date,
            usage_limit,
            is_active,
            package_id,
            meal_plan_id
        });
        res.status(201).json({ message: 'Coupon created', coupon });
    } catch (error) {
        next(error);
    }
};

exports.getCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.findAll();
        res.status(200).json(coupons);
    } catch (error) {
        next(error);
    }
};

exports.getCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.status(200).json(coupon);
    } catch (error) {
        next(error);
    }
};

exports.updateCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        await coupon.update(req.body);
        res.status(200).json({ message: 'Coupon updated', coupon });
    } catch (error) {
        next(error);
    }
};

exports.deleteCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        await coupon.destroy();
        res.status(200).json({ message: 'Coupon deleted' });
    } catch (error) {
        next(error);
    }
}; 