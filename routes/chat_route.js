const express = require("express")
const router = express.Router();
const imageMiddleWare = require('../middlewares/multer');
const chatController = require("../controllers/chat_controller")
const isCoach = require("../middlewares/isCoach")
router.post("/message", imageMiddleWare.uploadSingleImage("file"), chatController.sendMessageUser)
// router.get("/messages", chatController.getMessages)
router.get("/messages", isCoach, chatController.getChatsUser)

module.exports = router;