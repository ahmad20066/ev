const Sequelize = require("sequelize")
const sequelize = require("../index")
const Type = require("./type")
const Meal = require("./meal")
const MealType = sequelize.define("MealType", {
    meal_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Meal,
            key: "id"
        }
    },
    type_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Type,
            key: "id"
        }
    }
})
module.exports = MealType