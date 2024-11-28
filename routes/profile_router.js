const express = require("express")
const router = express.Router()
const controller = require("../controllers/user/profile_controller")
router.post("/cancel-subscription", controller.cancelSubscription)
router.get("/my-subscriptions", controller.getSubscriptions)
router.get("/current-subscription", controller.getSubscription)
router.get("/me", controller.getProfile)
module.exports = router