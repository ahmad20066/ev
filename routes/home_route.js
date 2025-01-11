const express = require("express")
const router = express.Router()
const controller = require("../controllers/user/home_controller")
router.get("/banner", controller.getBanner)
router.get("/plans", controller.getHomePlans)
router.get("/packages", controller.getHomePackages)
router.get("/home-workouts", controller.getHomeWorkouts)
router.get("/workout/:id", controller.getWorkoutById)

module.exports = router