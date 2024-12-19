const Sequelize = require("sequelize")
const sequelize = require("../index")
const Subscription = require("../subscription")
const Renewal = sequelize.define("Renewal", {
    subscription_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Subscription,
            key: "id"
        }
    }
})
module.exports = Renewal