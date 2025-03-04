const sequelize = require("../../models/index");
const Address = require("../../models/meals/address");
const Ingredient = require("../../models/meals/ingredient");
const Meal = require("../../models/meals/meal");
const MealIngredient = require("../../models/meals/meal_ingredient");
const MealSubscription = require("../../models/meals/meal_subscription");
const Order = require("../../models/meals/order");
const OrderMeal = require("../../models/meals/order_meal");
const UserMealSelection = require("../../models/meals/user_meal_selection");
const User = require("../../models/user");

const { Op } = require("sequelize");
function getDatesBetween(start, end) {
    const dateArr = [];
    let current = new Date(start);
    while (current <= end) {
        dateArr.push(new Date(current)); // push a copy
        current.setDate(current.getDate() + 1);
    }
    return dateArr;
}
exports.createOrders = async (req, res, next) => {
    try {
        const now = new Date();

        // 1) Fetch all active meal subscriptions
        const activeSubs = await MealSubscription.findAll({
            where: { is_active: true },
            attributes: ["id", "user_id", "start_date", "end_date"],
        });

        for (const sub of activeSubs) {
            const subStart = new Date(sub.start_date);
            const subEnd = new Date(sub.end_date);

            if (subEnd < now) {
                continue;
            }

            const datesInRange = getDatesBetween(subStart, subEnd);

            for (const dateObj of datesInRange) {

                const [order] = await Order.findOrCreate({
                    where: {
                        user_id: sub.user_id,
                        meal_subscription_id: sub.id,
                        order_date: dateObj,
                    },
                    defaults: {
                        user_id: sub.user_id,
                        meal_subscription_id: sub.id,
                        order_date: dateObj,
                    },
                });


                const userSelections = await UserMealSelection.findAll({
                    where: {
                        meal_subscription_id: sub.id,
                        date: dateObj,
                    },
                    attributes: ["meal_id", "date"],
                });

                if (userSelections.length > 0) {
                    const orderMeals = userSelections.map((selection) => ({
                        order_id: order.id,
                        meal_id: selection.meal_id,
                        quantity: 1,
                    }));

                    await OrderMeal.bulkCreate(orderMeals, {
                        updateOnDuplicate: ["quantity"],
                    });
                }
            }
        }

        res.status(200).json({
            message: "Orders created/updated for all active subscriptions successfully",
        });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
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
            where: { order_date: targetDate },
            include: [
                {
                    model: User,
                    as: "user",
                    required: false
                },
                {
                    model: Meal,
                    as: "meals",
                    through: { attributes: [] },
                    required: false
                },
                {
                    model: MealSubscription,
                    as: "subscription",
                    include: {
                        model: Address,
                        as: "address"
                    },
                    required: false
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
        const orderId = req.params.id;
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
                    through: { attributes: [] }
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
    const t = await sequelize.transaction();
    try {
        const order_id = req.query.order_id;
        const { status } = req.body;
        const order = await Order.findByPk(order_id, { transaction: t });
        if (!order) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
        }
        const oldStatus = order.status;
        order.status = status;
        await order.save({ transaction: t });
        if (status === "done" && oldStatus !== "done") {
            const orderMeals = await OrderMeal.findAll({
                where: { order_id },
                transaction: t
            });
            for (const om of orderMeals) {
                const mealIngredients = await MealIngredient.findAll({
                    where: { meal_id: om.meal_id },
                    transaction: t
                });
                for (const mi of mealIngredients) {
                    const totalUsage = Number(mi.quantity) * om.quantity;
                    const ingredient = await Ingredient.findByPk(mi.ingredient_id, { transaction: t });
                    if (!ingredient) continue;
                    const newStock = Number(ingredient.stock) - totalUsage;
                    if (newStock < 0) {
                        const error = new Error("Insufficient stock");
                        error.statusCode = 400;
                        throw error;
                    }
                    ingredient.stock = newStock;
                    await ingredient.save({ transaction: t });
                }
            }
        }
        await t.commit();
        res.status(201).json({ message: "Order status changed" });
    } catch (e) {
        await t.rollback();
        next(e);
    }
};

exports.checkStock = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const orderId = req.query.order_id;
        if (!orderId) {
            return res.status(400).json({ message: "Please provide order ID" });
        }

        const order = await Order.findByPk(orderId, { transaction: t });
        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: "Order not found" });
        }

        const orderMeals = await OrderMeal.findAll({
            where: { order_id: orderId },
            transaction: t
        });

        let totalRequiredIngredients = new Map();

        for (const om of orderMeals) {
            const mealIngredients = await MealIngredient.findAll({
                where: { meal_id: om.meal_id },
                transaction: t
            });

            for (const mi of mealIngredients) {
                const totalUsage = Number(mi.quantity) * om.quantity;
                const ingId = mi.ingredient_id;

                if (!totalRequiredIngredients.has(ingId)) {
                    totalRequiredIngredients.set(ingId, 0);
                }
                totalRequiredIngredients.set(
                    ingId,
                    totalRequiredIngredients.get(ingId) + totalUsage
                );
            }
        }

        const insufficientIngredients = [];

        for (const [ingredientId, requiredQty] of totalRequiredIngredients.entries()) {
            const ingredient = await Ingredient.findByPk(ingredientId, { transaction: t });
            if (!ingredient) continue;
            if (Number(ingredient.stock) < requiredQty) {
                insufficientIngredients.push({
                    ingredientId,
                    ingredientName: ingredient.title,
                    required: requiredQty,
                    available: ingredient.stock
                });
            }
        }

        await t.commit();
        if (insufficientIngredients.length > 0) {
            return res.status(400).json({
                message: "Insufficient stock for one or more ingredients",
                insufficientIngredients
            });
        } else {
            return res.status(200).json({
                message: insufficientIngredients.length > 0 ? "Insufficient stock for one or more ingredients" : "Stock is sufficient",
                insufficientIngredients
            });
        }

    } catch (err) {
        await t.rollback();
        next(err);
    }
};

exports.addStock = async (req, res, next) => {
    try {
        const { stock, ingredient_id } = req.body
        const ingredient = await Ingredient.findByPk(ingredient_id)
        if (!ingredient) {
            const error = new Error("Ingredient not found")
            error.statusCode = 404
            throw error
        }
        ingredient.stock += stock
        await ingredient.save()
        res.status(201).json({
            Message: "Stock updated successfully"
        })
    } catch (e) {
        next(e)
    }
}
exports.getDatesForMonth = async (req, res, next) => {
    try {
        const today = new Date();
        const dates = [];

        for (let i = 0; i < 30; i++) {
            let futureDate = new Date();
            futureDate.setDate(today.getDate() + i);
            const formattedDate = futureDate.toISOString().split('T')[0];
            const dayOfWeek = futureDate.toLocaleString('en-US', { weekday: 'long' });
            dates.push({ date: formattedDate, day: dayOfWeek });
        }

        res.status(200).json({ dates });
    } catch (error) {
        next(error);
    }
};