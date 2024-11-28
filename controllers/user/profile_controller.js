const Package = require("../../models/package");
const PricingModel = require("../../models/pricing_model");
const Subscription = require("../../models/subscription");
const User = require("../../models/user");
const WeightRecord = require("../../models/weight_record");


exports.editProfile = async (req, res, next) => {
    const user_id = req.userId;
    const { email, name, phone, image } = req.body
    const user = await User.findByPk(user_id, {

    })
    user.update({})
}
exports.cancelSubscription = async (req, res, next) => {
    try {
        const userId = req.userId;
        const subscription = await Subscription.findOne({
            where: {
                user_id: userId,
                is_active: true
            }
        })
        console.log(subscription)
        if (!subscription) {
            const error = new Error("You have no active subscription to cancel")
            error.statusCode = 404
            throw error;
        }
        subscription.is_active = false;
        await subscription.save()
        res.status(201).json({
            message: "Subscription canceled successfully"
        })
    } catch (e) {
        next(e)
    }
}
exports.getSubscriptions = async (req, res, next) => {
    try {
        const userId = req.userId
        const subscriptions = await Subscription.findAll({
            where: {
                user_id: userId
            }
        })
        res.status(200).json(subscriptions)
    } catch (e) {
        next(e)
    }
}
exports.getSubscription = async (req, res, next) => {
    try {
        const userId = req.userId;
        const subscription = await Subscription.findOne({
            where: {
                user_id: userId,
                is_active: true,
            },
            attributes: {
                exclude: ['package_id', 'pricing_id', 'user_id']
            },
            include: [
                {
                    model: Package,
                    as: 'package',
                },
                {
                    model: PricingModel,
                    as: 'pricing'
                }
            ],
        });
        if (!subscription) {
            const error = new Error("Active subscription not found");
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json(subscription);
    } catch (e) {
        next(e);
    }
};
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.userId;

        const user = await User.findByPk(userId, {
            include: {
                model: WeightRecord,
                as: "weight-record",
                order: [["createdAt", "DESC"]],
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const weightRecord = user["weight-record"]?.[0];
        console.log(weightRecord)
        const lastWeight = weightRecord ? weightRecord.weight : null;

        user.dataValues.weight = lastWeight;

        delete user.dataValues["weight-record"];

        res.status(200).json(user);
    } catch (e) {
        next(e);
    }
};


