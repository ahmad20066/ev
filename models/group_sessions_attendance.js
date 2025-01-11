const Sequelize = require('sequelize');
const sequelize = require('./index');
const BatchSessionAttendance = sequelize.define("BatchSessionAttendance", {
    attendance_id: {
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
    session_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "workout_sessions",
            key: "id",
        },
        allowNull: false,
    },
    join_time: {
        type: Sequelize.DATE,
        allowNull: false,
    },
}, {
    tableName: "batch_session_attendance",
    timestamps: true,
});
module.exports = BatchSessionAttendance
