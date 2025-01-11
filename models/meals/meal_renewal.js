const Sequelize = require("sequelize")
const sequelize = require("../index")
const MealSubscription = require("./meal_subscription")

const MealRenewal = sequelize.define("MealRenewal", {
    subscription_id: {
        type: Sequelize.INTEGER,
        references: {
            model: MealSubscription,
            key: "id"
        }
    }
})
module.exports = MealRenewal