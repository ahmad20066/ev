'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Clear existing relationship data first with proper WHERE clauses
        await queryInterface.bulkDelete('MealPlanTypes', {
            meal_plan_id: { [Sequelize.Op.gte]: 1 }
        });
        await queryInterface.bulkDelete('MealTypes', {
            meal_id: { [Sequelize.Op.gte]: 1 }
        });
        await queryInterface.bulkDelete('MealIngredients', {
            meal_id: { [Sequelize.Op.gte]: 1 }
        });

        const now = new Date();

        // Seed MealTypes relationships
        const mealTypes = [
            { meal_id: 1, type_id: 3, createdAt: now, updatedAt: now }, // Protein Power Bowl -> Lunch
            { meal_id: 2, type_id: 1, createdAt: now, updatedAt: now }, // Overnight Oats -> Breakfast
            { meal_id: 3, type_id: 5, createdAt: now, updatedAt: now }, // Baked Salmon -> Dinner
            { meal_id: 4, type_id: 6, createdAt: now, updatedAt: now }, // Pre-Workout Energy -> Pre-Workout
            { meal_id: 5, type_id: 7, createdAt: now, updatedAt: now }  // Post-Workout Recovery -> Post-Workout
        ];

        await queryInterface.bulkInsert('MealTypes', mealTypes);

        // Seed MealIngredients relationships (without unit field)
        const mealIngredients = [
            // Protein Power Bowl (meal_id: 1)
            { meal_id: 1, ingredient_id: 1, quantity: 150, createdAt: now, updatedAt: now }, // Chicken Breast
            { meal_id: 1, ingredient_id: 7, quantity: 100, createdAt: now, updatedAt: now }, // Quinoa
            { meal_id: 1, ingredient_id: 3, quantity: 100, createdAt: now, updatedAt: now }, // Broccoli

            // Overnight Oats (meal_id: 2)
            { meal_id: 2, ingredient_id: 10, quantity: 50, createdAt: now, updatedAt: now }, // Oats
            { meal_id: 2, ingredient_id: 9, quantity: 150, createdAt: now, updatedAt: now }, // Greek Yogurt

            // Baked Salmon (meal_id: 3)
            { meal_id: 3, ingredient_id: 4, quantity: 150, createdAt: now, updatedAt: now }, // Salmon
            { meal_id: 3, ingredient_id: 5, quantity: 200, createdAt: now, updatedAt: now }, // Sweet Potato

            // Pre-Workout Energy (meal_id: 4)
            { meal_id: 4, ingredient_id: 10, quantity: 50, createdAt: now, updatedAt: now }, // Oats

            // Post-Workout Recovery (meal_id: 5)
            { meal_id: 5, ingredient_id: 6, quantity: 2, createdAt: now, updatedAt: now }, // Eggs
            { meal_id: 5, ingredient_id: 8, quantity: 1, createdAt: now, updatedAt: now }  // Avocado
        ];

        await queryInterface.bulkInsert('MealIngredients', mealIngredients);

        // Seed meal plan type relationships
        await queryInterface.bulkInsert('MealPlanTypes', [
            // Lean & Strong plan includes breakfast, lunch, dinner
            { meal_plan_id: 1, type_id: 1, createdAt: new Date(), updatedAt: new Date() }, // Breakfast
            { meal_plan_id: 1, type_id: 3, createdAt: new Date(), updatedAt: new Date() }, // Lunch
            { meal_plan_id: 1, type_id: 5, createdAt: new Date(), updatedAt: new Date() }, // Dinner

            // Mass Builder plan includes everything
            { meal_plan_id: 2, type_id: 1, createdAt: new Date(), updatedAt: new Date() }, // Breakfast
            { meal_plan_id: 2, type_id: 2, createdAt: new Date(), updatedAt: new Date() }, // Mid-Morning Snack
            { meal_plan_id: 2, type_id: 3, createdAt: new Date(), updatedAt: new Date() }, // Lunch
            { meal_plan_id: 2, type_id: 4, createdAt: new Date(), updatedAt: new Date() }, // Afternoon Snack
            { meal_plan_id: 2, type_id: 5, createdAt: new Date(), updatedAt: new Date() }, // Dinner
            { meal_plan_id: 2, type_id: 6, createdAt: new Date(), updatedAt: new Date() }, // Pre-Workout
            { meal_plan_id: 2, type_id: 7, createdAt: new Date(), updatedAt: new Date() }, // Post-Workout

            // Weight Loss plan includes breakfast, lunch, dinner
            { meal_plan_id: 3, type_id: 1, createdAt: new Date(), updatedAt: new Date() }, // Breakfast
            { meal_plan_id: 3, type_id: 3, createdAt: new Date(), updatedAt: new Date() }, // Lunch
            { meal_plan_id: 3, type_id: 5, createdAt: new Date(), updatedAt: new Date() }, // Dinner

            // Balanced plan includes breakfast, lunch, dinner, pre/post workout
            { meal_plan_id: 4, type_id: 1, createdAt: new Date(), updatedAt: new Date() }, // Breakfast
            { meal_plan_id: 4, type_id: 3, createdAt: new Date(), updatedAt: new Date() }, // Lunch
            { meal_plan_id: 4, type_id: 5, createdAt: new Date(), updatedAt: new Date() }, // Dinner
            { meal_plan_id: 4, type_id: 6, createdAt: new Date(), updatedAt: new Date() }, // Pre-Workout
            { meal_plan_id: 4, type_id: 7, createdAt: new Date(), updatedAt: new Date() }  // Post-Workout
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('MealPlanTypes', {
            meal_plan_id: { [Sequelize.Op.gte]: 1 }
        });
        await queryInterface.bulkDelete('MealTypes', {
            meal_id: { [Sequelize.Op.gte]: 1 }
        });
        await queryInterface.bulkDelete('MealIngredients', {
            meal_id: { [Sequelize.Op.gte]: 1 }
        });
    }
};
