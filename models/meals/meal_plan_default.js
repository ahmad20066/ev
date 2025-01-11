const Sequelize = require("sequelize")
const sequelize = require("../index")
const Meal = require("./meal")
const MealPlan = require("./meal_plan")
const MealPlanDefault = sequelize.define("MealPlanDefault", {
    meal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Meal,
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    meal_plan_id: {
        type: Sequelize.INTEGER,
        references: {
            model: MealPlan,
            key: "id"
        }
    },
})
module.exports = MealPlanDefault