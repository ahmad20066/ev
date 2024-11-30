const Sequelize = require("sequelize");
const sequelize = require("../index");
const ExerciseCompletion = require("./exercise_completion");


const ExerciseStat = sequelize.define("ExerciseStat", {
    exercise_completion_id: {
        type: Sequelize.INTEGER,
        references: {
            model: ExerciseCompletion,
            key: "id"
        },
        allowNull: false
    },

    set: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    reps: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    weight: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});




module.exports = ExerciseStat;
