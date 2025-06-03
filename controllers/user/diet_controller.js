const { Op } = require("sequelize");
const Meal = require("../../models/meals/meal");
const MealDay = require("../../models/meals/meal_day");
const MealPlan = require("../../models/meals/meal_plan");

const MealSubscription = require("../../models/meals/meal_subscription");
const Type = require("../../models/meals/type");
const UserMealSelection = require("../../models/meals/user_meal_selection");
const Subscription = require("../../models/subscription");
const DeliveryTime = require("../../models/meals/delivery_time");
const Address = require("../../models/meals/address");
const Ingredient = require("../../models/meals/ingredient");
const MealRenewal = require("../../models/meals/meal_renewal");
const OrderMeal = require("../../models/meals/order_meal");
const Order = require("../../models/meals/order");
const sequelize = require("../../models");
const Coupon = require("../../models/fitness/coupon");
const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

exports.getMealPlans = async (req, res, next) => {
    try {
        const mealPlans = await MealPlan.findAll({
            include: {
                model: Type,
                as: "types",
                through: { attributes: [] }
            }
        });
        res.status(200).json(mealPlans);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};

exports.subscribeToMealPlan = async (req, res, next) => {
    try {
        const {
            meal_plan_id,
            delivery_time_id,
            address_label,
            street,
            city,
            building,
            state,
            postal_code,
            delivery_notes
        } = req.body;

        const oldSub = await MealSubscription.findOne({
            where: { user_id: req.userId, is_active: true }
        });
        if (oldSub) {
            const e = new Error("You are already subscribed");
            e.statusCode = 400;
            throw e;
        }


        const mealPlan = await MealPlan.findByPk(meal_plan_id, {
            include: [{ model: Type, as: "types" }]
        });
        if (!mealPlan) {
            const e = new Error("Meal Plan not found");
            e.statusCode = 404;
            throw e;
        }

        const deliveryTime = await DeliveryTime.findByPk(delivery_time_id);
        if (!deliveryTime) {
            const e = new Error("Delivery time not found");
            e.statusCode = 404;
            throw e;
        }

        const address = await Address.create({
            address_label,
            city,
            street,
            building,
            state,
            postal_code,
            delivery_notes
        });

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);

        const subscription = await MealSubscription.create({
            user_id: req.userId,
            meal_plan_id,
            start_date: startDate,
            end_date: endDate,
            type: "monthly",
            delivery_time_id,
            address_id: address.id,
            is_active: true
        });

        const planTypeIds = mealPlan.types.map((t) => t.id);

        const selections = [];
        let current = new Date(startDate);

        while (current <= endDate) {
            const currentDateStr = current.toISOString().split("T")[0];
            const dayName = current
                .toLocaleString("en-US", { weekday: "long" })
                .toLowerCase();


            const mealDays = await MealDay.findAll({
                where: { date: currentDateStr },
                include: [
                    {
                        model: Meal,
                        as: "meal",
                        required: true,
                        include: [
                            {
                                model: Type,
                                as: "types",
                                where: { id: { [Op.in]: planTypeIds } },
                                through: { attributes: [] },
                                required: true
                            }
                        ]
                    }
                ]
            });

            for (const mealDay of mealDays) {
                selections.push({
                    user_id: req.userId,
                    meal_subscription_id: subscription.id,
                    meal_id: mealDay.meal_id,
                    date: currentDateStr,
                    day: dayName
                });
            }

            current.setDate(current.getDate() + 1);
        }

        if (selections.length > 0) {
            await UserMealSelection.bulkCreate(selections);
        }

        res.status(201).json({
            message: "Subscription Successful",
            subscription
        });
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

exports.getMealSubscriptions = async (req, res, next) => {
    try {
        const userId = req.userId;
        const subscriptions = await MealSubscription.findAll({
            where: {
                user_id: userId
            },
            attributes: {
                exclude: ["meal_plan_id", "user_id", "createdAt", "updatedAt", "address_id", "delivery_time_id"]
            },
            include: [
                {
                    model: Address,
                    as: "address",
                },
                {
                    model: MealPlan,
                    as: "meal_plan",
                },
                {
                    model: DeliveryTime,
                    as: "delivery_time"
                }
            ],
        })
        const currentDate = new Date();
        const subscriptionsWithDaysLeft = subscriptions.map(subscription => {
            const endDate = new Date(subscription.end_date);
            const remainingDays = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));

            return {
                ...subscription.toJSON(),
                remaining_days: remainingDays > 0 ? remainingDays : 0,
            };
        });
        res.status(200).json(subscriptionsWithDaysLeft)
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e)
    }
}

const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
function getDateOfCurrentWeek(dayName) {
    const targetIndex = daysOfWeek.indexOf(dayName.toLowerCase());
    if (targetIndex === -1) return null;

    const today = new Date();
    const currentDayIndex = today.getDay();


    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - currentDayIndex);

    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + targetIndex);

    return targetDate;
}

