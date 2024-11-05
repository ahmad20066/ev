const Subscription = require("../../models/subscription")

exports.getSubscriptions = async (req, res, next) => {
    try {
        const { package_id, active } = req.body
        if (!active) {
            active = true
        }
        const subscriptions = await Subscription.findAll({
            where: {
                package_id,
                is_active: active
            }
        })
        res.status(200).json(subscriptions)
    } catch (e) {
        next(e)
    }
}