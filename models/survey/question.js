const Sequelize = require("sequelize");
const sequelize = require("../index");
const Survey = require("./survey");

const Question = sequelize.define("Question", {
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    image: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    type: {
        type: Sequelize.ENUM("normal", "choice"),
        allowNull: false,
        defaultValue: "normal",
    },
    survey_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Survey,
            key: "id",
        },
    },
});

module.exports = Question;
