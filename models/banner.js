const Sequelize = require("sequelize")
const sequelize = require("./index")
const Banner = sequelize.define("Banner", {
    image: {
        type: Sequelize.STRING,
        allowNull: false
    },
})
module.exports = Banner