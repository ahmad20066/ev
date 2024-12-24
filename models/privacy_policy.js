const Sequelize = require("sequelize")
const sequelize = require("./index")
const PrivacyPolicy = sequelize.define("PrivacyPolicy", {
    content: {
        type: Sequelize.STRING,
        allowNull: false
    }
})
module.exports = PrivacyPolicy