const Sequelize = require("sequelize");
const sequelize = require("../index");
const Question = require("./question");
const Choice = require("./choice");
const User = require("../user");

const Answer = sequelize.define("Answer", {
    answer: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    choice_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: Choice,
            key: "id",
        },
    },
    question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Question,
            key: "id",
        },
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
    },
});

module.exports = Answer;
