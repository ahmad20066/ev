'use strict';
const bcrypt = require('bcryptjs')
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 10); // Replace with your desired password
    return queryInterface.bulkInsert('users', [
      {
        name: 'Admin User',
        email: 'admin@gmail.com',
        phone: '123456789',
        password: hashedPassword,
        role: 'admin',
        age: null,
        gender: null,
        weight: null,
        height: null,
        activity_level_id: null,
        health_goal_id: null,
        dietary_preferences: null,
        fitness_level: null,
        is_set_up: true,            // Set to true since admin doesn’t need profile setup
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
