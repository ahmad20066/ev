const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const controller = require("../controllers/user/diet_controller")
const isAuth = require("../middlewares/isAuth")
router.get("/meal-plans", isAuth, controller.getMealPlans)
router.get("/subscriptions", isAuth, controller.getMealSubscriptions)
router.post("/subscribe", isAuth, [
    body('type')
        .isIn(['weekly', 'monthly'])
        .withMessage("Invalid type. please enter a valid type"),
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(errors.array()[0].msg)
        error.statusCode = 422;
        next(error)
    }
    controller.subscribeToMealPlan(req, res, next);
}
)
router.get("/week-meals", isAuth, controller.getMealsForWeek);
router.get("/my-selections", isAuth, controller.getMealSelections)
router.post("/change-selection", isAuth, controller.changeSelection)

module.exports = router