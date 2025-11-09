'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('MealSubscriptions', 'subscription_duration', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Subscription duration in days (21 or 26)',
            after: 'payment_charge_id'
        });

        await queryInterface.addColumn('MealSubscriptions', 'coupon_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'subscription_duration'
        });

        await queryInterface.addColumn('MealSubscriptions', 'discount_applied', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0,
            after: 'coupon_id'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('MealSubscriptions', 'subscription_duration');
        await queryInterface.removeColumn('MealSubscriptions', 'coupon_id');
        await queryInterface.removeColumn('MealSubscriptions', 'discount_applied');
    }
};

