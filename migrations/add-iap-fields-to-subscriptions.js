'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('subscriptions', 'payment_method', {
            type: Sequelize.ENUM('tap', 'iap'),
            allowNull: true,
            defaultValue: 'tap'
        });

        await queryInterface.addColumn('subscriptions', 'apple_transaction_id', {
            type: Sequelize.STRING,
            allowNull: true
        });

        // Add apple_product_id to packages table
        await queryInterface.addColumn('packages', 'apple_product_id', {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('subscriptions', 'payment_method');
        await queryInterface.removeColumn('subscriptions', 'apple_transaction_id');
        await queryInterface.removeColumn('packages', 'apple_product_id');
    }
};
