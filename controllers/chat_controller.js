const Chat = require("../models/chat/chat");
const Message = require("../models/chat/message");
const User = require("../models/user");
exports.sendMessage = async (req, res, next) => {
    try {
        const { user_id, content } = req.body;
        const file = req.file?.path;
        const coach_id = req.userId;

        let chat = await Chat.findOne({
            where: { user_id, coach_id }
        });

        if (!chat) {
            chat = await Chat.create({ user_id, coach_id });
        }

        const message = await Message.create({
            content,
            sender_id: user_id,
            chat_id: chat.id,
            file: file
        });
        req.io.to(`chat_${chat.id}`).emit('new_message', message);
        res.status(201).json({ message });
    } catch (error) {
        next(error);
    }
};
exports.getMessages = async (req, res, next) => {
    try {
        const { chat_id } = req.query;

        const messages = await Message.findAll({
            where: { chat_id },
            attributes: {
                exclude: ['sender_id']
            },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'role'] },

            ],

            order: [['createdAt', 'ASC']]
        });

        res.status(200).json({ messages });
    } catch (error) {
        next(error);
    }
};
exports.getChatsCoach = async (req, res, next) => {
    try {
        const coach_id = req.userId;
        const chats = await Chat.findAll({
            where: {
                coach_id
            }
        })
        res.status(200).json(chats)
    } catch (e) {
        next(e)
    }
}