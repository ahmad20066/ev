const Sequelize = require("sequelize");
const sequelize = require("../index");
const { DataTypes } = require('sequelize');
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
    meal_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Meal,
            key: 'id',
        },
        allowNull: false,
    },
    day: {
        type: Sequelize.ENUM("sunday", "monday", "wednesday", "tuesday", "thursday", "friday", "saturday"),
        allowNull: false
    },
    meal_subscription_id: {
        type: DataTypes.INTEGER,
        references: {
            model: MealSubscription,
            key: "id",
        },
        allowNull: false
    },
},
    {
        defaultScope: {
            include: {
                model: Meal,
                as: "meal"
            }
        }
    });

module.exports = UserMealSelection;
