const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Meal = sequelize.define('Meal', {

    meal_plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,  // Foreign key to MealPlan
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    calories: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    can_be_skipped: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    can_be_modified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    delivery_status: {
        type: DataTypes.ENUM('in_progress', 'on_the_way', 'delivered'),
        defaultValue: 'in_progress',
        allowNull: false,
    },

},);

module.exports = Meal;
