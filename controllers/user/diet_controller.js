const { Op } = require("sequelize");
const Meal = require("../../models/meals/meal");
const MealDay = require("../../models/meals/meal_day");
const MealPlan = require("../../models/meals/meal_plan");

const MealSubscription = require("../../models/meals/meal_subscription");
const Type = require("../../models/meals/type");
const UserMealSelection = require("../../models/meals/user_meal_selection");
const Subscription = require("../../models/subscription");
const DeliveryTime = require("../../models/meals/delivery_time");
const Address = require("../../models/meals/address");
const Ingredient = require("../../models/meals/ingredient");
const MealRenewal = require("../../models/meals/meal_renewal");
exports.getMealPlans = async (req, res, next) => {
    try {
        const mealPlans = await MealPlan.findAll();
        res.status(200).json(mealPlans);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.subscribeToMealPlan = async (req, res, next) => {
    try {
        const { meal_plan_id, delivery_time_id, address_label, street, city, building } = req.body;
        const oldSubscription = await MealSubscription.findOne({
            where: {
                user_id: req.userId,
                is_active: true
            }
        })
        // if (oldSubscription) {
        //     const error = new Error("You are already subscribed");
        //     error.statusCode = 400;
        //     throw error;
        // }
        const mealPlan = await MealPlan.findByPk(meal_plan_id, {
            include: {
                model: Type,
                as: "types",
            },
        });

        if (!mealPlan) {
            const error = new Error("Meal Plan not found");
            error.statusCode = 404;
            throw error;
        }
        const delivery_time = await DeliveryTime.findByPk(delivery_time_id)
        if (!delivery_time) {
            const error = new Error("Delivery time not found");
            error.statusCode = 404;
            throw error;
        }
        const startDate = new Date();
        const address = await Address.create({ address_label, city, street, building });
        let endDate;

        endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);

        const mealSubscription = await MealSubscription.create({
            type: "monthly",
            meal_plan_id: meal_plan_id,
            user_id: req.userId,
            start_date: startDate,
            end_date: endDate,
            delivery_time_id,
            address_id: address.id,
        });

        const upcomingWeek = getUpcomingWeek();

        for (const { day } of upcomingWeek) {
            console.log("1")
            for (const type of mealPlan.types) {
                console.log("2")
                console.log(type)
                const meal = await Meal.findOne({
                    include: {
                        model: Type,
                        as: "types",
                        where: { id: type.id },
                    },
                });
                console.log(meal)

                if (meal) {
                    await UserMealSelection.create({
                        user_id: req.userId,
                        day,
                        meal_id: meal.id,
                        meal_subscription_id: mealSubscription.id,
                    });
                }
            }
        }

        res.status(201).json({
            message: "Subscription Successful",
            subscription: mealSubscription,
        });
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};
exports.getMealSubscriptions = async (req, res, next) => {
    try {
        const userId = req.userId;
        const subscriptions = await MealSubscription.findAll({
            where: {
                user_id: userId
            },
            attributes: {
                exclude: ["meal_plan_id", "user_id", "createdAt", "updatedAt", "address_id", "delivery_time_id"]
            },
            include: [
                {
                    model: Address,
                    as: "address",
                },
                {
                    model: MealPlan,
                    as: "meal_plan",
                },
                {
                    model: DeliveryTime,
                    as: "delivery_time"
                }
            ],
        })
        const currentDate = new Date();
        const subscriptionsWithDaysLeft = subscriptions.map(subscription => {
            const endDate = new Date(subscription.end_date);
            const remainingDays = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));

            return {
                ...subscription.toJSON(),
                remaining_days: remainingDays > 0 ? remainingDays : 0,
            };
        });
        res.status(200).json(subscriptionsWithDaysLeft)
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e)
    }
}

