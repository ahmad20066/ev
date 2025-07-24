'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('subscriptions', 'payment_charge_id', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'is_active'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('subscriptions', 'payment_charge_id');
    }
}; 