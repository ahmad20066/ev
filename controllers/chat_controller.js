const Chat = require("../models/chat/chat");
const ChatRequest = require("../models/chat/chat_request");
const Message = require("../models/chat/message");
const User = require("../models/user");
exports.sendMessageUser = async (req, res, next) => {
    const t = await Chat.sequelize.transaction();
    try {
        const { content } = req.body;
        const file = req.file?.path;
        const user_id = req.userId;

        if (!content && !file) {
            const err = new Error("Message must contain text or a file.");
            err.statusCode = 400;
            throw err;
        }


        let chat = await Chat.findOne({ where: { user_id }, lock: t.LOCK.UPDATE, transaction: t });
        if (!chat) {
            chat = await Chat.create({ user_id }, { transaction: t });
            await ChatRequest.create({ user_id, chat_id: chat.id }, { transaction: t });
        }


        const message = await Message.create(
            { chat_id: chat.id, sender_id: user_id, content, file },
            { transaction: t }
        );

        await t.commit();


        const fullMessage = await Message.findByPk(message.id, {
            include: [{ model: User, as: "sender", attributes: ["id", "name", "role"] }],
        });

        req.io.to(`chat_${chat.id}`).emit("new_message", fullMessage);


        if (!chat.coach_id) {
            const fullChat = await Chat.findByPk(chat.id, {
                include: [
                    { model: User, as: "user", attributes: ["id", "name", "email"] },
                    { model: Message, as: "messages", separate: true, limit: 1, order: [["createdAt", "DESC"]] }
                ],
            });

            const lastMessage = fullChat.messages[0] || null;
            const payload = { ...fullChat.toJSON(), lastMessage };
            delete payload.messages;

            req.io.to("coaches").emit("new_chat_needs_coach", payload);
        } else {
            req.io.to(`coach_${chat.coach_id}`).emit("new_message_alert", { chat_id: chat.id });
        }

        return res.status(201).json({ message: fullMessage });
    } catch (err) {
        await t.rollback();
        next(err);
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
            chat = new Chat({
                user_id,
                coach_id
            })
            await chat.save()
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
        const fullMessage = await Message.findOne({
            where: { id: message.id },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name', 'role'],
                },
            ],
        });
        console.log(message)
        req.io.to(`chat_${chat.id}`).emit("new_message", fullMessage);

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
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Message,
                    as: 'messages',
                    attributes: ['id', 'content', 'file', 'createdAt'],
                    separate: true,
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                },
            ],
        });

        const formattedChats = await Promise.all(chats.map(async (chat) => {
            const lastMessage = chat.dataValues.messages[0] || null;

            const unreadCount = await Message.count({
                where: {
                    chat_id: chat.id,
                    sender_id: chat.user_id,
                    is_read: false
                }
            });

            return {
                ...chat.dataValues,
                lastMessage: lastMessage?.dataValues || null,
                hasUnreadMessages: unreadCount > 0,
                unreadCount
            };
        }));

        res.status(200).json({ chats: formattedChats });
    } catch (error) {
        next(error);
    }
};
exports.markMessagesAsRead = async (req, res, next) => {
    try {
        const { chat_id } = req.body;
        const coach_id = req.userId;

        const chat = await Chat.findOne({ where: { id: chat_id, coach_id } });

        if (!chat) {
            return res.status(404).json({ message: "Chat not found or not assigned to this coach." });
        }

        await Message.update(
            { is_read: true },
            {
                where: {
                    chat_id,
                    sender_id: chat.user_id,
                    is_read: false
                }
            }
        );

        res.status(200).json({ message: "Messages marked as read." });
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
                    attributes: ['id', 'name', 'email'],
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

exports.getOpenRequests = async (req, res, next) => {
    try {
        const requests = await ChatRequest.findAll({
            include: [
                { model: User, as: "user", attributes: ["id", "name", "email"] },
                {
                    model: Chat,
                    as: "chat",
                    include: [
                        {
                            model: Message,
                            as: "messages",
                            separate: true,
                            limit: 1,
                            order: [["createdAt", "DESC"]],
                            attributes: ["id", "content", "file", "createdAt"],
                        },
                    ],
                },
            ],
            order: [["createdAt", "ASC"]],
        });

        res.status(200).json(requests);
    } catch (err) {
        next(err);
    }
};
exports.acceptRequest = async (req, res, next) => {
    const coach_id = req.userId;
    const request_id = req.query.request_id;

    const t = await sequelize.transaction();
    try {
        const request = await ChatRequest.findByPk(request_id, { transaction: t });
        if (!request) {
            await t.rollback();
            return res.status(404).json({ message: "Request not found" });
        }

        const chat = await Chat.findByPk(request.chat_id, { transaction: t });
        if (chat.coach_id && chat.coach_id !== coach_id) {
            await t.rollback();
            return res.status(409).json({ message: "Another coach already claimed this chat." });
        }

        chat.coach_id = coach_id;
        await chat.save({ transaction: t });
        await request.destroy({ transaction: t });
        await t.commit();

        const fullChat = await Chat.findByPk(chat.id, {
            include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
        });



        res.status(200).json({
            Message: "Chat Accepted"
        });
    } catch (err) {
        await t.rollback();
        next(err);
    }
};
