const Sequelize = require("sequelize")
const sequelize = require("../index")
const WorkoutAttendance = sequelize.define("WorkoutAttendance", {
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: "id"
        }
    },
    workout_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "workouts",
            key: "id"
        }
    },
});
module.exports = WorkoutAttendance