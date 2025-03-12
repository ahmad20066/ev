const Sequelize = require("sequelize")
const sequelize = require("../index")
const Ingredient = sequelize.define("Ingredient", {
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    title_ar: {
        type: Sequelize.STRING,
        allowNull: false
    },
    image: {
        type: Sequelize.STRING,
        allowNull: true
    },
    stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    unit: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'g'
    }
})
module.exports = Ingredient