const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const Type = require('./type');
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
    price_monthly: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
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