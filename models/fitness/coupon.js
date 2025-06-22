const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Coupon = sequelize.define('Coupon', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    discount_type: {
        type: DataTypes.ENUM('percentage', 'fixed'),
        allowNull: false
    },
    discount_value: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    expiry_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    usage_limit: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    used_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    package_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    meal_plan_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'coupons',
});

module.exports = Coupon; 