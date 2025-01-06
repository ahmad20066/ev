const MealSubscription = require("../../models/meals/meal_subscription");
const Package = require("../../models/package");
const PricingModel = require("../../models/pricing_model");
const Subscription = require("../../models/subscription");
const User = require("../../models/user");
const WeightRecord = require("../../models/weight_record");
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
            },
            include: [{
                model: Package,
                as: "package",

            },
            {
                model: PricingModel,
                as: "pricing",

            },
            ]
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
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { name, email, phone } = req.body;

        if (!name && !email && !phone) {
            const error = new Error("You must provide at least one field to update: name, email, or phone.");
            error.statusCode = 400;
            throw error;
        }

        const user = await User.findByPk(userId);

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        const updatedData = {};
        if (name) updatedData.name = name;
        if (email) updatedData.email = email;
        if (phone) updatedData.phone = phone;

        await user.update(updatedData);

        const updatedUser = await User.scope('defaultScope').findByPk(userId);

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};
exports.isSubscribed = async (req, res, next) => {
    try {
        const user_id = req.userId;
        let isSubscribedFitness, isSubscribedDiet = false;
        const fitnessSubscription = await Subscription.findOne({
            where: {
                is_active: true,
                user_id
            }
        })
        console.log(fitnessSubscription);
        if (fitnessSubscription) {
            isSubscribedFitness = true
        } else {
            isSubscribedFitness = false
        }
        const dietSubscription = await MealSubscription.findOne({
            where: {
                is_active: true,
                user_id
            }
        })
        if (dietSubscription) {
            isSubscribedDiet = true
        } else {
            isSubscribedDiet = false
        }
        res.status(200).json({
            fitnessSubscription: isSubscribedFitness,
            dietSubscription: isSubscribedDiet
        })
    } catch (e) {
        next(e)
    }
}



