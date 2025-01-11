const Sequelize = require("sequelize")
const sequelize = require("../index")
const Address = sequelize.define("Address", {
    street: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    city: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    address_label: {
        type: Sequelize.STRING,
        allowNull: true
    },
    building: {
        type: Sequelize.STRING,
        allowNull: false
    },
    postal_code: {
        type: Sequelize.STRING,
        allowNull: false
    },
    state: {
        type: Sequelize.STRING,
        allowNull: false
    },
    delivery_notes: {
        type: Sequelize.STRING,
        allowNull: false
    }
});
module.exports = Address;
