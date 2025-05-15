'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('mealPlans', [
            {
                title: 'Lean & Strong',
                title_ar: 'نحيف وقوي',
                calories: 1800,
                image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
                price_monthly: 199,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Muscle Builder',
                title_ar: 'بناء العضلات',
                calories: 2500,
                image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad04?w=800&q=80',
                price_monthly: 249,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Weight Loss',
                title_ar: 'فقدان الوزن',
                calories: 1500,
                image: 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?w=800&q=80',
                price_monthly: 179,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Balanced Nutrition',
                title_ar: 'تغذية متوازنة',
                calories: 2000,
                image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=800&q=80',
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
