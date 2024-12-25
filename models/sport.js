const Sequelize = require("sequelize")
const sequelize = require("./index")
const Sport = sequelize.define("Sport", {
    title: {
        type: Sequelize.STRING
    }
})
module.exports = Sport