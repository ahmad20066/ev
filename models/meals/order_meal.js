const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const Order = require('./order');
const Meal = require('./meal');

const OrderMeal = sequelize.define('OrderMeal', {
    // id: {
    //     type: DataTypes.INTEGER,
    //     primaryKey: true,
    //     autoIncrement: true
    // },
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
},);

module.exports = OrderMeal;
