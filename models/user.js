const Sequelize = require("sequelize");
const sequelize = require("./index");
const ActivityLevel = require("./activity_level");
const HealthGoal = require("./health_goal");

const User = sequelize.define("User", {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    role: {
        type: Sequelize.ENUM("consumer", "admin", "kitchen_staff", "coach"),
        allowNull: false,
    },
    gender: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    age: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            isInt: true,
        },
    },
    height: {
        type: Sequelize.FLOAT,
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    activity_level_id: {
        type: Sequelize.INTEGER,
        references: {
            model: ActivityLevel,
            key: "id",
        },
        allowNull: true,
    },
    health_goal_id: {
        type: Sequelize.INTEGER,
        references: {
            model: HealthGoal,
            key: "id",
        },
        allowNull: true,
    },
    dietary_preferences: {
        type: Sequelize.STRING,
        allowNull: true, // Example: keto, vegan, etc.
    },
    package_type: {
        type: Sequelize.ENUM("group", "personalized")
    },
    is_set_up: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    deactivated_at: {
        type: Sequelize.DATE,
        allowNull: true,
    }
}, {
    defaultScope: {
        attributes: { exclude: ['password'] }
    },
    scopes: {
        withPassword: { attributes: {} }
    },
    tableName: "users"
});

User.belongsTo(ActivityLevel, { foreignKey: "activity_level_id" });
User.belongsTo(HealthGoal, { foreignKey: "health_goal_id" });

module.exports = User;