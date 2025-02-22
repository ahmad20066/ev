const Sequelize = require("sequelize")
const sequelize = require("../index")
const Meal = require("./meal")
const Ingredient = require("./ingredient")
const MealIngredient = sequelize.define("MealIngredient", {
    meal_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Meal,
            key: "id"
        }
    },
    ingredient_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Ingredient,
            key: "id"
        }
    },
    quantity: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
    },

})
module.exports = MealIngredient