'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('mealPlans', 'price_21_days', {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'price_monthly'
        });

        await queryInterface.addColumn('mealPlans', 'price_26_days', {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'price_21_days'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('mealPlans', 'price_21_days');
        await queryInterface.removeColumn('mealPlans', 'price_26_days');
    }
};

