const Sequelize = require("sequelize")
const sequelize = require("../index")
const Workout = require("./workout")
const WorkoutRating = sequelize.define("WorkoutRating", {
    workout_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Workout,
            key: "id"
        },
        allowNull: false
    },
    rating: {
        type: Sequelize.DOUBLE,
        validate: {
            min: 1,
            max: 5,
            isNumeric: true,
        },
    },
    message: {
        type: Sequelize.STRING,
        allowNull: true
    }
})
module.exports = WorkoutRating