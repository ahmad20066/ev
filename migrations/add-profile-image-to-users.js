'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'profile_image', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'fcm_token'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'profile_image');
    }
};

