const Sequelize = require("sequelize")
const sequelize = require("../index")
const Type = sequelize.define("Type", {
    title: { // for example breakfast
        type: Sequelize.STRING,
        allowNull: false
    }
})
module.exports = Type