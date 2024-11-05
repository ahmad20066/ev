const express = require("express");
const { body, query, validationResult } = require("express-validator");
const router = express.Router();
const controller = require("../controllers/user/fitness_controller")
// router.post("/group-workout", controller.createGroupWorkout)
router.get(
    "/workouts",
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
router.post("/subscribe", controller.subscribeToPackage)
router.post("/exercise-done", [
    body("exercise_id").isInt().withMessage("Invalid exercise id"),
], controller.markExerciseDone)
router.post("/join-workout", [
    body("workout_id").isInt().withMessage("Invalid workout id"),
], controller.joinWorkout)
module.exports = router;