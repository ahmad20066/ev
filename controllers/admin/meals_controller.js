const Meal = require("../../models/meals/meal");
const MealDay = require("../../models/meals/meal_day");
const MealType = require("../../models/meals/meal_type");
const Type = require("../../models/meals/type");

exports.createMeal = async (req, res, next) => {
    try {
        const { name, description, calories, types } = req.body;
        const image_url = req.file ? req.file.path : null;

        const meal = await Meal.create({
            name,
            description,
            calories,
            image_url,
        });

        if (types && Array.isArray(types) && types.length > 0) {
            for (const typeId of types) {
                await MealType.create({
                    meal_id: meal.id,
                    type_id: typeId,
                });
            }
        }

        const mealWithTypes = await Meal.findByPk(meal.id, {
            include: {
                model: Type,
                as: "types", // Alias used in the association
                through: { attributes: [] }, // Exclude join table fields
            },
        });

        res.status(201).json({
            message: "Meal Created Successfully",
            meal: mealWithTypes,
        });
    } catch (e) {
        next(e);
    }
};

exports.getMeals = async (req, res, next) => {
    try {
        const meals = await Meal.findAll({
            include: {
                model: Type,
                as: "types",
                through: { attributes: [] },
            },
        });
        res.status(200).json(meals);
    } catch (e) {
        next(e);
    }
};

exports.showMeal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meal = await Meal.findByPk(id, {
            include: {
                model: Type,
                as: "types", // Alias used in the association
                through: { attributes: [] }, // Exclude join table fields
            },
        });

        if (!meal) {
            const error = new Error("Meal not found");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(meal);
    } catch (e) {
        next(e);
    }
};

exports.deleteMeal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meal = await Meal.findByPk(id);

        if (!meal) {
            const error = new Error("Meal not found");
            error.statusCode = 404;
            throw error;
        }

        await meal.destroy();
        res.status(200).json({ message: "Meal deleted successfully" });
    } catch (e) {
        next(e);
    }
};

exports.updateMeal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, calories } = req.body;
        const image_url = req.file ? req.file.path : null;

        const meal = await Meal.findByPk(id);
        if (!meal) {
            const error = new Error("Meal not found");
            error.statusCode = 404;
            throw error;
        }

        meal.name = name || meal.name;
        meal.description = description || meal.description;
        meal.calories = calories || meal.calories;
        if (image_url) {
            meal.image_url = image_url;
        }

        await meal.save();
        res.status(200).json({
            message: "Meal updated successfully",
            meal,
        });
    } catch (e) {
        next(e);
    }
};
const getUpcomingWeek = () => {
    const today = new Date();
    const week = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        const day = daysOfWeek[date.getDay()];
        const formattedDate = date.toISOString().split("T")[0];
        week.push({ date: formattedDate, day });
    }

    return week;
};
exports.assignMealsToDays = async (req, res, next) => {
    try {
        const { assignments } = req.body; // assignments = [{ day: "YYYY-MM-DD", meal_ids: [1, 2, 3] }]

        for (const assignment of assignments) {
            const { day, meal_ids } = assignment;

            for (const meal_id of meal_ids) {
                await MealDay.create({
                    meal_id,
                    day
                });
            }
        }

        res.status(201).json({ message: "Meals assigned successfully." });
    } catch (error) {
        next(error);
    }
};
exports.getUpcomingWeek = async (req, res, next) => {
    try {
        const week = getUpcomingWeek();
        res.status(200).json({ week });
    } catch (error) {
        next(error);
    }
};
exports.getMealsForWeek = async (req, res, next) => {
    try {
        const upcomingWeek = getUpcomingWeek();
        const dates = upcomingWeek.map(entry => entry.date);

        const meals = await MealDay.findAll({
            where: {
                day: dates
            },
            include: {
                model: Meal,
                as: "meal"
            }
        });

        const groupedByDay = upcomingWeek.map(entry => ({
            day: entry,
            meals: meals.filter(m => m.day === entry.date).map(m => m.meal)
        }));

        res.status(200).json(groupedByDay);
    } catch (error) {
        next(error);
    }
};



