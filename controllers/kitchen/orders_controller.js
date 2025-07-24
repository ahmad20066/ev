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
const axios = require('axios');

const { Op } = require("sequelize");

// LoginExt API Configuration
const LOGINEXT_API_BASE = process.env.LOGINEXT_API_BASE || 'https://api.loginextsolutions.com';
const LOGINEXT_API_KEY = process.env.LOGINEXT_API_KEY;

// Helper function to generate order number
function generateOrderNumber(userId, orderId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${userId}_ORD-${orderId}-${random}`;
}

// Helper function to create LoginExt delivery order
async function createLoginExtDeliveryOrder(order, user, address, meals) {
    try {
        // Calculate package value from meals
        const packageValue = meals.reduce((sum, meal) => sum + (meal.price || 50) * meal.quantity, 0);

        // Create crate mappings from meals
        const shipmentCrateMappings = meals.map((meal, index) => ({
            crateCd: (index + 1).toString(),
            crateName: meal.name || `Meal ${index + 1}`,
            crateAmount: (meal.price || 50) * meal.quantity,
            crateType: meal.name || `Meal ${index + 1}`,
            noOfUnits: meal.quantity
        }));

        // Generate order number
        const orderNo = generateOrderNumber(user.id, order.id);

        const loginextPayload = {
            orderNo,
            shipmentOrderTypeCd: 'DELIVER',
            orderState: 'FORWARD',
            shipmentOrderDt: new Date().toISOString(),
            deliverStartTimeWindow: new Date().toISOString(),
            deliverEndTimeWindow: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            distributionCenter: 'Evolve The App - Cloud Kitchen',
            packageValue,
            paymentType: 'COD',
            partialDeliveryAllowedFl: 'Y',
            deliverBranch: 'Evolve The App - Cloud Kitchen',
            deliverAccountCode: `${user.name}-#${orderNo}`,
            deliverAccountName: `${user.name}-#${orderNo}`,
            deliverState: address.state || '',
            deliverCountry: address.country || 'IND',
            deliverCity: address.city || '',
            deliverPinCode: address.postal_code || '',
            deliverStreetName: address.street || '',
            deliverApartment: address.apartment || '',
            returnBranch: 'Evolve The App - Cloud Kitchen',
            cancellationALowwed: '',
            shipmentCrateMappings,
            deliverPhoneNumber: user.phone || ''
        };

        const response = await axios.post(
            `${LOGINEXT_API_BASE}/ShipmentApp/mile/v2/create`,
            loginextPayload,
            {
                headers: {
                    'Authorization': `Bearer ${LOGINEXT_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('LoginExt delivery order created successfully:', response.data);
        return response.data;

    } catch (error) {
        console.error('Failed to create LoginExt delivery order:', error.response?.data || error.message);
        throw error;
    }
}

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
            console.log("1")
            for (let dateObj of datesInRange) {
                console.log("2")
                dateObj = dateObj.toISOString().slice(0, 10)

                console.log(dateObj)
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
                console.log(order)


                const userSelections = await UserMealSelection.findAll({
                    where: {
                        meal_subscription_id: sub.id,
                        date: dateObj,
                    },
                    attributes: ["meal_id", "date"],
                });
                // console.log(userSelections)
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

        orders.forEach(order => {
            order.meals.forEach(meal => {
                meal.dataValues.quantity = meal.OrderMeal.quantity;
                delete meal.dataValues.OrderMeal;
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
                            attributes: ["id", "title", "stock", "unit"], // Exclude unnecessary fields
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

        order.meals.forEach(meal => {
            meal.dataValues.quantity = meal.OrderMeal.quantity;
            delete meal.dataValues.OrderMeal;

            meal.ingredients.forEach(ingredient => {
                ingredient.dataValues.quantity = ingredient.MealIngredient.quantity;
                delete ingredient.dataValues.MealIngredient;
            });
        });

        // Stock sufficiency check
        let isStockSufficient = true;
        let insufficientIngredients = [];

        for (const meal of order.meals) {
            for (const ingredient of meal.ingredients) {
                if (ingredient.dataValues.stock < ingredient.dataValues.quantity * meal.dataValues.quantity) {
                    isStockSufficient = false;
                    insufficientIngredients.push({
                        ingredientId: ingredient.id,
                        ingredientName: ingredient.title,
                        required: ingredient.dataValues.quantity * meal.dataValues.quantity,
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
        const order = await Order.findByPk(order_id, {
            include: [
                {
                    model: User,
                    as: "user"
                },
                {
                    model: MealSubscription,
                    as: "subscription",
                    include: {
                        model: Address,
                        as: "address"
                    }
                },
                {
                    model: Meal,
                    as: "meals",
                    through: {
                        attributes: ['quantity']
                    }
                }
            ],
            transaction: t
        });

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

            await t.commit();

            try {
                const mealsData = order.meals.map(meal => ({
                    ...meal.toJSON(),
                    quantity: meal.OrderMeal.quantity
                }));

                await createLoginExtDeliveryOrder(order, order.user, order.subscription.address, mealsData);
                console.log(`LoginExt delivery order created for order ${order_id}`);
            } catch (loginextError) {
                console.error('LoginExt delivery order creation failed:', loginextError.message);
            }

            res.status(201).json({ message: "Order status changed and delivery order created" });
        } else {
            await t.commit();
            res.status(201).json({ message: "Order status changed" });
        }

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
exports.makeOrdersDone = async (req, res, next) => {
    try {
        const { date } = req.body;

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Body must contain a valid ISO date (YYYY-MM-DD).' });
        }

        const [affectedRows] = await Order.update(
            { status: 'done' },
            {
                where: { order_date: date, status: { [Op.ne]: 'done' } }
            }
        );

        return res.json({ message: 'Orders updated.', });
    } catch (err) {
        next(err);
    }
}
exports.getMealsSummaryForDay = async (req, res, next) => {
    try {
        const { date } = req.query;
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
            return res.status(400).json({ message: 'Query param ?date=YYYY-MM-DD is required.' });

        const meals = await OrderMeal.findAll({
            attributes: [
                [sequelize.col('meal.id'), 'id'],
                [sequelize.col('meal.name'), 'name'],
                [sequelize.fn('SUM', sequelize.col('OrderMeal.quantity')), 'quantity']
            ],
            include: [
                {
                    model: Order,
                    as: 'order',
                    attributes: [],
                    where: { order_date: date }
                },
                {
                    model: Meal.unscoped(),
                    as: 'meal',
                    attributes: []
                }
            ],
            group: ['meal.id', 'meal.name'],
            order: [[sequelize.literal('quantity'), 'DESC']],
            raw: true
        });

        res.json(meals);
    } catch (err) {
        next(err);
    }
};
