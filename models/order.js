const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./user');

const Order = sequelize.define('Order', {

    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,  // Foreign key to User
        references: {
            model: User,
            key: 'user_id',
        },
        onDelete: 'CASCADE',
    },
    order_status: {
        type: DataTypes.ENUM('processing', 'ready', 'dispatched', 'delivered'),
        defaultValue: 'processing',
        allowNull: false,
    },
    preparation_status: {
        type: DataTypes.ENUM('pending', 'preparing', 'ready'),
        defaultValue: 'pending',
        allowNull: false,
    },
    delivery_status: {
        type: DataTypes.ENUM('pending', 'in transit', 'delivered'),
        defaultValue: 'pending',
        allowNull: false,
    },
    dispatch_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },


},);

module.exports = Order;
