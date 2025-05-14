'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            // Disable foreign key checks
            await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

            // List of all tables in dependency order (reverse of creation)
            const tablesToClear = [
                'MealIngredients',
                'MealTypes',
                'MealPlanTypes',
                'WorkoutExercises',
                'UserMealSelections',
                'UserWorkouts',
                'UserWorkoutRequests',
                'WorkoutAttendances',
                'WorkoutCompletions',
                'WorkoutRatings',
                'ExerciseCompletions',
                'ExerciseStats',
                'Subscriptions',
                'Orders',
                'OrderMeals',
                'MealSubscriptions',
                'MealRenewals',
                'Choices',
                'Questions',
                'Surveys',
                'Messages',
                'Chats',
                'ChatRequests',
                'Notifications',
                'WeightRecords',
                'Workouts',
                'Exercises',
                'Meals',
                'MealPlans',
                'Ingredients',
                'Types',
                'DeliveryTimes',
                'Packages',
                'PricingModels',
                'Users',
                'Sports',
                'TermsConditions',
                'PrivacyPolicies',
                'FAQs'
            ];

            // Clear each table
            for (const table of tablesToClear) {
                try {
                    await queryInterface.bulkDelete(table, {});
                    console.log(`✓ Cleared ${table}`);
                } catch (error) {
                    console.log(`⚠️  Could not clear ${table}: ${error.message}`);
                }
            }

            // Reset auto-increment counters (optional)
            for (const table of tablesToClear) {
                try {
                    await queryInterface.sequelize.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
                } catch (error) {
                    // Ignore errors for tables without auto-increment
                }
            }

            // Re-enable foreign key checks
            await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

            console.log('🗑️  Database reset completed');
        } catch (error) {
            console.error('❌ Error resetting database:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        // No down action needed
    }
}; 