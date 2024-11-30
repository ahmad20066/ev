const Chat = require("../models/chat/chat");
const Message = require("../models/chat/message");
const User = require("../models/user");
exports.sendMessageUser = async (req, res, next) => {
    try {
        const { content } = req.body;
        const file = req.file?.path;
        const user_id = req.userId;

        let chat = await Chat.findOne({ where: { user_id } });

        if (!chat) {
            chat = await Chat.create({ user_id });
        }

        const message = await Message.create({
            chat_id: chat.id,
            sender_id: user_id,
            content,
            file,
        });

        req.io.to(`chat_${chat.id}`).emit("new_message", message);

        res.status(201).json({ message });
    } catch (error) {
        next(error);
    }
};

exports.sendMessageCoach = async (req, res, next) => {
    try {
        const { content, user_id } = req.body;
        const file = req.file?.path;
        const coach_id = req.userId;

        if (!user_id) {
            const error = new Error("user_id is required to send a message as a coach.");
            error.statusCode = 400;
            throw error;
        }

        let chat = await Chat.findOne({ where: { user_id } });

        if (!chat) {
            const error = new Error("No chat found for this user.");
            error.statusCode = 404;
            throw error;
        }

        if (!chat.coach_id) {
            chat.coach_id = coach_id;
            await chat.save();
        } else if (chat.coach_id !== coach_id) {
            const error = new Error("This chat is already assigned to another coach.");
            error.statusCode = 403;
            throw error;
        }

        const message = await Message.create({
            chat_id: chat.id,
            sender_id: coach_id,
            content,
            file,
        });

        req.io.to(`chat_${chat.id}`).emit("new_message", message);

        res.status(201).json({ message });
    } catch (error) {
        next(error);
    }
};

exports.getMessages = async (req, res, next) => {
    try {
        const { chat_id } = req.query;

        if (!chat_id) {
            const error = new Error("chat_id is required.");
            error.statusCode = 400;
            throw error;
        }

        const messages = await Message.findAll({
            where: { chat_id },
            attributes: {
                exclude: ['sender_id'],
            },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'role'] },
            ],
            order: [['createdAt', 'ASC']],
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
            where: { coach_id },
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            ],
        });

        res.status(200).json({ chats });
    } catch (error) {
        next(error);
    }
};

exports.getChatsUser = async (req, res, next) => {
    try {
        const user_id = req.userId;

        const chat = await Chat.findOne({
            where: { user_id },
            include: [
                {
                    model: Message,
                    as: 'messages',
                    attributes: ['id', 'content', 'sender_id', 'createdAt'],
                    order: [['createdAt', 'ASC']],
                },
                {
                    model: User,
                    as: 'coach',
                    attributes: ['id', 'name', 'email'], // Include coach details
                },
            ],
        });

        if (!chat) {
            return res.status(404).json({ message: "No chat found for this user." });
        }

        res.status(200).json(chat);
    } catch (error) {
        next(error);
    }
};
