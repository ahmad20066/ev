const Ingredient = require("../../models/meals/ingredient");
const Meal = require("../../models/meals/meal");
const MealDay = require("../../models/meals/meal_day");
const MealIngredient = require("../../models/meals/meal_ingredient");
const MealType = require("../../models/meals/meal_type");
const Type = require("../../models/meals/type");

exports.createMeal = async (req, res, next) => {
    try {
        const { name, description, calories, types, protein, carb, fats, fiber, ingredients } = req.body;
        const image_url = req.file ? req.file.path : null;

        const meal = await Meal.create({
            name,
            description,
            calories,
            image_url,
            protein,
            carb,
            fats,
            fiber,
        });

        if (types && Array.isArray(types) && types.length > 0) {
            for (const typeId of types) {
                await MealType.create({
                    meal_id: meal.id,
                    type_id: typeId,
                });
            }
        }

        if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
            for (const ingredientId of ingredients) {
                await MealIngredient.create({
                    meal_id: meal.id,
                    ingredient_id: ingredientId,
                });
            }
        }

        const mealWithDetails = await Meal.findByPk(meal.id, {
            include: [
                {
                    model: Type,
                    as: 'types',
                    through: { attributes: [] },
                },
                {
                    model: Ingredient,
                    as: 'ingredients',
                    through: { attributes: [] },
                },
            ],
        });

        res.status(201).json({
            message: "Meal Created Successfully",
            meal: mealWithDetails,
        });
    } catch (e) {
        next(e);
    }
};


exports.getMeals = async (req, res, next) => {
    try {
        const meals = await Meal.findAll({
            include: [{
                model: Type,
                as: "types",
                through: { attributes: [] },
            },
            {
                model: Ingredient,
                as: 'ingredients',
                through: { attributes: [] },
            },]
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
        const { name, description, calories, types, protein, carb, fats, fiber, ingredients } = req.body;
        const image_url = req.file ? req.file.path : null;

        // Fetch the meal by ID
        const meal = await Meal.findByPk(id);
        if (!meal) {
            const error = new Error("Meal not found");
            error.statusCode = 404;
            throw error;
        }

        // Update meal details
        meal.name = name || meal.name;
        meal.description = description || meal.description;
        meal.calories = calories || meal.calories;
        meal.protein = protein || meal.protein;
        meal.carb = carb || meal.carb;
        meal.fats = fats || meal.fats;
        meal.fiber = fiber || meal.fiber;

        if (image_url) {
            meal.image_url = image_url;
        }

        // Save the updated meal
        await meal.save();

        // Delete existing meal-type associations before adding new ones
        if (types && Array.isArray(types) && types.length > 0) {
            await MealType.destroy({
                where: {
                    meal_id: meal.id,
                },
            });

            // Add the new types
            for (const typeId of types) {
                await MealType.create({
                    meal_id: meal.id,
                    type_id: typeId,
                });
            }
        }

        // Delete existing meal-ingredient associations before adding new ones
        if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
            await MealIngredient.destroy({
                where: {
                    meal_id: meal.id,
                },
            });

            // Add the new ingredients
            for (const ingredientId of ingredients) {
                await MealIngredient.create({
                    meal_id: meal.id,
                    ingredient_id: ingredientId,
                });
            }
        }

        // Fetch the updated meal with its associated types and ingredients
        const updatedMeal = await Meal.findByPk(meal.id, {
            include: [
                {
                    model: Type,
                    as: 'types',
                    through: { attributes: [] }, // Exclude join table data
                },
                {
                    model: Ingredient,
                    as: 'ingredients',
                    through: { attributes: [] }, // Exclude join table data
                },
            ],
        });

        res.status(200).json({
            message: "Meal updated successfully",
            meal: updatedMeal,
        });
    } catch (e) {
        next(e);
    }
};

const getUpcomingWeek = () => {
    const today = new Date();
    const week = [];
    const daysOfWeek = ["sunday", "monday", "wednesday", "tuesday", "thursday", "friday", "saturday"];

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
        const { assignments } = req.body; // assignments = [{ day: "sunday", meal_ids: [1, 2, 3] }]

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
        const dates = upcomingWeek.map(entry => entry.day);

        const meals = await MealDay.findAll({
            where: {
                day: dates
            },
            include: {
                model: Meal,
                as: "meal",
                include: {
                    model: Ingredient,
                    as: 'ingredients',
                    through: { attributes: [] },
                },
            }
        });
        console.log(meals)
        const groupedByDay = upcomingWeek.map(entry => ({
            day: entry,
            meals: meals.filter(m => m.day == entry.day).map(m => m.meal)
        }));

        res.status(200).json(groupedByDay);
    } catch (error) {
        next(error);
    }
};


exports.createIngredient = async (req, res) => {
    try {
        const { title } = req.body;
        let image;

        if (req.file) {
            image = req.file.path;
        }

        const ingredient = await Ingredient.create({ title, image });
        res.status(201).json({
            message: "ingredient created succesfully",
            ingredient
        });
    } catch (error) {
        next(error)
    };
}
exports.getAllIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.findAll();
        res.status(200).json(ingredients);
    } catch (error) {
        next(error)
    }
};



exports.updateIngredient = async (req, res) => {
    try {
        const { title } = req.body;
        const ingredient = await Ingredient.findByPk(req.params.id);

        if (!ingredient) {
            return res.status(404).json({
                success: false,
                message: "Ingredient not found"
            });
        }

        ingredient.title = title || ingredient.title;

        if (req.file) {
            ingredient.image = req.file.path;
        }

        await ingredient.save();
        res.status(200).json({
            message: "Ingredient updated successfully",
            ingredient
        });
    } catch (error) {
        next(error)
    }
};

exports.deleteIngredient = async (req, res) => {
    try {
        const ingredient = await Ingredient.findByPk(req.params.id);

        if (!ingredient) {
            return res.status(404).json({
                success: false,
                message: "Ingredient not found"
            });
        }

        await ingredient.destroy();
        res.status(200).json({

            message: "Ingredient deleted"
        });
    } catch (error) {
        next(error)
    }
};




