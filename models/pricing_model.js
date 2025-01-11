const sequelize = require("../models/index");
const Sequelize = require("sequelize")
const PricingModel = sequelize.define("Pricing", {
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    price: {
        type: Sequelize.DOUBLE,
        allowNull: false
    },
    number_of_days: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    package_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "packages",
            key: "id"
        }
    }
})
module.exports = PricingModel