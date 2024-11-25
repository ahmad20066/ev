const MealPlan = require('../../models/meals/meal_plan');
const MealPlanType = require('../../models/meals/meal_plan_type');
const Type = require('../../models/meals/type');

exports.createMealPlan = async (req, res, next) => {
    try {
        const { title, calories, price_weekly, price_monthly, types } = req.body;
        const image = req.file.path;

        const newMealPlan = await MealPlan.create({
            title,
            calories,
            image,
            price_monthly,
            price_weekly
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
    try {
        const { id } = req.params;
        const { title, calories, image, price_per_day } = req.body;

        const mealPlan = await MealPlan.findByPk(id);

        if (!mealPlan) {
            const err = new Error('Meal Plan not found');
            err.statusCode = 404;
            next(err);
            return;
        }

        await mealPlan.update({ title, calories, image, price_per_day });
        res.status(200).json(mealPlan);
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



