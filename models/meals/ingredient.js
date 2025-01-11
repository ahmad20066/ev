const Sequelize = require("sequelize")
const sequelize = require("../index")
const Ingredient = sequelize.define("Ingredient", {
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    image: {
        type: Sequelize.STRING,
        allowNull: true
    }
})
module.exports = Ingredient