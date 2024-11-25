const Sequelize = require("sequelize")
const sequelize = require("../index")
const Survey = require("./survey")
const Question = sequelize.define("Question", {
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    image: {
        type: Sequelize.STRING,
        allowNull: true
    },
    survey_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Survey,
            key: "id"
        }
    }
})
module.exports = Question
