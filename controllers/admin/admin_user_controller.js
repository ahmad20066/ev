const ExerciseCompletion = require("../../models/fitness/exercise_completion");
const WorkoutAttendance = require("../../models/fitness/workout_attendance");
const WorkoutCompletion = require("../../models/fitness/workout_completion");
const MealSubscription = require("../../models/meals/meal_subscription");
const Subscription = require("../../models/subscription");
const User = require("../../models/user");
const WeightRecord = require("../../models/weight_record");

exports.getUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        const users = await User.findAll({
            where: {
                is_active: true,
                role
            },
            include: {
                model: WeightRecord,
                as: "weight"
            }
        });
        res.status(200).json(users);
    } catch (e) {
        next(e)
    }
}
exports.getDeactivatedUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            where: {
                is_active: false,
                role
            },
            include: {
                model: WeightRecord,
                as: "weight"
            }
        });
        res.status(200).json(users);
    } catch (e) {
        next(e)
    }
}
exports.getUsersActiveSubscription = async (req, res, next) => {
    try {
        const activeUsers = await User.findAll({
            include: {
                model: Subscription,
                where: {
                    is_active: true
                },
                include: {
                    model: WeightRecord,
                    as: "weight"
                }
            }
        });

        res.status(200).json({ activeUsers });
    } catch (error) {
        next(error);
    }
};
exports.getUserDetails = (req, res, next) => {
    const { id } = req.params;
    try {
        const user = User.findByPk(id, {
            where: {
                role: "consumer"
            },
            include: [
                {
                    model: Subscription,
                    as: "fitness_subscription"
                },
                {
                    model: MealSubscription,
                    as: "diet_subscription"
                },
                {
                    model: WorkoutAttendance,
                    as: "workout_attendances"
                },
                {
                    model: WorkoutCompletion,
                    as: "workouts_completed"
                },
                {
                    model: ExerciseCompletion,
                    as: "exercises_completed"
                }
            ]
        })
        res.status(200).json(user)
    } catch (e) {
        next(e)
    }
}
exports.deactivateUser = async (req, res, next) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.update({
            is_active: false,
            deactivated_at: new Date(),
        });

        res.status(200).json({ message: "User has been deactivated" });
    } catch (error) {
        next(error);
    }
};
exports.reactivateUser = async (req, res, next) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.update({
            is_active: true,
            deactivated_at: null,
        });

        res.status(200).json({ message: "User has been reactivated" });
    } catch (error) {
        next(error);
    }
};
exports.createAdmin = (req, res, next) => { }
