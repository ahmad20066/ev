const Sequelize = require("sequelize")
const sequelize = require("../index")
const Chat = require("./chat")
const ChatRequest = sequelize.define("ChatRequest", {
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: 'id',
        },
    },
    chat_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Chat,
            key: 'id',
        },
    },
})
module.exports = ChatRequest