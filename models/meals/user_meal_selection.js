const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const Meal = require("./meal");
const MealSubscription = require("./meal_subscription");
const User = require("../user");

const UserMealSelection = sequelize.define("UserMealSelection", {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    meal_subscription_id: {
        type: DataTypes.INTEGER,
        references: {
            model: MealSubscription,
            key: "id",
        },
        allowNull: false
    },
    meal_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Meal,
            key: 'id',
        },
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,    // <--- NEW COLUMN
        allowNull: false
    },
    day: {
        type: DataTypes.ENUM("sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"),
        allowNull: false
    }
}, {
    defaultScope: {
        include: {
            model: Meal,
            as: "meal"
        }
    }
});

module.exports = UserMealSelection;
