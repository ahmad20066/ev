'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // First remove the existing foreign key
        await queryInterface.removeConstraint('WorkoutAttendances', 'WorkoutAttendances_ibfk_50');

        // Then add it back with CASCADE
        await queryInterface.addConstraint('WorkoutAttendances', {
            fields: ['workout_id'],
            type: 'foreign key',
            name: 'WorkoutAttendances_workout_id_fkey',
            references: {
                table: 'workouts',
                field: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Remove the CASCADE foreign key
        await queryInterface.removeConstraint('WorkoutAttendances', 'WorkoutAttendances_workout_id_fkey');

        // Add back the original foreign key without CASCADE
        await queryInterface.addConstraint('WorkoutAttendances', {
            fields: ['workout_id'],
            type: 'foreign key',
            name: 'WorkoutAttendances_ibfk_50',
            references: {
                table: 'workouts',
                field: 'id'
            }
        });
    }
};