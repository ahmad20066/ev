const Subscription = require("../models/subscription");
const User = require("../models/user")

module.exports = async (req, res, next) => {
    const userId = req.userId
    const user = await User.findByPk(userId);
    const subscription = await Subscription.findOne({
        where: {
            user_id: userId,
            is_active: true
        }
    })
    if (!subscription) {
        return res.status(403).json({
            message: "You have no active subscription"
        })
    }
    next()
}