const Sequelize = require("sequelize")
const sequelize = require("../index")
const ChatRequest = sequelize.define("ChatRequest", {
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: 'id',
        },
    },
})
module.exports = ChatRequest