const getUpcomingWeek = () => {
    const today = new Date();
    const week = [];
    const daysOfWeek = ["sunday", "monday", "wednesday", "tuesday", "thursday", "friday", "saturday"];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        const day = daysOfWeek[date.getDay()];
        const formattedDate = date.toISOString().split("T")[0];
        week.push({ date: formattedDate, day });
    }

    return week;
};
exports.getMealsForWeek = async (req, res, next) => {
    try {
        const upcomingWeek = getUpcomingWeek();
        const dates = upcomingWeek.map(entry => entry.day);

        const meals = await MealDay.findAll({
            where: {
                day: dates
            },
            include: {
                model: Meal,
                as: "meal"
            }
        });

        const groupedByDay = upcomingWeek.map(entry => ({
            day: entry,
            meals: meals.filter(m => m.day == entry.day).map(m => m.meal)
        }));

        res.status(200).json(groupedByDay);
    } catch (error) {
        next(error);
    }
};


exports.getMealSelections = async (req, res, next) => {
    try {
        const userId = req.userId;
        let { day } = req.query;  // Change 'date' to 'day'

        if (!day) {
            const today = new Date();
            const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            day = dayNames[today.getDay()]; // Get the current day as a string (e.g., "monday")
        }

        console.log(`UserID: ${userId}, Day: ${day}`);

        const selections = await UserMealSelection.findAll({
            where: {
                user_id: userId,
                day: day,  // Match by 'day' instead of 'date'
            },
            include: {
                model: Meal,
                as: "meal",
            },
        });

        if (!selections.length) {
            return res.status(404).json({ message: "No meal selections found for the specified day." });
        }

        const meals = selections.map(selection => ({
            selection_id: selection.id, // Include selection id
            type: selection.meal.types?.length > 0 ? selection.meal.types[0].title : null,
            meal: selection.meal,
        }));

        res.status(200).json({
            day: day,  // Return the 'day' instead of 'date'
            meals,
        });
    } catch (error) {
        next(error);
    }
};

exports.getMealById = async (req, res, next) => {
    try {
        const { id } = req.params
        const meal = await Meal.findByPk(id,)
        if (!meal) {
            const error = new Error("Meal not found")
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json(meal)
    } catch (e) {
        next(e)
    }
}
exports.changeSelection = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { selection_id, meal_id } = req.body;

        if (!selection_id || !meal_id) {
            const error = new Error("Both selection_id and meal_id are required.");
            error.statusCode = 400;
            throw error;
        }

        // Find the selection by id and verify it belongs to the user
        const selection = await UserMealSelection.findOne({
            where: {
                id: selection_id,
                user_id: userId,
            },
        });

        if (!selection) {
            const error = new Error("No selection found for the specified id.");
            error.statusCode = 404;
            throw error;
        }

        const today = new Date();
        const targetDate = new Date(selection.date);

        const daysDifference = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

        if (daysDifference < 2) {
            const error = new Error("You can only change your selection at least 2 days in advance.");
            error.statusCode = 403;
            throw error;
        }

        selection.meal_id = meal_id;
        await selection.save();

        res.status(200).json({
            message: "Meal selection updated successfully.",
            // updatedSelection: selection,
        });
    } catch (error) {
        next(error);
    }
};
exports.getAllDeliveryTimes = async (req, res, next) => {
    try {
        const deliveryTimes = await DeliveryTime.findAll();

        res.status(200).json(deliveryTimes);
    } catch (error) {
        next(error);
    }
};
exports.renewSubscription = async (req, res, next) => {
    try {
        const { subscription_id } = req.query
        const subscription = await MealSubscription.findByPk(subscription_id,)
        if (!subscription) {
            const error = new Error("Subscription not found")
            error.statusCode = 404
            throw error;
        }
        if (subscription.is_active) {
            const error = new Error("Subscription already active")
            error.statusCode = 400
            throw error;
        }
        subscription.is_active = true;
        let endDate = new Date(subscription.end_date);
        endDate.setDate(endDate.getDate() + 30);

        subscription.end_date = endDate;
        console.log(endDate)
        subscription.end_date = endDate
        await subscription.save()
        const renewal = new MealRenewal({
            subscription_id
        })
        await renewal.save();
        res.status(201).json({
            message: "Subscription renewed",
            subscription
        })
    } catch (e) {
        next(e)
    }
}



