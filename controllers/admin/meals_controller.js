const { Sequelize, Op } = require("sequelize");
const Ingredient = require("../../models/meals/ingredient");
const Meal = require("../../models/meals/meal");
const MealDay = require("../../models/meals/meal_day");
const MealIngredient = require("../../models/meals/meal_ingredient");
const MealType = require("../../models/meals/meal_type");
const Type = require("../../models/meals/type");

const qs = require("qs");

exports.createMeal = async (req, res, next) => {
    try {
        req.body = qs.parse(req.body);
        console.log("Parsed Request Body:", req.body);

        const { name, name_ar, description, description_ar, calories, types, protein, carb, fats, fiber, ingredients } = req.body;

        let images = [];
        if (req.files && req.files['images']) {
            images = Array.isArray(req.files['images'])
                ? req.files['images'].map(file => file.path)
                : [req.files['images'].path];
        }

        const meal = await Meal.create({
            name,
            name_ar,
            description,
            description_ar,
            calories,
            images,
            protein,
            carb,
            fats,
            fiber
        });

        if (types && Array.isArray(types)) {
            const mealTypes = types.map(typeId => ({
                meal_id: meal.id,
                type_id: typeId
            }));
            await MealType.bulkCreate(mealTypes);
        }

        if (ingredients && Array.isArray(ingredients)) {
            console.log("Raw Ingredients:", ingredients); // Debugging line
            const mealIngredients = ingredients.map(item => ({
                meal_id: meal.id,
                ingredient_id: Number(item.ingredient_id), // Ensure it's a number
                quantity: Number(item.quantity) // Convert quantity to a float
            }));
            console.log("Processed Ingredients Before Insert:", mealIngredients); // Debugging line
            await MealIngredient.bulkCreate(mealIngredients);
        }

        const mealWithDetails = await Meal.findByPk(meal.id, {
            include: [
                { model: Type, as: 'types', through: { attributes: [] } },
                { model: Ingredient, as: 'ingredients', attributes: { exclude: ['stock'] }, through: { attributes: ['quantity'] } },
            ],
        });
        mealWithDetails.ingredients.forEach((ingredient) => {
            ingredient.dataValues.quantity = ingredient.MealIngredient.quantity;
            delete ingredient.dataValues.MealIngredient;
        });
        res.status(201).json({
            message: "Meal Created Successfully",
            meal: mealWithDetails,
        });
    } catch (e) {
        console.error("Error:", e);
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
                attributes: { exclude: ['stock'] },
                through: { attributes: ['quantity'] },
            },]
        });
        meals.forEach((meal) => {
            meal.ingredients.forEach((ingredient) => {
                ingredient.dataValues.quantity = ingredient.MealIngredient.quantity;
                delete ingredient.dataValues.MealIngredient;
            });
        })

        res.status(200).json(meals);
    } catch (e) {
        next(e);
    }
};

exports.showMeal = async (req, res, next) => {
    try {
        const { id } = req.params;
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
        });
        meal.ingredients.forEach((ingredient) => {
            ingredient.dataValues.quantity = ingredient.MealIngredient.quantity;
            delete ingredient.dataValues.MealIngredient;
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
        req.body = qs.parse(req.body); // Convert form-data into a proper object structure
        console.log("Parsed Request Body:", req.body);

        const { name, name_ar, description, description_ar, calories, types, protein, carb, fats, fiber, ingredients } = req.body;
        const { id } = req.params;

        const meal = await Meal.findByPk(id);
        if (!meal) {
            return res.status(404).json({ message: "Meal not found" });
        }

        let images = meal.images || [];
        if (req.files && req.files['images']) {
            images = Array.isArray(req.files['images'])
                ? req.files['images'].map(file => file.path)
                : [req.files['images'].path];
        }

        await meal.update({
            name: name || meal.name,
            name_ar: name_ar || meal.name_ar,
            description: description || meal.description,
            description_ar: description_ar || meal.description_ar,
            calories: calories || meal.calories,
            images,
            protein: protein || meal.protein,
            carb: carb || meal.carb,
            fats: fats || meal.fats,
            fiber: fiber || meal.fiber
        });

        if (types && Array.isArray(types)) {
            await MealType.destroy({ where: { meal_id: meal.id } });
            const mealTypes = types.map(typeId => ({
                meal_id: meal.id,
                type_id: typeId
            }));
            await MealType.bulkCreate(mealTypes);
        }

        if (ingredients && Array.isArray(ingredients)) {
            await MealIngredient.destroy({ where: { meal_id: meal.id } });

            console.log("Raw Ingredients:", ingredients);
            const mealIngredients = ingredients.map(item => ({
                meal_id: meal.id,
                ingredient_id: Number(item.ingredient_id),
                quantity: Number(item.quantity)
            }));
            console.log("Processed Ingredients Before Insert:", mealIngredients);
            await MealIngredient.bulkCreate(mealIngredients);
        }

        const updatedMeal = await Meal.findByPk(meal.id, {
            include: [
                { model: Type, as: "types", through: { attributes: [] } },
                { model: Ingredient, as: "ingredients", through: { attributes: ["quantity"] } }
            ]
        });

        // updatedMeal.ingredient.((item) => {
        //     item.dataValues.quantity = item.MealIngredient.quantity
        // })

        res.status(200).json({
            message: "Meal Updated Successfully",
            meal: updatedMeal
        });
    } catch (e) {
        console.error("Error:", e);
        next(e);
    }
};



