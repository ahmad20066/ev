const { Op } = require("sequelize");
const Banner = require("../../models/banner");
const Exercise = require("../../models/fitness/exercise");
const Workout = require("../../models/fitness/workout");
const MealPlan = require("../../models/meals/meal_plan");
const Package = require("../../models/package");
const Subscription = require("../../models/subscription");
const Meal = require("../../models/meals/meal");
const MealDay = require("../../models/meals/meal_day");
const UserMealSelection = require("../../models/meals/user_meal_selection");

exports.getBanner = async (req, res, next) => {
    try {
        const banners = await Banner.findAll();
        res.status(200).json(banners);
    } catch (error) {
        next(error);
    }
}
exports.getHomePlans = async (req, res, next) => {
    try {
        const plans = await MealPlan.findAll({
            where: { is_active: true },
            limit: 5,
            order: [
                ['createdAt', 'DESC']
            ]
        })
        res.status(200).json(plans)
    } catch (e) {
        next(e)
    }
}
exports.getHomePackages = async (req, res, next) => {
    try {
        const packages = await Package.findAll({
            limit: 5,
            order: [
                ['createdAt', 'DESC']
            ]
        })
        res.status(200).json(packages)
    } catch (e) {
        next(e)
    }
}
exports.getHomeWorkouts = async (req, res, next) => {
    try {
        const subscription = await Subscription.findOne({
            where: {
                is_active: true,
                user_id: req.userId,
            },
        });

        if (!subscription) {
            const error = new Error('No subscription for this user');
            error.statusCode = 403;
            throw error;
        }

        const packageData = await Package.findByPk(subscription.package_id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endOfWeek = new Date();
        const dayOfWeek = endOfWeek.getDay();
        const daysUntilSunday = 7 - dayOfWeek;
        endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
        endOfWeek.setHours(23, 59, 59, 999);

        let workouts;

        if (packageData.type === 'group') {
            workouts = await Workout.findAll({
                where: {
                    package_id: subscription.package_id,
                    is_active: true,
                    date: {
                        [Op.between]: [today, endOfWeek]
                    }
                },
            });
        } else {
            workouts = await Workout.findAll({
                where: {
                    is_active: true,
                    package_id: subscription.package_id,
                    user_id: req.userId,
                    date: {
                        [Op.between]: [today, endOfWeek]
                    }
                },
            });
        }

        const workoutsWithDay = workouts.map((workout) => {
            const workoutJson = workout.toJSON();
            const dateObj = new Date(workoutJson.date);
            const dayOfWeek = dateObj.toLocaleString('en-US', { weekday: 'long' });

            return {
                ...workoutJson,
                day: dayOfWeek,
            };
        });

        res.status(200).json(workoutsWithDay);
    } catch (e) {
        next(e);
    }
};
exports.getWorkoutById = async (req, res, next) => {
    try {
        const { id } = req.params
        const subscription = await Subscription.findOne({
            where: {
                is_active: true,
                user_id: req.userId
            }
        })
        if (!subscription) {
            const error = new Error("no subscription for this user")
            error.statusCode = 403;
            throw error
        }
        const package = await Package.findByPk(subscription.package_id)
        if (package.type === 'group') {
            const workout = await Workout.findOne({
                where: {
                    package_id: subscription.package_id,
                    id
                },
                include: {
                    model: Exercise,
                    as: "exercises",

                }

            })
            if (!workout) {
                const error = new Error("Workout not found")
                error.statusCode = 404;
                throw error
            }
            res.status(200).json(workout)
        } else {
            const workout = await Workout.findOne({
                where: {
                    package_id: subscription.package_id,
                    user_id: req.userId,
                    id
                }
            })
            if (!workout) {
                const error = new Error("Workout not found")
                error.statusCode = 404;
                throw error
            }
            res.status(200).json(workout)
        }
    } catch (e) {
        next(e)
    }
}


exports.getHomeMeals = async (req, res, next) => {
    try {
        const userId = req.userId;

        const today = new Date().toISOString().split('T')[0];

        const selections = await UserMealSelection.findAll({
            where: {
                user_id: userId,
                date: today
            },
            order: [['date', 'ASC']]
        });

        res.status(200).json({ meals: selections });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
};
