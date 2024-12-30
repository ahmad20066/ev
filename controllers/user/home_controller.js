const Banner = require("../../models/banner");
const Workout = require("../../models/fitness/workout");
const MealPlan = require("../../models/meals/meal_plan");
const Package = require("../../models/package");
const Subscription = require("../../models/subscription");

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
            const workouts = await Workout.findAll({
                where: {
                    package_id: subscription.package_id
                },

            })
            res.status(200).json(workouts)
        } else {
            const workouts = await Workout.findAll({
                where: {
                    package_id: subscription.package_id,
                    user_id: req.userId
                }
            })
            res.status(200).json(workouts)
        }
    } catch (e) {
        next(e)
    }
}