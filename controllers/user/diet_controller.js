const MealPlan = require("../../models/meals/meal_plan");
const MealSubscription = require("../../models/meals/meal_subscription")
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



        const mealPlan = await MealPlan.findByPk(meal_plan_id);
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
        const mealSubscription = await MealSubscription.create({
            type: type,
            meal_plan_id: meal_plan_id,
            user_id: req.userId,
            start_date: startDate,
            end_date: endDate
        });

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

