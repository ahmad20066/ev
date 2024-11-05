const Sequelize = require("sequelize");
const sequelize = require("./index");

const UserWorkout = sequelize.define("UserWorkout", {
    user_workout_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: "id",
        },
        allowNull: false,
    },
    workout_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "workouts",
            key: "id",
        },
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM("completed", "skipped", "rescheduled"),
        allowNull: false,
    },
    personal_notes: {
        type: Sequelize.STRING,
        allowNull: true,
    },
}, {
    tableName: "user_workouts",
    timestamps: true,
});
module.exports = UserWorkout