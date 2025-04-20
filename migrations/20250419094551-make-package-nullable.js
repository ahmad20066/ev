'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Drop FK first (if it exists)
    await queryInterface.removeConstraint('workouts', 'workouts_package_id_foreign');

    // 2. Change column to allow NULL
    await queryInterface.changeColumn('workouts', 'package_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // 3. Re‑add FK but let NULL pass
    await queryInterface.addConstraint('workouts', {
      fields: ['package_id'],
      type: 'foreign key',
      name: 'workouts_package_id_foreign',
      references: { table: 'packages', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('workouts', 'workouts_package_id_foreign');
    await queryInterface.changeColumn('workouts', 'package_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.addConstraint('workouts', {
      fields: ['package_id'],
      type: 'foreign key',
      name: 'workouts_package_id_foreign',
      references: { table: 'packages', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },
};

