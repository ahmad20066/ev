const MealSubscription = require("../../models/meals/meal_subscription");
const Notification = require("../../models/noitifcation");
const Package = require("../../models/package");
const PricingModel = require("../../models/pricing_model");
const Subscription = require("../../models/subscription");
const User = require("../../models/user");
const WeightRecord = require("../../models/weight_record");
exports.cancelSubscription = async (req, res, next) => {
    try {
        const { id, type } = req.body;
        const user_id = req.userId
        let subscription;
        if (type === "fitness") {
            subscription = await Subscription.findOne({
                where: {
                    id,
                    is_active: true,
                    user_id
                }
            })
        } else if (type === "diet") {
            subscription = await MealSubscription.findOne({
                where: {
                    id,
                    is_active: true,
                    user_id
                }
            })
        } else {
            const error = new Error("Invalid type")
            error.statusCode = 400
            throw error;
        }

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
// Get all subscriptions
exports.getSubscriptions = async (req, res, next) => {
    try {
        const userId = req.userId;

        // Fetch fitness subscriptions
        const fitnessSubscriptions = await Subscription.findAll({
            where: {
                user_id: userId
            },
            include: [
                {
                    model: Package,
                    as: "package",
                },
                {
                    model: PricingModel,
                    as: "pricing",
                }
            ]
        });

        // Fetch diet subscriptions
        const mealSubscriptions = await MealSubscription.findAll({
            where: {
                user_id: userId
            }
        });

        res.status(200).json({
            fitnessSubscriptions: fitnessSubscriptions.length > 0 ? fitnessSubscriptions : null,
            dietSubscriptions: mealSubscriptions.length > 0 ? mealSubscriptions : null
        });
    } catch (e) {
        next(e);
    }
};

// Get active subscription
exports.getSubscription = async (req, res, next) => {
    try {
        const userId = req.userId;

        // Fetch active fitness subscription
        const fitnessSubscription = await Subscription.findOne({
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

        // Fetch active diet subscription
        const dietSubscription = await MealSubscription.findOne({
            where: {
                user_id: userId,
                is_active: true,
            },
        });

        res.status(200).json({
            fitnessSubscription: fitnessSubscription || null,
            dietSubscription: dietSubscription || null
        });
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
        const { name, email, phone, age } = req.body;

        if (!name && !email && !phone && !age) {
            const error = new Error("You must provide at least one field to update: name, email,age, or phone.");
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
        if (age) updatedData.age = age;

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
exports.getNotifications = async (req, res, next) => {
    try {
        const userId = req.userId; // Assuming userId is available from a middleware (e.g., JWT auth)

        const notifications = await Notification.findAll({
            where: { user_id: userId },
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json(

            notifications,
        );
    } catch (error) {
        console.error("Error fetching notifications:", error);
        next(error);
    }
};



