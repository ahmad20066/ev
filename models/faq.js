const { DataTypes } = require("sequelize");
const sequelize = require("./index");

const FAQ = sequelize.define("FAQ", {
    question: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: "faqs",
});

module.exports = FAQ;
