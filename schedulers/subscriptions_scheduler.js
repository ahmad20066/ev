const cron = require("node-cron");
const Subscription = require("../models/subscription");


const cancelExpiredSubscriptions = async () => {
    try {
        const now = new Date();

        const expiredSubscriptions = await Subscription.findAll({
            where: {
                end_date: { [Sequelize.Op.lt]: now },
                is_active: true,
            },
        });

        for (const subscription of expiredSubscriptions) {
            subscription.is_active = false;
            await subscription.save();
            console.log(`Subscription with ID ${subscription.id} has been cancelled.`);
        }
    } catch (error) {
        console.error("Error canceling expired subscriptions:", error);
    }
};

cron.schedule("0 0 * * *", cancelExpiredSubscriptions);

module.exports = cancelExpiredSubscriptions;
