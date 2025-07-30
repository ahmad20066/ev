const Sequelize = require("sequelize")
const sequelize = require("../index");
const Workout = require("./workout");
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
        },
        onDelete: 'RESTRICT',  // Prevent deletion of workouts that have attendance records
        onDelete: 'CASCADE'
    },
}, {
    defaultScope: {
        include: {
            model: Workout,
            as: "workout"
        },
        attributes: {
            exclude: ['user_id']
        }
    }
});
module.exports = WorkoutAttendance