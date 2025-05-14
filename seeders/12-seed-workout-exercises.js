'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Clear existing data first
        await queryInterface.bulkDelete('WorkoutExercises', null, {});

        // Get actual workout IDs from the database
        const workouts = await queryInterface.sequelize.query(
            'SELECT id FROM workouts ORDER BY id',
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        // Get actual exercise IDs from the database
        const exercises = await queryInterface.sequelize.query(
            'SELECT id FROM exercises ORDER BY id',
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        if (workouts.length === 0 || exercises.length === 0) {
            console.log('No workouts or exercises found. Skipping workout-exercise relationships.');
            return;
        }

        const workoutExercises = [
            // Beginner Full Body (1st workout) - Basic exercises
            { workout_id: workouts[0].id, exercise_id: exercises[0].id }, // Push Up
            { workout_id: workouts[0].id, exercise_id: exercises[1].id }, // Squat
            { workout_id: workouts[0].id, exercise_id: exercises[3].id }, // Plank

            // HIIT Cardio Blast (2nd workout) - High intensity
            { workout_id: workouts[1].id, exercise_id: exercises[4].id }, // Burpee
            { workout_id: workouts[1].id, exercise_id: exercises[5].id }, // Mountain Climbers
            { workout_id: workouts[1].id, exercise_id: exercises[0].id }, // Push Up

            // Upper Body Strength (3rd workout)
            { workout_id: workouts[2].id, exercise_id: exercises[0].id }, // Push Up
            { workout_id: workouts[2].id, exercise_id: exercises[2].id }, // Deadlift
            { workout_id: workouts[2].id, exercise_id: exercises[3].id }, // Plank

            // Core Crusher (4th workout)
            { workout_id: workouts[3].id, exercise_id: exercises[3].id }, // Plank
            { workout_id: workouts[3].id, exercise_id: exercises[5].id }, // Mountain Climbers
            { workout_id: workouts[3].id, exercise_id: exercises[4].id }, // Burpee

            // Flexibility Flow (5th workout)
            { workout_id: workouts[4].id, exercise_id: exercises[3].id }, // Plank
            { workout_id: workouts[4].id, exercise_id: exercises[1].id }, // Squat
        ];

        // Add timestamps
        const now = new Date();
        const workoutExercisesWithTimestamps = workoutExercises.map(item => ({
            ...item,
            createdAt: now,
            updatedAt: now
        }));

        await queryInterface.bulkInsert('WorkoutExercises', workoutExercisesWithTimestamps);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('WorkoutExercises', null, {});
    }
};

