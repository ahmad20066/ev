'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
    async up(queryInterface, Sequelize) {
        const hashedPassword = await bcrypt.hash('password123', 10);

        await queryInterface.bulkInsert('users', [
            {
                name: 'System Admin',
                email: 'admin@evolve.com',
                phone: '+1234567890',
                password: hashedPassword,
                role: 'admin',
                sport_id: 1,
                is_set_up: true,
                is_verified: true,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Head Coach',
                email: 'coach@evolve.com',
                phone: '+1234567891',
                password: hashedPassword,
                role: 'coach',
                sport_id: 1,
                is_set_up: true,
                is_verified: true,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Kitchen Manager',
                email: 'kitchen@evolve.com',
                phone: '+1234567892',
                password: hashedPassword,
                role: 'kitchen_staff',
                is_set_up: true,
                is_verified: true,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('users', { role: ['admin', 'coach', 'kitchen_staff'] }, {});
    }
};
