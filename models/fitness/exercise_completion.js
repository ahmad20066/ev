const Sequelize = require("sequelize");
const sequelize = require("../index");
const Exercise = require("./exercise");


const ExerciseCompletion = sequelize.define("ExerciseCompletion", {
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: "id",
        },
    },
    exercise_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Exercise,
            key: "id",
        },
    },
}, {
    defaultScope: {
        include: {
            model: Exercise,
            as: "exercise"
        }
    }
});

module.exports = ExerciseCompletion;
