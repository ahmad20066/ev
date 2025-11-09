const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const Type = require('./type');
const MealPlan = sequelize.define('MealPlan', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title_ar: {
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
    price_monthly: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price_21_days: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    price_26_days: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    number_of_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
    },
    description:{
        type: DataTypes.TEXT,
        allowNull: true
    },
    description_ar:{
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "mealPlans",
    // defaultScope: {
    //     include: [
    //         {
    //             model: Type,
    //             as: 'types',
    //             through: { attributes: [] },
    //             required: false
    //         },
    //     ],
    // },
});
module.exports = MealPlan;