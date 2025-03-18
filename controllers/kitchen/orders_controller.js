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
                    through: {
                        attributes: ['quantity']
                    },
                    required: false,
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

        // Modify the response to add quantity directly in meals
        orders.forEach(order => {
            order.meals.forEach(meal => {
                meal.dataValues.quantity = meal.OrderMeal.quantity; // Assuming your join table is `OrderMeal`
                delete meal.dataValues.OrderMeal; // Remove the join table object
            });
        });

        res.status(200).json(orders);
    } catch (e) {
        next(e);
    }
};


exports.getOrderById = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const orderId = req.params.id;

        // Fetch the order with meals, user, and subscription details
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
                        attributes: ['quantity'] // Get meal quantity
                    },
                    include: [
                        {
                            model: Ingredient,
                            as: "ingredients",
                            attributes: ["id", "title", "stock"], // Exclude unnecessary fields
                            through: {
                                attributes: ["quantity"] // Include ingredient quantity from MealIngredient
                            }
                        }
                    ]
                },
                {
                    model: MealSubscription,
                    as: "subscription",
                    include: {
                        model: Address,
                        as: "address"
                    }
                }
            ],
            transaction: t
        });

        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: "Order not found" });
        }

        // Extract meal quantities from OrderMeal join table
        order.meals.forEach(meal => {
            meal.dataValues.quantity = meal.OrderMeal.quantity;
            delete meal.dataValues.OrderMeal; // Clean up response

            // Attach quantity to each ingredient
            meal.ingredients.forEach(ingredient => {
                ingredient.dataValues.quantity = ingredient.MealIngredient.quantity; // Move quantity inside ingredient object
                delete ingredient.dataValues.MealIngredient; // Remove join table reference
            });
        });

        // Stock sufficiency check
        let isStockSufficient = true;
        let insufficientIngredients = [];

        for (const meal of order.meals) {
            for (const ingredient of meal.ingredients) {
                if (ingredient.stock < ingredient.quantity * meal.quantity) {
                    isStockSufficient = false;
                    insufficientIngredients.push({
                        ingredientId: ingredient.id,
                        ingredientName: ingredient.title,
                        required: ingredient.quantity * meal.quantity,
                        available: ingredient.stock
                    });
                }
            }
        }

        await t.commit();
        res.status(200).json({
            ...order.toJSON(),
            isStockSufficient,
            insufficientIngredients
        });

    } catch (e) {
        await t.rollback();
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
        console.log(ingredient.stock)
        ingredient.stock += stock
        console.log(ingredient.stock)
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