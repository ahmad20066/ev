const { Op } = require("sequelize");
const Meal = require("../../models/meals/meal");
const MealDay = require("../../models/meals/meal_day");
const MealPlan = require("../../models/meals/meal_plan");

const MealSubscription = require("../../models/meals/meal_subscription");
const Type = require("../../models/meals/type");
const UserMealSelection = require("../../models/meals/user_meal_selection");
const Subscription = require("../../models/subscription");
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
        const { type, meal_plan_id } = req.body;

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

        const startDate = new Date();
        let endDate;

        if (type === "weekly") {
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 7);
        } else if (type === "monthly") {
            endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + 1);
        }

        // Create Meal Subscription
        const mealSubscription = await MealSubscription.create({
            type: type,
            meal_plan_id: meal_plan_id,
            user_id: req.userId,
            start_date: startDate,
            end_date: endDate,
        });

        // Get upcoming week days
        const upcomingWeek = getUpcomingWeek();

        // Assign meals by type for each day
        for (const { date } of upcomingWeek) {
            for (const type of mealPlan.types) {
                console.log(type)
                const meal = await Meal.findOne({
                    include: {
                        model: Type,
                        as: "types",
                        where: { id: type.id }, // Match the type
                    },
                });
                console.log(meal)

                if (meal) {
                    await UserMealSelection.create({
                        user_id: req.userId,
                        date,
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
                exclude: ["meal_plan_id", "user_id", "createdAt", "updatedAt"]
            },
            include: {
                model: MealPlan,
                as: "meal_plan"
            }
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
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
        const dates = upcomingWeek.map(entry => entry.date);

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
            meals: meals.filter(m => m.day === entry.date).map(m => m.meal)
        }));

        res.status(200).json(groupedByDay);
    } catch (error) {
        next(error);
    }
};
exports.getMealSelections = async (req, res, next) => {
    try {
        const userId = req.userId;
        let { date } = req.query;

        if (!date) {
            const today = new Date();
            date = today.toISOString().split("T")[0];
        }

        console.log(`UserID: ${userId}, Date: ${date}`);

        const selections = await UserMealSelection.findAll({
            where: {
                user_id: userId,
                date: {
                    [Op.startsWith]: date, // Match the date
                },
            },
            include: {
                model: Meal,
                as: "meal",
            },
        });

        if (!selections.length) {
            return res.status(404).json({ message: "No meal selections found for the specified date." });
        }

        const meals = selections.map(selection => ({
            selection_id: selection.id, // Include selection id
            type: selection.meal.types?.length > 0 ? selection.meal.types[0].title : null,
            meal: selection.meal,
        }));

        res.status(200).json({
            date: date,
            meals,
        });
    } catch (error) {
        next(error);
    }
};

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




