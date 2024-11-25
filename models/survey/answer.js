const Sequelize = require("sequelize")
const sequelize = require("../index")
const Question = require("./question")
const User = require("../user")
const Answer = sequelize.define("Answer", {
    answer: {
        type: Sequelize.STRING,
        allowNull: false
    },
    qustion_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Question,
            key: "id"
        }
    },
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: User,
            key: "id",
        },
        allowNull: false,
    },
})
module.exports = Answer