const Address = require("../../models/meals/address");
const Meal = require("../../models/meals/meal");
const MealSubscription = require("../../models/meals/meal_subscription");
const Order = require("../../models/meals/order");
const OrderMeal = require("../../models/meals/order_meal");
const UserMealSelection = require("../../models/meals/user_meal_selection");
const User = require("../../models/user");

const { Op } = require("sequelize"); // Ensure Sequelize operators are available

exports.createOrders = async (req, res, next) => {
    try {
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

        const getNextDateForDay = (dayOffset) => {
            const today = new Date();
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + dayOffset);
            return targetDate;
        };

        const orders = [];
        const orderData = [];
        const orderMealData = [];

        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
            const orderDate = getNextDateForDay(dayOffset);
            const dayName = dayNames[orderDate.getDay()];

            const subscriptions = await MealSubscription.findAll({
                where: {
                    is_active: true,
                    start_date: { [Op.lte]: new Date() } // Include all active subscriptions
                },
                include: [
                    {
                        model: UserMealSelection,
                        as: "selections",
                        where: { day: dayName },
                        required: false,
                    },
                ],
            });

            console.log(`Processing orders for ${orderDate.toISOString().split('T')[0]} (${dayName})`);

            const existingOrders = await Order.findAll({
                where: {
                    order_date: orderDate,
                    user_id: subscriptions.map(s => s.user_id),
                },
                attributes: ['id', 'user_id', 'meal_subscription_id', 'order_date'],
            });
            const existingOrdersMap = new Map(existingOrders.map(o => [`${o.user_id}-${o.meal_subscription_id}-${o.order_date}`, o.id]));

            for (const subscription of subscriptions) {
                const orderStartDate = new Date(subscription.start_date);
                const twoDaysAfterSubscription = new Date(orderStartDate);
                twoDaysAfterSubscription.setDate(orderStartDate.getDate() + 2); // Order starts two days after subscription date

                if (orderDate < twoDaysAfterSubscription) {
                    // Skip order creation if the order date is before two days after the subscription
                    continue;
                }

                const orderKey = `${subscription.user_id}-${subscription.id}-${orderDate}`;
                let orderId = existingOrdersMap.get(orderKey);

                if (!orderId) {
                    const order = {
                        user_id: subscription.user_id,
                        meal_subscription_id: subscription.id,
                        order_date: orderDate,
                    };
                    orderData.push(order);
                }
            }
        }

        if (orderData.length > 0) {
            const createdOrders = await Order.bulkCreate(orderData, { returning: true });
            createdOrders.forEach(order => {
                const orderKey = `${order.user_id}-${order.meal_subscription_id}-${order.order_date}`;
                existingOrdersMap.set(orderKey, order.id);
            });
        }

        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
            const orderDate = getNextDateForDay(dayOffset);
            const dayName = dayNames[orderDate.getDay()];

            const subscriptions = await MealSubscription.findAll({
                where: {
                    is_active: true,
                    start_date: { [Op.lte]: new Date() } // Include all active subscriptions
                },
                include: [
                    {
                        model: UserMealSelection,
                        as: "selections",
                        where: { day: dayName },
                        required: false,
                    },
                ],
            });

            for (const subscription of subscriptions) {
                const orderStartDate = new Date(subscription.start_date);
                const twoDaysAfterSubscription = new Date(orderStartDate);
                twoDaysAfterSubscription.setDate(orderStartDate.getDate() + 2);

                if (orderDate < twoDaysAfterSubscription) {
                    // Skip meal assignments if order date is before two days after subscription
                    continue;
                }

                const orderKey = `${subscription.user_id}-${subscription.id}-${orderDate}`;
                const orderId = existingOrdersMap.get(orderKey);

                if (!orderId) continue;

                for (const selection of subscription.selections) {
                    orderMealData.push({
                        order_id: orderId,
                        meal_id: selection.meal_id,
                        quantity: 1,
                    });
                }
            }
        }

        if (orderMealData.length > 0) {
            await OrderMeal.bulkCreate(orderMealData, {
                updateOnDuplicate: ['quantity'],
            });
        }

        res.status(200).json({
            message: "Success",
            orders: orderData,
        });
    } catch (e) {
        next(e);
    }
};

exports.getOrders = async (req, res, next) => {
    try {
        const { day } = req.query;

        if (!day) {
            return res.status(400).json({ message: "Please provide a valid day." });
        }


        const targetDate = new Date(day);

        if (isNaN(targetDate)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
        }

        const orders = await Order.findAll({
            where: {
                order_date: targetDate
            },
            include: [
                {
                    model: User,
                    as: "user"
                },
                {
                    model: Meal,
                    as: "meals",
                    through: {
                        attributes: []
                    }
                },
                {
                    model: MealSubscription,
                    as: "subscription",
                    include: {
                        model: Address,
                        as: "address"
                    }
                }
            ]
        });

        res.status(200).json(orders);
    } catch (e) {
        next(e);
    }
};

exports.getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id; // Get order ID from request parameters

        const order = await Order.findOne({
            where: { id: orderId },

            include: [
                {
                    model: User,
                    as: "user"
                },
                {
                    model: Meal,
                    as: "meals",
                    through: {
                        attributes: []
                    }
                },
                {
                    model: MealSubscription,
                    as: "subscription",
                    include: {
                        model: Address,
                        as: "address"
                    }
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(order);
    } catch (e) {
        next(e);
    }
};

exports.changeOrderStatus = async (req, res, next) => {
    try {
        const order_id = req.query.order_id
        const { status } = req.body;
        const order = await Order.findByPk(order_id)
        if (!order) {
            const error = new Error("Order not found")
            error.statusCode = 404;
            throw error;
        }
        order.status = status
        await order.save()
        res.status(201).json({
            message: "Order status changed"
        })
    } catch (e) {
        next(e)
    }
}
