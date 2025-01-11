const Sequelize = require("sequelize");
const sequelize = require("../index");
const Exercise = require("./exercise");
const Workout = require("./workout");

const WorkoutCompletion = sequelize.define("WorkoutCompletion", {
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: "id",
        },
    },
    workout_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Workout,
            key: "id",
        },
    },

},);

module.exports = WorkoutCompletion;
