const { DataTypes } = require('sequelize');
const sequelize = require('./index'); // Assuming you have a database config file
const Meal = require('./meal');  // Assuming you have a Meal model

const MealIngredient = sequelize.define('MealIngredient', {
    ingredient_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    meal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,  // Foreign key to Meal
        references: {
            model: Meal,
            key: 'meal_id',
        },
        onDelete: 'CASCADE',
    },
    ingredient_name: {
        type: DataTypes.STRING,
        allowNull: false,  // Name of the ingredient (e.g., "Chicken")
    },
    quantity: {
        type: DataTypes.STRING,
        allowNull: false,  // Quantity of the ingredient (e.g., "200g", "1 tbsp")
    },
    calories: {
        type: DataTypes.FLOAT,
        allowNull: true,  // Calories contributed by the ingredient
    },

},);

module.exports = MealIngredient;
