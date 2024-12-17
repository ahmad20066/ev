const { Sequelize } = require('sequelize');
const MealPlan = require('../../models/meals/meal_plan');
const MealPlanType = require('../../models/meals/meal_plan_type');
const MealSubscription = require('../../models/meals/meal_subscription');
const Type = require('../../models/meals/type');

exports.createMealPlan = async (req, res, next) => {
    try {
        const { title, calories, price_monthly, types } = req.body;
        const image = req.file.path;

        const newMealPlan = await MealPlan.create({
            title,
            calories,
            image,
            price_monthly,
        });
        console.log(types)
        if (types && Array.isArray(types) && types.length > 0) {
            for (const typeId of types) {
                console.log(typeId)
                await MealPlanType.create({
                    meal_plan_id: newMealPlan.id,
                    type_id: typeId
                });
            }
        }

        const mealPlanWithTypes = await MealPlan.findByPk(newMealPlan.id, {
            include: {
                model: Type,
                as: "types",
                through: { attributes: [] }
            }
        });

        res.status(201).json(mealPlanWithTypes);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.getAllMealPlans = async (req, res, next) => {
    try {

        const mealPlans = await MealPlan.findAll({
            attributes: {
                include: [
                    [
                        Sequelize.fn("COUNT", Sequelize.col("subscriptions.id")), 'subscriptions_count'
                    ]
                ]
            },
            include: [
                {
                    model: MealSubscription,
                    as: "subscriptions",
                    attributes: [],
                    where: {
                        is_active: true
                    },
                    required: false
                },
                {
                    model: Type,
                    as: "types",
                    through: { attributes: [] }
                }
            ],
            group: ['MealPlan.id'],
        });

        res.status(200).json(mealPlans);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.getMealPlanById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const mealPlan = await MealPlan.findByPk(id);

        if (!mealPlan) {
            const err = new Error('Meal Plan not found');
            err.statusCode = 404;
            next(err);
            return;
        }

        res.status(200).json(mealPlan);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.updateMealPlan = async (req, res, next) => {
    const { id } = req.params;
    const { title, calories, price_monthly, types } = req.body;
    const image = req.file ? req.file.path : null;

    try {
        const mealPlan = await MealPlan.findByPk(id);

        if (!mealPlan) {
            return res.status(404).json({
                message: "Meal plan not found"
            });
        }

        mealPlan.title = title || mealPlan.title;
        mealPlan.calories = calories || mealPlan.calories;
        mealPlan.price_monthly = price_monthly || mealPlan.price_monthly;
        if (image) {
            mealPlan.image = image;
        }

        await mealPlan.save();

        if (types && Array.isArray(types) && types.length > 0) {
            await MealPlanType.destroy({
                where: { meal_plan_id: id }
            });

            for (const typeId of types) {
                await MealPlanType.create({
                    meal_plan_id: id,
                    type_id: typeId
                });
            }
        }

        const updatedMealPlan = await MealPlan.findByPk(id, {
            include: {
                model: Type,
                as: "types",
                through: { attributes: [] }
            }
        });

        res.status(200).json(updatedMealPlan);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};

exports.deleteMealPlan = async (req, res, next) => {
    try {
        const { id } = req.params;

        const mealPlan = await MealPlan.findByPk(id);

        if (!mealPlan) {
            const err = new Error('Meal Plan not found');
            err.statusCode = 404;
            next(err);
            return;
        }

        await mealPlan.destroy();
        res.status(204).send();
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.getMealPlanSubscriptions = async (req, res, next) => {
    try {
        const meal_plan_id = req.params.id;
        const is_active = req.query.is_active;
        if (!is_active) {
            is_active = false
        }
        const mealPlan = await MealPlan.findByPk(meal_plan_id)
        if (!mealPlan) {
            const error = new Error("Meal plan not found")
            error.statusCode = 404
            throw error;
        }
        const count = await MealSubscription.count({
            where: {
                meal_plan_id,
                is_active
            }
        })
        res.status(200).json({
            subscriptions_count: count
        })
    } catch (e) {
        next(e)
    }
}