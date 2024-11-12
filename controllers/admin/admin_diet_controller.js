const MealPlan = require('../../models/meals/meal_plan');

exports.createMealPlan = async (req, res, next) => {
    try {
        const { title, calories, price_weekly, price_monthly } = req.body;
        const image = req.file.path;
        const newMealPlan = await MealPlan.create({ title, calories, image, price_monthly, price_weekly });
        res.status(201).json(newMealPlan);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};

exports.getAllMealPlans = async (req, res, next) => {
    try {
        const mealPlans = await MealPlan.findAll();
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

// Update a Meal Plan by ID
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

// Delete a Meal Plan by ID
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


