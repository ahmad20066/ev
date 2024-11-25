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
            key: 'order_id',
        },
        onDelete: 'CASCADE',
    },
    meal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Meal,
            key: 'meal_id',
        },
        onDelete: 'CASCADE',
    },
},);

module.exports = OrderMeal;
