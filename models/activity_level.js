const Sequelize = require("sequelize");
const sequelize = require("./index");

const ActivityLevel = sequelize.define("ActivityLevel", {

    level_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
});

module.exports = ActivityLevel;