exports.assignMealsToDays = async (req, res, next) => {
    try {
        const { assignments } = req.body;

        // Compute the day (using local time) from the date string.
        const getDayFromDate = (dateString) => {
            const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            // Split the date string and create a Date object in local time.
            const [year, month, day] = dateString.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            return daysOfWeek[date.getDay()];
        };

        // Build the new records from the assignments (ignoring any 'day' property from the front end)
        const newRecords = assignments.flatMap(assignment =>
            assignment.meal_ids.map(meal_id => ({
                date: assignment.date,
                day: getDayFromDate(assignment.date),
                meal_id,
            }))
        );

        // Extract unique dates from the assignments
        const uniqueDates = [...new Set(assignments.map(a => a.date))];

        // Fetch all existing records for the given dates
        const existingRecords = await MealDay.findAll({
            where: { date: uniqueDates },
            attributes: ["meal_id", "day", "date"],
            raw: true,
        });
        console.log(existingRecords)
        console.log(newRecords)
        // Determine which records should be deleted (present in DB but missing from new assignments)
        const recordsToDelete = existingRecords.filter(existingRecord =>
            !newRecords.some(newRecord =>
                newRecord.meal_id === existingRecord.meal_id &&
                newRecord.date === existingRecord.date
            )
        );
        console.log(recordsToDelete)
        // Determine which records should be added (present in new assignments but not in DB)
        const recordsToAdd = newRecords.filter(newRecord =>
            !existingRecords.some(existingRecord =>
                existingRecord.meal_id === newRecord.meal_id &&
                existingRecord.date === newRecord.date
            )
        );

        // Delete records that are not in the new assignments
        if (recordsToDelete.length > 0) {
            await MealDay.destroy({
                where: {
                    [Op.or]: recordsToDelete.map(record => ({
                        meal_id: record.meal_id,
                        date: record.date,
                    })),
                },
            });
        }

        // Add the new records that are missing
        if (recordsToAdd.length > 0) {
            await MealDay.bulkCreate(recordsToAdd);
        }

        // Fetch the updated records and return them
        const updatedRecords = await MealDay.findAll({
            attributes: ["meal_id", "day", "date"],
        });

        res.status(201).json({
            message: "Meal days synced successfully.",
            updatedRecords,
        });
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
const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function getUpcomingMonth() {
    const today = new Date();
    const month = [];

    for (let i = 0; i < 30; i++) { // Loop for the next 30 days
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase(); // Get full day name
        const formattedDate = date.toISOString().split("T")[0];
        month.push({ date: formattedDate, day: dayName });
    }
    return month;
}

exports.getMealsForWeek = async (req, res, next) => {
    try {
        // Get upcoming month data (array of objects with { day, date })
        const upcomingMonth = getUpcomingMonth();
        // Extract unique dates (e.g., ["2025-03-16", "2025-03-17", ...])
        const dateList = upcomingMonth.map(entry => entry.date);

        // Fetch meals for the upcoming dates
        const mealDays = await MealDay.findAll({
            where: {
                date: { [Op.in]: dateList }
            },
            include: {
                model: Meal,
                as: "meal",
                include: {
                    model: Ingredient,
                    as: "ingredients",
                    through: { attributes: [] }
                }
            }
        });

        // Group meals by each day based on the exact date
        const groupedByDay = upcomingMonth.map(entry => ({
            day: entry.day,
            date: entry.date,
            meals: mealDays
                .filter(m => m.date === entry.date)
                .map(m => m.meal)
        }));

        res.status(200).json(groupedByDay);
    } catch (error) {
        next(error);
    }
};

exports.createIngredient = async (req, res, next) => {
    try {
        const { title, title_ar, stock, unit } = req.body;
        let image;

        if (req.file) {
            image = req.file.path;
        }

        const ingredient = await Ingredient.create({ title, title_ar, image, stock, unit });
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
        const { title, title_ar, stock, unit } = req.body;
        const ingredient = await Ingredient.findByPk(req.params.id);

        if (!ingredient) {
            return res.status(404).json({
                success: false,
                message: "Ingredient not found"
            });
        }

        ingredient.title = title || ingredient.title;
        ingredient.title_ar = title_ar || ingredient.title_ar;
        ingredient.unit = unit || ingredient.unit;
        ingredient.stock = stock || ingredient.stock;

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