exports.getMealsForWeek = async (req, res, next) => {
    try {
        const { date, type } = req.query;
        if (!date) {
            return res.status(400).json({ message: "Please specify a date" });
        }
        // const targetDate = getDateOfCurrentWeek(day);
        // if (!targetDate) {
        //     return res.status(400).json({ message: "Invalid day parameter" });
        // }
        // const formattedDate = date.toISOString().split("T")[0];
        const whereClause = {
            date: date
        };
        const includeOptions = [
            {
                model: Meal,
                as: "meal",
                required: true,
                include: type
                    ? [
                        {
                            model: Type,
                            as: "types",
                            where: { id: type }
                        },
                        {
                            model: Ingredient,
                            as: "ingredients",
                            through: {
                                attributes: ["quantity"]
                            }
                        }
                    ]
                    : []
            }
        ];
        console.log(whereClause)
        const mealDays = await MealDay.findAll({
            where: whereClause,
            include: includeOptions
        });
        const meals = mealDays.map(m => m.meal);
        res.status(200).json({
            date: date,
            day: dayNames[new Date(date).getDay()],
            meals
        });
    } catch (error) {
        next(error);
    }
};
exports.getMealSelections = async (req, res, next) => {
    try {
        const userId = req.userId;
        let { date } = req.query;
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        date = new Date(date)
        let day
        day = dayNames[date.getDay()];
        if (!date) {
            const error = new Error("Please provide a date")
            error.statusCode = 400
            throw error;
        }

        console.log(`UserID: ${userId}, Day: ${day}`);

        const selections = await UserMealSelection.findAll({
            where: {
                user_id: userId,
                day: day,
                date: date
            },
            include: {
                model: Meal,
                as: "meal",
                include: [
                    {
                        model: Ingredient,
                        as: "ingredients",
                        through: {
                            attributes: ["quantity"]
                        }
                    }
                ]
            },
        });

        if (!selections.length) {
            return res.status(404).json({ message: "No meal selections found for the specified day." });
        }

        const meals = selections.map(selection => ({
            selection_id: selection.id,
            type: selection.meal.types?.length > 0 ? selection.meal.types[0].title : null,
            meal: {
                ...selection.meal.toJSON(),
                ingredients: selection.meal.ingredients.map(ingredient => ({
                    id: ingredient.id,
                    name: ingredient.title,
                    unit: ingredient.unit,
                    quantity: ingredient.MealIngredient.quantity
                }))
            }
        }));

        res.status(200).json({
            day: day,
            meals,
        });
    } catch (error) {
        next(error);
    }
};

exports.getMealById = async (req, res, next) => {
    try {
        const { id } = req.params
        const meal = await Meal.findByPk(id, {
            include: [
                { model: Type, as: 'types', through: { attributes: [] } },
                {
                    model: Ingredient, as: 'ingredients', attributes: {
                        exclude: ['stock'],
                    }, through: {
                        attributes: {

                            include: ['quantity']
                        }
                    }
                },
            ]
        })
        console.log(meal.ingredients)
        if (!meal) {
            const error = new Error("Meal not found")
            error.statusCode = 404;
            throw error;
        }
        meal.ingredients.forEach((ingredient) => {
            ingredient.dataValues.quantity = ingredient.MealIngredient.quantity;
            delete ingredient.dataValues.MealIngredient;
        });

        res.status(200).json(meal)
    } catch (e) {
        next(e)
    }
}


