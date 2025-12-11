'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // First, update any existing records with NULL subscription_duration to 26 (default)
        await queryInterface.sequelize.query(`
            UPDATE MealSubscriptions 
            SET subscription_duration = 26 
            WHERE subscription_duration IS NULL
        `);

        // Then make the column NOT NULL and add validation
        await queryInterface.changeColumn('MealSubscriptions', 'subscription_duration', {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'Subscription duration in days (21 or 26)'
        });

        // Add a check constraint to ensure only 21 or 26 are allowed
        await queryInterface.addConstraint('MealSubscriptions', {
            fields: ['subscription_duration'],
            type: 'check',
            name: 'subscription_duration_check',
            where: {
                subscription_duration: {
                    [Sequelize.Op.in]: [21, 26]
                }
            }
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove the check constraint
        await queryInterface.removeConstraint('MealSubscriptions', 'subscription_duration_check');
        
        // Make the column nullable again
        await queryInterface.changeColumn('MealSubscriptions', 'subscription_duration', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Subscription duration in days (21 or 26)'
        });
    }
};
