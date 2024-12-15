const cron = require("node-cron");
const Subscription = require("../models/subscription");
const MealSubscription = require("../models/meals/meal_subscription");
const UserMealSelection = require("../models/meals/user_meal_selection");
const Order = require("../models/meals/order");
const moment = require("moment");
const OrderMeal = require("../models/meals/order_meal");
const { Sequelize } = require("sequelize");
async function generateOrdersForDate(date) {
    const subscriptions = await MealSubscription.findAll({
        where: { is_active: true },
        include: [
            {
                model: UserMealSelection,
                where: { date },
                required: true,
            },
        ],
    });

    const orders = [];

    subscriptions.forEach(async subscription => {
        const order = new Order({
            user_id: subscription.user_id,
            meal_subscription_id: subscription.id,
            order_date: date,
        })
        await order.save()
        subscription.UserMealSelections.forEach(async selection => {
            const today = new Date();
            const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            const dayName = dayNames[today.getDay()];
            if (selection.day == dayName) {
                const orderMeal = new OrderMeal({
                    order_id: order.id,
                    meal_id: selection.meal_id
                })
                await orderMeal.save()
            }
        });
    });

    await Order.bulkCreate(orders);
    console.log(`Orders generated for ${date}`);
}

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
cron.schedule('0 20 * * *', async () => {
    const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
    try {
        await generateOrdersForDate(tomorrow);
        console.log(`Orders generated for ${tomorrow}`);
    } catch (error) {
        console.error('Error generating orders:', error);
    }
});

cron.schedule("0 0 * * *", cancelExpiredSubscriptions);

module.exports = cancelExpiredSubscriptions;
