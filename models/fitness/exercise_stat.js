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
    weight: {
        type: Sequelize.STRING,
        allowNull: true
    }
});




module.exports = ExerciseStat;
