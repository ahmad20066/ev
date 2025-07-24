'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('subscriptions', 'coupon_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'payment_charge_id'
        });

        await queryInterface.addColumn('subscriptions', 'discount_applied', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0,
            after: 'coupon_id'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('subscriptions', 'coupon_id');
        await queryInterface.removeColumn('subscriptions', 'discount_applied');
    }
}; 