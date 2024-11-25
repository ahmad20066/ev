const Sequelize = require("sequelize");
const sequelize = require("../index");
const Package = require("../package");
const Workout = sequelize.define("Workout", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    type: {
        type: Sequelize.ENUM("personalized", "group"),
        allowNull: false
    },
    difficulty_level: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    coach: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: "id",
        },
        allowNull: false
    },
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: "id",
        },
        allowNull: true,
    },
    date: {
        type: Sequelize.DATEONLY,
    },
    package_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Package,
            key: "id"
        },
        allowNull: false
    }
}, {
    tableName: "workouts",
    timestamps: true,
});
module.exports = Workout;