exports.changeSelection = async (req, res, next) => {
    const transaction = await sequelize.transaction(); // Start transaction
    try {
        const userId = req.userId;
        const { selection_id, meal_id } = req.body;

        if (!selection_id || !meal_id) {
            const e = new Error("Both selection_id and meal_id are required.");
            e.statusCode = 400;
            throw e;
        }

        const selection = await UserMealSelection.findOne({
            where: { id: selection_id, user_id: userId },
            transaction
        });

        if (!selection) {
            const e = new Error("No selection found for the specified id.");
            e.statusCode = 404;
            throw e;
        }

        const today = new Date();
        const targetDate = new Date(selection.date);
        const diff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

        if (diff < 2) {
            const e = new Error("You can only change your selection at least 2 days in advance.");
            e.statusCode = 403;
            throw e;
        }

        selection.meal_id = meal_id;
        await selection.save({ transaction });

        const subscriptionId = selection.meal_subscription_id;

        const existingOrder = await Order.findOne({
            where: {
                user_id: userId,
                meal_subscription_id: subscriptionId,
                order_date: targetDate
            },
            transaction
        });

        if (existingOrder) {
            let existingOrderMeal = await OrderMeal.findOne({
                where: { order_id: existingOrder.id },
                transaction
            });

            if (existingOrderMeal) {
                console.log("Before update:", existingOrderMeal.meal_id);

                // **Check if the new meal_id already exists for this order**
                const conflictMeal = await OrderMeal.findOne({
                    where: {
                        order_id: existingOrder.id,
                        meal_id: meal_id, // The new meal_id we are trying to set
                    },
                    transaction
                });

                if (conflictMeal) {
                    console.log(`Meal ID ${meal_id} already exists for order ${existingOrder.id}. Deleting conflict...`);
                    await conflictMeal.destroy({ transaction }); // Ensure deletion happens within the transaction
                }

                // **Ensure Sequelize detects the change before saving**
                existingOrderMeal.set({ meal_id });
                await existingOrderMeal.save({ transaction });

                // **Re-fetch to confirm**
                existingOrderMeal = await OrderMeal.findOne({
                    where: { order_id: existingOrder.id },
                    transaction
                });

                console.log("After update:", existingOrderMeal.meal_id);
            } else {
                // If no OrderMeal exists, create a new one
                await OrderMeal.create({
                    order_id: existingOrder.id,
                    meal_id,
                    quantity: 1
                }, { transaction });
            }
        }

        // ✅ Commit transaction only if all operations were successful
        await transaction.commit();

        res.status(200).json({ message: "Meal selection updated successfully." });
    } catch (error) {
        await transaction.rollback(); // Rollback on failure
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

exports.getAllDeliveryTimes = async (req, res, next) => {
    try {
        const deliveryTimes = await DeliveryTime.findAll();

        res.status(200).json(deliveryTimes);
    } catch (error) {
        next(error);
    }
};
exports.renewSubscription = async (req, res, next) => {
    try {
        const { subscription_id } = req.query;
        const subscription = await MealSubscription.findByPk(subscription_id, {
            include: { model: MealPlan, as: "meal_plan", include: [{ model: Type, as: "types" }] }
        });
        if (!subscription) {
            const e = new Error("Subscription not found");
            e.statusCode = 404;
            throw e;
        }
        if (subscription.is_active) {
            const e = new Error("Subscription already active");
            e.statusCode = 400;
            throw e;
        }
        subscription.is_active = true;
        const oldEnd = new Date(subscription.end_date);
        const newEnd = new Date(oldEnd);
        newEnd.setDate(oldEnd.getDate() + 30);
        subscription.end_date = newEnd;
        await subscription.save();
        const selections = [];
        let current = new Date(oldEnd);
        current.setDate(current.getDate() + 1);
        while (current <= newEnd) {
            const dayIndex = current.getDay();
            const dayName = dayNames[dayIndex];
            for (const t of subscription.meal_plan.types) {
                const meal = await Meal.findOne({
                    include: [{ model: Type, as: "types", where: { id: t.id } }]
                });
                if (meal) {
                    selections.push({
                        user_id: subscription.user_id,
                        meal_subscription_id: subscription.id,
                        meal_id: meal.id,
                        date: current.toISOString().split("T")[0],
                        day: dayName
                    });
                }
            }
            current.setDate(current.getDate() + 1);
        }
        if (selections.length > 0) {
            await UserMealSelection.bulkCreate(selections);
        }
        const renewal = new MealRenewal({ subscription_id });
        await renewal.save();
        res.status(201).json({ message: "Subscription renewed", subscription });
    } catch (e) {
        if (!e.statusCode) e.statusCode = 500;
        next(e);
    }
};
exports.getAllTypes = async (req, res, next) => {
    try {
        const types = await Type.findAll();
        res.status(200).json(types);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.applyCouponToMealPlan = async (req, res, next) => {
    try {
        const { meal_plan_id, coupon_code } = req.body;
        if (!meal_plan_id || !coupon_code) {
            return res.status(400).json({ message: 'meal_plan_id and coupon_code are required.' });
        }
        const mealPlan = await MealPlan.findByPk(meal_plan_id);
        if (!mealPlan) {
            return res.status(404).json({ message: 'Meal plan not found.' });
        }
        const price = mealPlan.price_monthly;
        const coupon = await Coupon.findOne({
            where: {
                code: coupon_code,
                is_active: true,
                [Coupon.sequelize.Op.or]: [
                    { meal_plan_id: null },
                    { meal_plan_id: meal_plan_id }
                ]
            }
        });
        if (!coupon) return res.status(404).json({ message: 'Coupon not found or not valid for this meal plan.' });
        if (coupon.expiry_date < new Date()) {
            return res.status(400).json({ message: 'Coupon expired' });
        }
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }
        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = price * (coupon.discount_value / 100);
        } else {
            discount = coupon.discount_value;
        }
        const discountAmount = Math.min(discount, price);
        res.status(200).json({
            message: 'Coupon applied',
            discount: discountAmount,
            new_total: price - discountAmount,
            coupon_id: coupon.id,
            meal_plan_id: mealPlan.id
        });
    } catch (error) {
        next(error);
    }
};


