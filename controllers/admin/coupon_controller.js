const Coupon = require('../../models/fitness/coupon');

// Helper function to parse and validate date
function parseDate(dateString) {
    if (!dateString) return null;

    // Try different date formats
    const formats = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD (ISO)
        /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    ];

    let date;

    if (formats[0].test(dateString)) {
        // Already in ISO format
        date = new Date(dateString);
    } else if (formats[1].test(dateString)) {
        // DD-MM-YYYY format
        const [day, month, year] = dateString.split('-');
        date = new Date(`${year}-${month}-${day}`);
    } else if (formats[2].test(dateString)) {
        // DD/MM/YYYY format
        const [day, month, year] = dateString.split('/');
        date = new Date(`${year}-${month}-${day}`);
    } else {
        // Try direct parsing as fallback
        date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
        throw new Error('Invalid date format. Use YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY');
    }

    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

exports.createCoupon = async (req, res, next) => {
    try {
        const { code, discount_type, discount_value, expiry_date, usage_limit, is_active, package_id, meal_plan_id } = req.body;

        // Parse and validate expiry_date
        const parsedExpiryDate = parseDate(expiry_date);

        const coupon = await Coupon.create({
            code,
            discount_type,
            discount_value,
            expiry_date: parsedExpiryDate,
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
        const { package_id, meal_plan_id } = req.query;
        let whereClause = {};

        if (package_id) {
            whereClause.package_id = package_id;
        } else if (meal_plan_id) {
            whereClause.meal_plan_id = meal_plan_id;
        }

        const coupons = await Coupon.findAll({
            where: whereClause
        });
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

        // Parse expiry_date if it's being updated
        if (req.body.expiry_date) {
            req.body.expiry_date = parseDate(req.body.expiry_date);
        }

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