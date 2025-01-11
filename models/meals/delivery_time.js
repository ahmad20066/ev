const Sequelize = require("sequelize")
const sequelize = require("../index")
const DeliveryTime = sequelize.define("DeliveryTime", {
    title: {
        type: Sequelize.STRING,
        allowNull: false
    }
})
module.exports = DeliveryTime