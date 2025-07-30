const Sequelize = require("sequelize");
const sequelize = require("../index");
const Package = require("../package");

const Workout = sequelize.define("Workout", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    image: {
        type: Sequelize.STRING,
        allowNull: false
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    title_ar: {
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
    description_ar: {
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
        allowNull: true
    },
    motivational_message: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    motivational_message_ar: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    is_template: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    template_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "workouts", key: "id" },
        onDelete: "CASCADE"
    },
    is_Active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: "workouts",
    timestamps: true,
});

module.exports = Workout;
