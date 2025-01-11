const { DataTypes } = require("sequelize")
const sequelize = require("../index");
const Chat = require("./chat");
const User = require("../user");
const Message = sequelize.define('Message', {
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    sender_id: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id',
        },
    },
    file: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    chat_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Chat,
            key: 'id',
        },
    },
});
module.exports = Message