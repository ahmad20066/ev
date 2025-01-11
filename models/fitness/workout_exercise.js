const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const Workout = require('./workout');
const Exercise = require('./exercise');

const WorkoutExercise = sequelize.define('WorkoutExercise', {
    workout_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Workout,
            key: 'id',
        },
        onDelete: 'CASCADE',
        primaryKey: true,
    },
    exercise_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Exercise,
            key: 'id',
        },
        onDelete: 'CASCADE',
        primaryKey: true,
    },
    sets: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    reps: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

Workout.belongsToMany(Exercise, { through: WorkoutExercise, as: 'exercises', foreignKey: 'workout_id' });
Exercise.belongsToMany(Workout, { through: WorkoutExercise, as: 'workouts', foreignKey: 'exercise_id' });

module.exports = WorkoutExercise;
