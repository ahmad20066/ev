const Sequelize = require("sequelize")
const sequelize = require("../index")
const Meal = require("./meal")
const MealDay = sequelize.define("MealDay", {
    meal_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Meal,
            key: "id"
        },
        allowNull: false
    },
    day: {
        type: Sequelize.ENUM("sunday", "monday", "wednesday", "tuesday", "thursday", "friday", "saturday"),
        allowNull: false
    },
    date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: new Date()
    },
})
module.exports = MealDay