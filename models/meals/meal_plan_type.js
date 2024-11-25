const Sequelize = require("sequelize")
const sequelize = require("../index")
const MealPlan = require("./meal_plan")
const Type = require("./type")
const MealPlanType = sequelize.define("MealPlanType", {
    meal_plan_id: {
        type: Sequelize.INTEGER,
        references: {
            model: MealPlan,
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
module.exports = MealPlanType