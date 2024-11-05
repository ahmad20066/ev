const express = require("express")
const router = express.Router();
const imageMiddleWare = require('../middlewares/multer');
const chatController = require("../controllers/chat_controller")
const isCoach = require("../middlewares/isCoach")
router.post("/message", imageMiddleWare.uploadSingleImage("file"), chatController.sendMessage)
router.get("/messages", chatController.getMessages)
router.get("/chats", isCoach, chatController.getChatsCoach)
module.exports = router;