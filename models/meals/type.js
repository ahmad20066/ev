const Sequelize = require("sequelize")
const sequelize = require("../index")
const Type = sequelize.define("Type", {
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    title_ar: {
        type: Sequelize.STRING,
        allowNull: false
    }
})
module.exports = Type