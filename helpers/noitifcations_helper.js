const { Sequelize } = require("sequelize");
const admin = require("../config/firebase_config");
const Notification = require("../models/noitifcation");
const User = require("../models/user");

const sendNotification = async (userId, token, title, body, data = {}) => {
    const message = {
        notification: {
            title: title,
            body: body,
        },
        data: data,
        token: token,
    };

    try {
        const response = await admin.messaging().send(message);
        await Notification.create({
            user_id: userId,
            title,
            body,
        });
        console.log("Notification sent successfully:", response);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};
const sendPublicNotification = async (title, body, data = {}) => {
    try {
        const users = await User.findAll({
            where: { fcm_token: { [Sequelize.Op.ne]: null } },
            attributes: ["id", "fcm_token"],
        });

        if (users.length === 0) {
            console.log("No users with FCM tokens found.");
            return;
        }

        const notificationPromises = users.map((user) =>
            admin.messaging().send({
                notification: {
                    title: title,
                    body: body,
                },
                data: data,
                token: user.fcm_token,
            })
        );

        const responses = await Promise.all(notificationPromises);

        return true
    } catch (error) {
        throw error
    }
};
module.exports = { sendNotification, sendPublicNotification };
