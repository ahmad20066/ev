const Address = require("../../models/meals/address");
const Meal = require("../../models/meals/meal");
const MealSubscription = require("../../models/meals/meal_subscription");
const Order = require("../../models/meals/order");
const OrderMeal = require("../../models/meals/order_meal");
const UserMealSelection = require("../../models/meals/user_meal_selection");
const User = require("../../models/user");

exports.createOrders = async (req, res, next) => {
    try {
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

        const getNextDateForDay = (dayIndex) => {
            const today = new Date();
            const currentDay = today.getDay();
            const diff = (dayIndex + 7 - currentDay) % 7;
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + diff);
            return nextDate;
        };

        const orders = [];

        for (const dayName of dayNames) {
            const subscriptions = await MealSubscription.findAll({
                where: { is_active: true },
                include: [
                    {
                        model: UserMealSelection,
                        as: "selections",
                        where: { day: dayName },
                        required: false,
                    },
                ],
            });

            console.log(`Processing orders for ${dayName}`);

            for (const subscription of subscriptions) {
                const orderDate = getNextDateForDay(dayNames.indexOf(dayName));

                // Destructure the result to get the order object
                const [order, created] = await Order.findOrCreate({
                    where: {
                        user_id: subscription.user_id,
                        meal_subscription_id: subscription.id,
                        order_date: orderDate
                    },
                });

                orders.push(order);

                for (const selection of subscription.selections) {
                    // Check if an OrderMeal already exists for the same order and meal
                    const [orderMeal, created] = await OrderMeal.findOrCreate({
                        where: {
                            order_id: order.id, // Now order.id will be correctly defined
                            meal_id: selection.meal_id,
                        },
                        defaults: { quantity: 1 }, // Create a new record with quantity = 1 if not found
                    });

                    if (!created) {
                        // If the row already exists, increment the quantity
                        orderMeal.quantity += 1;
                        await orderMeal.save();
                    }
                }
            }
        }

        // Respond with the created orders
        res.status(200).json({
            message: "Success",
            orders,
        });
    } catch (e) {
        next(e);
    }
};



exports.getOrders = async (req, res, next) => {
    try {
        // Get the day parameter from the request query
        const { day } = req.query;

        if (!day) {
            return res.status(400).json({ message: "Please provide a valid day." });
        }

        // Convert the day string to a Date object
        const targetDate = new Date(day);

        if (isNaN(targetDate)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
        }

        // Query orders by the specified date
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
