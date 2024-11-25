const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const User = require('../user');

const Order = sequelize.define('Order', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    dispatch_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
},);
module.exports = Order;
