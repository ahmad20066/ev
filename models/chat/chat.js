const { DataTypes } = require('sequelize');
const sequelize = require("../index")

const Chat = sequelize.define('Chat', {

    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: "users",
            key: 'id',
        },
    },
    coach_id: {
        type: DataTypes.INTEGER,
        references: {
            model: "users",
            key: 'id',
        },
    },
});



module.exports = Chat;