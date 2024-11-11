const MealPlan = require("../../models/meals/meal_plan")
const MealSubscription = require("../../models/meals/meal_subscription")
const Package = require("../../models/package")
const PricingModel = require("../../models/pricing_model")
const Subscription = require("../../models/subscription")
const User = require("../../models/user")

exports.getSubscriptions = async (req, res, next) => {
    try {
        let { package_id, active } = req.query
        if (!active) {
            active = true
        } else {
            active === "true" ? active = true : active = false
        }

        let where;
        if (!package_id) {
            where = {
                is_active: active
            }
        } else {
            where = {
                package_id,
                is_active: active
            }
        }
        const subscriptions = await Subscription.findAll({
            where: where,
            include: [{

                model: User,
                as: "user"
            },
            { model: Package, as: "package" },
            { model: PricingModel, as: "pricing" }
            ],
            attributes: {
                exclude: ["user_id", "pricing_id"]
            }
        })
        res.status(200).json(subscriptions)
    } catch (e) {
        next(e)
    }
}
exports.getMealSubscriptions = async (req, res, next) => {
    try {
        let { active, type } = req.query
        if (!active) {
            active = true
        } else {
            active === "true" ? active = true : active = false
        }

        let where;
        if (!type) {
            where = {
                is_active: active
            }
        } else {
            where = {
                type,
                is_active: active
            }
        }
        console.log(where)
        const subscriptions = await MealSubscription.findAll({
            where: where,
            include: [{
                model: User,
                as: "user"
            },
            {
                model: MealPlan,
                as: "meal_plan"
            }
            ]
        })
        res.status(200).json(subscriptions)
    } catch (e) {
        next(e)
    }
}