const Banner = require("../../models/banner");
const MealPlan = require("../../models/meals/meal_plan");
const Package = require("../../models/package");

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