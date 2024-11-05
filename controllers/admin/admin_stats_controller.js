const MealSubscription = require("../../models/meals/meal_subscription")
const Subscription = require("../../models/subscription")
const User = require("../../models/user")
const { Op } = require('sequelize');
const { startOfMonth, endOfMonth } = require('date-fns');
const Exercise = require("../../models/fitness/exercise");
const WorkoutExercise = require("../../models/fitness/workout_exercise");
const ExerciseCompletion = require("../../models/fitness/exercise_completion");
const WorkoutAttendance = require("../../models/fitness/workout_attendance");
const WorkoutCompletion = require("../../models/fitness/workout_completion");

exports.activeSubscriptionsFitness = async (req, res, next) => {
    try {
        const { type } = req.query;
        const package = type == "group" ? 1 : 2
        const subscriptions = await Subscription.findAll({
            where: {
                is_active: true,
                package_id: package
            }
        })
        res.status(200).json({ subscriptions: subscriptions.length })
    }
    catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500
        }
        next(e);
    }
}
exports.activeSubscriptionsMeals = async (req, res, next) => {
    try {
        const subscriptions = await MealSubscription.findAll({
            where: {
                is_active: true,
            }
        })
        res.status(200).json({ subscriptions: subscriptions.length })
    }
    catch (e) {
        next(e);
    }
}
exports.newSignUps = async (req, res, next) => {
    try {
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());

        const newSignupsCount = await User.count({
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        res.status(200).json({ newSignupsCount });
    } catch (error) {
        next(error);
    }
};
exports.workoutCompletionRate = async (req, res, next) => {
    try {
        const workoutsCount = await WorkoutAttendance.count()
        const completedWorkoutsCount = await WorkoutCompletion.count();
        const rate = completedWorkoutsCount == 0 ? 0 : (workoutsCount / completedWorkoutsCount) * 100;
        res.status(200).json({
            "completion_rate": rate
        })
    } catch (e) {
        next(e);
    }
}
