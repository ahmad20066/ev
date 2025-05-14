'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('Types', [
            {
                title: 'Breakfast',
                title_ar: 'فطور',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Mid-Morning Snack',
                title_ar: 'وجبة خفيفة صباحية',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Lunch',
                title_ar: 'غداء',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Afternoon Snack',
                title_ar: 'وجبة خفيفة بعد الظهر',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Dinner',
                title_ar: 'عشاء',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Pre-Workout',
                title_ar: 'قبل التمرين',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Post-Workout',
                title_ar: 'بعد التمرين',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Types', null, {});
    }
};
