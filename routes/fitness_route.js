const express = require("express");
const { body, query, validationResult } = require("express-validator");
const router = express.Router();
const controller = require("../controllers/user/fitness_controller")
const hasSubscription = require("../middlewares/hasSubscription")
// router.post("/group-workout", controller.createGroupWorkout)
router.get(
    "/workouts",
    hasSubscription,
    query("date")
        .optional()
        .isISO8601()
        .withMessage("Date must be in a valid ISO 8601 format (YYYY-MM-DD)"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            next(error);
        }
        controller.getWorkoutsByDate(req, res, next);
    }
);
router.post("/subscribe", [
    body("package_id").isNumeric().withMessage("Please Enter a valid package"),
    body("pricing_id").isNumeric().withMessage("Please Enter a valid pricing"),
],
    (req, res, next) => {
        const errors = validationResult(req);
        console.log(errors)
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            next(error);
        }
        controller.subscribeToPackage(req, res, next);
    })
router.post("/exercise-done", hasSubscription, [
    body("exercise_id").isInt().withMessage("Invalid exercise id"),
], controller.markExerciseDone)
router.post("/join-workout", hasSubscription, [
    body("workout_id").isInt().withMessage("Invalid workout id"),
], controller.joinWorkout)
router.post("/workout-done", hasSubscription, [
    body("workout_id").isInt().withMessage("Invalid workout id"),
], controller.markWorkoutDone)
module.exports = router;