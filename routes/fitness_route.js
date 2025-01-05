const express = require("express");
const { body, query, validationResult } = require("express-validator");
const router = express.Router();
const controller = require("../controllers/user/fitness_controller")
const hasSubscription = require("../middlewares/hasSubscription")
// router.post("/group-workout", controller.createGroupWorkout)
router.get(
    "/workouts",
    hasSubscription,

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
router.get("/workouts/:id", hasSubscription, controller.showWorkout)
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
router.post("/renew", controller.renewSubscription)
router.post("/exercise-done", hasSubscription, [
    body("exercise_id").isInt().withMessage("Invalid exercise id"),
], controller.markExerciseDone)
router.post("/join-workout", hasSubscription, [
    body("workout_id").isInt().withMessage("Invalid workout id"),
], controller.joinWorkout)
router.post("/workout-done", hasSubscription, [
    body("workout_id").isInt().withMessage("Invalid workout id"),
], controller.markWorkoutDone)

router.post("/survey-answer", controller.submitAnswers)
router.get("/survey", controller.getSurvey)
router.get("/leader-board", controller.exerciseLeaderBoard)
router.post("/feedback", controller.rateWorkout)
router.get("/exercise/:id", controller.getExercise),
    router.get("/packages", controller.getAllPackages),
    router.get("/package-workouts", controller.getPackageWorkouts),
    router.get("/package-workouts/:id", controller.showPackageWorkout),
    module.exports = router;