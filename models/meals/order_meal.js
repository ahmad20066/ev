const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const Order = require('./order');
const Meal = require('./meal');

const OrderMeal = sequelize.define('OrderMeal', {

    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Order,
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    meal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Meal,
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    tableName: 'OrderMeals',
});


module.exports = OrderMeal;
