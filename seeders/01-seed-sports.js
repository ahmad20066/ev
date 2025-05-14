'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('Sports', [
            {
                title: 'Weight Training',
                title_ar: 'تدريب الأثقال',
                image: 'weight-training.jpg',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Running',
                title_ar: 'الجري',
                image: 'running.jpg',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Yoga',
                title_ar: 'اليوجا',
                image: 'yoga.jpg',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Cross Training',
                title_ar: 'التدريب المتقاطع',
                image: 'cross-training.jpg',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Sports', null, {});
    }
};
