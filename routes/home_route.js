const express = require("express")
const router = express.Router()
const controller = require("../controllers/user/home_controller")
router.get("/banner", controller.getBanner)
module.exports = router