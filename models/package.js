const Sequelize = require("sequelize");
const sequelize = require("./index");

const Package = sequelize.define("Package", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    type: {
        type: Sequelize.ENUM("group", "personalized"),
        allowNull: false
    }
}, {
    tableName: "packages",
    timestamps: true,
});

module.exports = Package;
