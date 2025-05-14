'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('DeliveryTimes', [
            {
                title: '6:00 AM - 8:00 AM',
                title_ar: '6:00 ص - 8:00 ص',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: '8:00 AM - 10:00 AM',
                title_ar: '8:00 ص - 10:00 ص',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: '10:00 AM - 12:00 PM',
                title_ar: '10:00 ص - 12:00 م',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: '12:00 PM - 2:00 PM',
                title_ar: '12:00 م - 2:00 م',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: '2:00 PM - 4:00 PM',
                title_ar: '2:00 م - 4:00 م',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: '4:00 PM - 6:00 PM',
                title_ar: '4:00 م - 6:00 م',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('DeliveryTimes', null, {});
    }
};
