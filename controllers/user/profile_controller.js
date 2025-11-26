const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const Address = require("../../models/meals/address");
const Ingredient = require("../../models/meals/ingredient");
const Meal = require("../../models/meals/meal");
const MealSubscription = require("../../models/meals/meal_subscription");
const Order = require("../../models/meals/order");
const UserMealSelection = require("../../models/meals/user_meal_selection");
const Notification = require("../../models/noitifcation");
const Package = require("../../models/package");
const PricingModel = require("../../models/pricing_model");
const Subscription = require("../../models/subscription");
const Answer = require("../../models/survey/answer");
const Question = require("../../models/survey/question");
const Survey = require("../../models/survey/survey");
const User = require("../../models/user");
const WeightRecord = require("../../models/weight_record");
const DeliveryTime = require("../../models/meals/delivery_time");
const MealPlan = require("../../models/meals/meal_plan");
exports.cancelSubscription = async (req, res, next) => {
    try {
        const { id, type } = req.body;
        const user_id = req.userId;
        let subscription;

        if (type === "fitness") {
            subscription = await Subscription.findOne({
                where: {
                    id,
                    is_active: true,
                    user_id
                }
            });
        } else if (type === "diet") {
            subscription = await MealSubscription.findOne({
                where: {
                    id,
                    is_active: true,
                    user_id
                }
            });

            if (subscription) {
                await Order.destroy({
                    where: { user_id }
                });
                await UserMealSelection.destroy({
                    where: { user_id }
                })
            }
        } else {
            const error = new Error("Invalid type");
            error.statusCode = 400;
            throw error;
        }

        if (!subscription) {
            const error = new Error("You have no active subscription to cancel");
            error.statusCode = 404;
            throw error;
        }

        subscription.is_active = false;
        await subscription.save();

        res.status(201).json({
            message: "Subscription canceled successfully, meal orders deleted if applicable."
        });
    } catch (e) {
        next(e);
    }
};

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
            },
            include: [
                {
                    model: MealPlan,
                    as: "meal_plan"
                }
            ]
        });

        // Transform meal subscriptions to include calculated fields
        const transformedMealSubscriptions = mealSubscriptions.map(sub => {
            const subscriptionData = sub.toJSON();
            
            // Calculate display type and amount_paid based on subscription_duration
            let displayType = 'Monthly';
            let amountPaid = 0;
            
            if (subscriptionData.subscription_duration === 21) {
                displayType = '21 Days';
                amountPaid = subscriptionData.meal_plan?.price_21_days || 0;
            } else if (subscriptionData.subscription_duration === 26) {
                displayType = '26 Days';
                amountPaid = subscriptionData.meal_plan?.price_26_days || 0;
            } else {
                // Fallback for old subscriptions without subscription_duration
                displayType = 'Monthly';
                amountPaid = subscriptionData.meal_plan?.price_monthly || 0;
            }
            
            // Calculate final amount after discount
            const finalAmount = amountPaid - (Number(subscriptionData.discount_applied) || 0);
            
            return {
                ...subscriptionData,
                display_type: displayType,
                amount_paid: finalAmount,
                original_price: amountPaid
            };
        });

        res.status(200).json({
            fitnessSubscriptions: fitnessSubscriptions.length > 0 ? fitnessSubscriptions : null,
            dietSubscriptions: transformedMealSubscriptions.length > 0 ? transformedMealSubscriptions : null
        });
    } catch (e) {
        next(e);
    }
};

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

        const dietSubscription = await MealSubscription.findOne({
            where: {
                user_id: userId,
                is_active: true,
            },
            include: [
                {
                    model: MealPlan,
                    as: "meal_plan"
                }
            ]
        });

        let surveyCompleted = false;
        if (fitnessSubscription) {
            const survey = await Survey.findOne({
                where: {
                    package_id: fitnessSubscription.package.id
                }
            });

            if (survey) {
                const surveyAnswered = await Answer.findOne({
                    where: {
                        user_id: userId,
                    },
                    include: {
                        model: Question,
                        as: "question",
                        where: { survey_id: survey.id }
                    }
                });
                surveyCompleted = !!surveyAnswered;
            }
        }

        // Transform diet subscription to include calculated fields
        let transformedDietSubscription = null;
        if (dietSubscription) {
            const subscriptionData = dietSubscription.toJSON();
            
            // Calculate display type and amount_paid based on subscription_duration
            let displayType = 'Monthly';
            let amountPaid = 0;
            
            if (subscriptionData.subscription_duration === 21) {
                displayType = '21 Days';
                amountPaid = subscriptionData.meal_plan?.price_21_days || 0;
            } else if (subscriptionData.subscription_duration === 26) {
                displayType = '26 Days';
                amountPaid = subscriptionData.meal_plan?.price_26_days || 0;
            } else {
                // Fallback for old subscriptions without subscription_duration
                displayType = 'Monthly';
                amountPaid = subscriptionData.meal_plan?.price_monthly || 0;
            }
            
            // Calculate final amount after discount
            const finalAmount = amountPaid - (Number(subscriptionData.discount_applied) || 0);
            
            transformedDietSubscription = {
                ...subscriptionData,
                display_type: displayType,
                amount_paid: finalAmount,
                original_price: amountPaid
            };
        }

        res.status(200).json({
            fitnessSubscription: fitnessSubscription ? { ...fitnessSubscription.toJSON(), surveyCompleted } : null,
            dietSubscription: transformedDietSubscription
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
                order: [["createdAt", "ASC"]],
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const weightRecord = user["weight-record"]?.[user["weight-record"].length - 1];
        console.log(user["weight-record"])
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

        if (!name && !email && !phone && !age && !req.file) {
            const error = new Error("You must provide at least one field to update: name, email, age, phone, or profile_image.");
            error.statusCode = 400;
            throw error;
        }

        const user = await User.findByPk(userId);

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        // Store old profile image path if it exists
        const oldProfileImage = user.profile_image;

        const updatedData = {};
        if (name) updatedData.name = name;
        if (email) updatedData.email = email;
        if (phone) updatedData.phone = phone;
        if (age) updatedData.age = age;
        
        // Handle profile image upload
        if (req.file) {
            updatedData.profile_image = req.file.path;
            
            // Delete old profile image file if it exists
            if (oldProfileImage) {
                try {
                    // Extract the file path from the URL (remove BASE_URL if present)
                    const BASE_URL = process.env.BASE_URL || '';
                    let filePath = oldProfileImage;
                    if (BASE_URL && oldProfileImage.startsWith(BASE_URL)) {
                        filePath = oldProfileImage.replace(BASE_URL + '/', '');
                    }
                    
                    const fullPath = path.join(__dirname, '../../', filePath);
                    
                    // Check if file exists before deleting
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log(`Deleted old profile image: ${fullPath}`);
                    }
                } catch (fileError) {
                    // Log error but don't fail the update if file deletion fails
                    console.error("Error deleting old profile image:", fileError);
                }
            }
        }

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
exports.getOrders = async (req, res, next) => {
    try {
        const user_id = req.userId;
        const subscription = await MealSubscription.findOne({
            where: {
                user_id,
                is_active: true
            },
            include: {
                model: DeliveryTime,
                as: "delivery_time"
            }
        })
        if (!subscription) {
            const error = new Error("No Subscription")
            error.statusCode = 400;
            throw error;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endOfWeek = new Date();
        const dayOfWeek = endOfWeek.getDay();
        const daysUntilSunday = 7 - dayOfWeek;
        endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
        endOfWeek.setHours(23, 59, 59, 999);

        const orders = await Order.findAll({
            where: {
                order_date: {
                    [Op.lte]: endOfWeek
                },
                user_id
            },

        });
        orders.forEach(e => {
            e.dataValues.deliveryTime = subscription.delivery_time;
        });


        res.status(200).json(orders);
    } catch (e) {
        next(e);
    }
};
exports.getOrderById = async (req, res, next) => {

    try {
        const orderId = req.params.id;

        const order = await Order.findOne({
            where: { id: orderId, user_id: req.userId },
            include: [
                {
                    model: User,
                    as: "user"
                },
                {
                    model: Meal,
                    as: "meals",
                    through: {
                        attributes: ['quantity']
                    },
                    include: [
                        {
                            model: Ingredient,
                            as: "ingredients",
                            attributes: ["id", "title", "stock", "unit"],
                            through: {
                                attributes: ["quantity"]
                            }
                        }
                    ]
                },
                {
                    model: MealSubscription,
                    as: "subscription",
                    include: {
                        model: Address,
                        as: "address"
                    }
                }
            ],

        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.meals.forEach(meal => {
            meal.dataValues.quantity = meal.OrderMeal.quantity;
            delete meal.dataValues.OrderMeal;

            meal.ingredients.forEach(ingredient => {
                ingredient.dataValues.quantity = ingredient.MealIngredient.quantity;
                delete ingredient.dataValues.MealIngredient;
            });
        });



        res.status(200).json(order);

    } catch (e) {
        await t.rollback();
        next(e);
    }
};
exports.deactivateAccount = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await User.findByPk(userId);
        await user.destroy();
        res.status(200).json({ message: "Account deactivated successfully" });
    } catch (e) {
        next(e);
    }
}

