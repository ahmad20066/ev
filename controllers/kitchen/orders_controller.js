const Address = require("../../models/meals/address");
const Meal = require("../../models/meals/meal");
const MealSubscription = require("../../models/meals/meal_subscription");
const Order = require("../../models/meals/order");
const OrderMeal = require("../../models/meals/order_meal");
const UserMealSelection = require("../../models/meals/user_meal_selection");
const User = require("../../models/user");

exports.createOrders = async (req, res, next) => {
    try {
        const date = new Date();

        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayName = dayNames[date.getDay()];

        // Fetch subscriptions with related meal selections for today
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

        console.log(subscriptions);

        // Prepare an array to store created orders
        const orders = [];

        for (const subscription of subscriptions) {
            const order = await Order.create({
                user_id: subscription.user_id,
                meal_subscription_id: subscription.id,
                order_date: date,
            });

            orders.push(order);

            for (const selection of subscription.selections) {
                await OrderMeal.create({
                    order_id: order.id,
                    meal_id: selection.meal_id,
                });
            }
        }

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
        const today = new Date();
        const orders = await Order.findAll({
            where: {
                order_date: today
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
        })
        console.log(orders)
        res.status(200).json(orders)
    } catch (e) {
        next(e)
    }
}
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
