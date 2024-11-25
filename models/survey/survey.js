const Sequelize = require("sequelize")
const sequelize = require("../index")
const Package = require("../package")
const Survey = sequelize.define("Survey", {
    title: {
        type: Sequelize.STRING,

    },
    package_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Package,
            key: "id"
        }
    }
})
module.exports = Survey