'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (qi, S) => {
    // locate any FK that points from workouts.package_id -> packages.id
    const refs = await qi.getForeignKeyReferencesForTable('workouts');
    const fk = refs.find(r => r.columnName === 'package_id');
    if (fk) await qi.removeConstraint('workouts', fk.constraintName);

    // make the column nullable
    await qi.changeColumn('workouts', 'package_id', {
      type: S.INTEGER,
      allowNull: true,
    });

    // re‑add FK, now allowing NULL
    await qi.addConstraint('workouts', {
      fields: ['package_id'],
      type: 'foreign key',
      name: 'workouts_package_id_fk',         // stable explicit name
      references: { table: 'packages', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  down: async (qi, S) => {
    await qi.removeConstraint('workouts', 'workouts_package_id_fk');
    await qi.changeColumn('workouts', 'package_id', {
      type: S.INTEGER,
      allowNull: false,
    });
    await qi.addConstraint('workouts', {
      fields: ['package_id'],
      type: 'foreign key',
      name: 'workouts_package_id_fk',
      references: { table: 'packages', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },
};
