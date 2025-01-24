const Sequelize = require("sequelize")
const sequelize = require("./index")
const Sport = sequelize.define("Sport", {
    title: {
        type: Sequelize.STRING
    },
    image: {
        type: Sequelize.STRING,
    },
    is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    }
}, {
    defaultScope: {
        attributes: {
            exclude: ['is_active']
        }
    }
})
module.exports = Sport