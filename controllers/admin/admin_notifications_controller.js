const { sendPublicNotification } = require("../../helpers/noitifcations_helper");

exports.sendPushNotification = async (req, res, next) => {
    try {
        const { title, body } = req.body;
        const result = await sendPublicNotification(title, body)
        console.log(result)
        res.status(200).json({
            message: "Notification sent successfully"
        })
    } catch (e) {
        next(e)
    }
}