const Sequelize = require("sequelize")
const sequelize = require("../models/index")
const WeightRecord = sequelize.define("WeightRecord", {
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: "id"
        }
    },
    weight: {
        type: Sequelize.DOUBLE,
        allowNull: false
    }
})
module.exports = WeightRecord