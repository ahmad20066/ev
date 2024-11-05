const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const MealPlan = sequelize.define('MealPlan', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    calories: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price_weekly: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price_monthly: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: "mealPlans"
});

module.exports = MealPlan;
