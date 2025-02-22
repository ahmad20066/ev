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

exports.createOrders = async (req, res, next) => {
    try {
        const ordersToCreate = [];
        const now = new Date();
        for (let i = 0; i < 30; i++) {
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + i);
            const activeSubs = await MealSubscription.findAll({
                where: {
                    is_active: true,
                    start_date: { [Op.lte]: targetDate },
                    end_date: { [Op.gte]: targetDate }
                }
            });
            for (const sub of activeSubs) {
                const existingOrder = await Order.findOne({
                    where: {
                        user_id: sub.user_id,
                        meal_subscription_id: sub.id,
                        order_date: targetDate
                    }
                });
                if (!existingOrder) {
                    ordersToCreate.push({
                        user_id: sub.user_id,
                        meal_subscription_id: sub.id,
                        order_date: targetDate
                    });
                }
            }
        }
        if (ordersToCreate.length > 0) {
            await Order.bulkCreate(ordersToCreate, { returning: true });
        }
        const allOrders = await Order.findAll({
            where: {
                order_date: { [Op.between]: [now, new Date(now.getTime() + 29 * 86400000)] }
            }
        });
        const existingMap = new Map();
        for (const o of allOrders) {
            const k = `${o.user_id}-${o.meal_subscription_id}-${o.order_date.toISOString().split("T")[0]}`;
            existingMap.set(k, o.id);
        }
        const orderMeals = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() + i);
            const subs = await MealSubscription.findAll({
                where: {
                    is_active: true,
                    start_date: { [Op.lte]: date },
                    end_date: { [Op.gte]: date }
                }
            });
            for (const s of subs) {
                const sel = await UserMealSelection.findAll({
                    where: {
                        meal_subscription_id: s.id,
                        date: date.toISOString().split("T")[0]
                    }
                });
                const orderKey = `${s.user_id}-${s.id}-${date.toISOString().split("T")[0]}`;
                const oid = existingMap.get(orderKey);
                if (oid) {
                    for (const choice of sel) {
                        orderMeals.push({
                            order_id: oid,
                            meal_id: choice.meal_id,
                            quantity: 1
                        });
                    }
                }
            }
        }
        if (orderMeals.length > 0) {
            await OrderMeal.bulkCreate(orderMeals, { updateOnDuplicate: ["quantity"] });
        }
        res.status(200).json({ message: "Orders created/updated" });
    } catch (e) {
        if (!e.statusCode) e.statusCode = 500;
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
            where: { order_date: targetDate },
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

exports.finalizeOrder = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { orderId } = req.params;
        const order = await Order.findByPk(orderId, { transaction: t });
        if (!order) {
            await t.rollback();
            return res.status(404).json({ error: "Order not found" });
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
        if (insufficientIngredients.length > 0) {
            await t.rollback();
            return res.status(400).json({
                message: "Insufficient stock for one or more ingredients",
                insufficientIngredients
            });
        }
        for (const [ingredientId, requiredQty] of totalRequiredIngredients.entries()) {
            const ingredient = await Ingredient.findByPk(ingredientId, { transaction: t });
            ingredient.stock = Number(ingredient.stock) - requiredQty;
            await ingredient.save({ transaction: t });
        }
        order.status = "done";
        await order.save({ transaction: t });
        await t.commit();
        return res.status(200).json({ message: "Order finalized successfully" });
    } catch (err) {
        await t.rollback();
        next(err);
    }
};
