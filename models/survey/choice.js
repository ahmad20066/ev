const Sequelize = require("sequelize");
const sequelize = require("../index");
const Question = require("./question");

const Choice = sequelize.define("Choice", {
    text: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Question,
            key: "id",
        },
    },
});

module.exports = Choice;
