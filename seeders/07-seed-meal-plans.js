'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('mealPlans', [
            {
                title: 'Lean & Strong',
                title_ar: 'نحيف وقوي',
                calories: 1800,
                image: 'lean-strong-plan.jpg',
                price_monthly: 199,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Muscle Builder',
                title_ar: 'بناء العضلات',
                calories: 2500,
                image: 'muscle-builder-plan.jpg',
                price_monthly: 249,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Weight Loss',
                title_ar: 'فقدان الوزن',
                calories: 1500,
                image: 'weight-loss-plan.jpg',
                price_monthly: 179,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Balanced Nutrition',
                title_ar: 'تغذية متوازنة',
                calories: 2000,
                image: 'balanced-plan.jpg',
                price_monthly: 219,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('mealPlans', null, {});
    }
};
