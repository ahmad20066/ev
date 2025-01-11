const { DataTypes } = require("sequelize");
const sequelize = require("./index"); // Adjust the path based on your project structure
const User = require("./user");

const Notification = sequelize.define("Notification", {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    body: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    tableName: "notifications",
});
User.hasMany(Notification, { as: "notifications", foreignKey: "user_id" })
Notification.belongsTo(User, { as: "user", foreignKey: "user_id" })
module.exports = Notification;
