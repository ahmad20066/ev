const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const controller = require("../controllers/user/diet_controller")
const isAuth = require("../middlewares/isAuth")
router.get("/meal-plans", isAuth, controller.getMealPlans)
router.get("/subscriptions", isAuth, controller.getMealSubscriptions)
router.post("/subscribe", isAuth, [
    body("meal_plan_id")
        .notEmpty()
        .withMessage("Meal Plan ID is required.")
        .isInt({ gt: 0 })
        .withMessage("Meal Plan ID must be a positive integer."),
    body("delivery_time_id")
        .notEmpty()
        .withMessage("Delivery Time ID is required.")
        .isInt({ gt: 0 })
        .withMessage("Delivery Time ID must be a positive integer."),
    body("address_label")
        .notEmpty()
        .withMessage("Address label is required.")
        .isLength({ max: 50 })
        .withMessage("Address label must not exceed 50 characters."),
    body("street")
        .notEmpty()
        .withMessage("Street is required.")
        .isLength({ max: 100 })
        .withMessage("Street must not exceed 100 characters."),
    body("city")
        .notEmpty()
        .withMessage("City is required.")
        .isLength({ max: 50 })
        .withMessage("City must not exceed 50 characters."),
    body("building")
        .notEmpty()
        .withMessage("Building is required.")
        .isLength({ max: 50 })
        .withMessage("Building must not exceed 50 characters."),
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
router.get("/delivery-time", controller.getAllDeliveryTimes);
router.get("/meal/:id", controller.getMealById)
module.exports = router