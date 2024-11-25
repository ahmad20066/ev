const express = require('express');
const router = express.Router();
const controller = require("../controllers/admin/admin_stats_controller")
const { body, query, validationResult } = require("express-validator");
router.get("/activeFitnessSubscriptions", [
    query("type")
        .isIn(["group", "personalized"])
        .withMessage("Please enter a valid type: 'group' or 'personalized'")
],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            next(error);
        }
        controller.activeSubscriptionsFitness(req, res, next);
    },);
router.get("/activeMealsSubscriptions", controller.activeSubscriptionsMeals)
router.get("/new-signups", controller.newSignUps)
router.get('/completion-rate', controller.workoutCompletionRate)
router.get("", controller.getStats)
module.exports = router;