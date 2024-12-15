const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const MealSubscription = require('./meal_subscription');
const User = require('../user');
const Meal = require('./meal');
const Order = sequelize.define('Order', {
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id',
        },
        allowNull: false,
    },

    meal_subscription_id: {
        type: DataTypes.INTEGER,
        references: {
            model: MealSubscription,
            key: 'id',
        },
        allowNull: false,
    },
    order_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("listed", "pending", "done"),
        defaultValue: "listed"
    }
}, {
    tableName: 'orders',
});

module.exports = Order;
