const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const controller = require("../controllers/auth_controller");
const isAuth = require('../middlewares/isAuth')

router.post(
    "/register",
    [
        body("name").notEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Please provide a valid email"),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters long"),
        body("phone").notEmpty().withMessage("Phone number is required"),
        body("phone").isNumeric().withMessage("Enter a valid phone number"),
        body("role").isIn(["consumer", "admin", "kitchen_staff", "coach"]).withMessage("Invalid role"),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            next(error);
        }
        controller.register(req, res, next);
    }
);
router.post(
    '/setup_profile',
    [
        body("age").isInt({ min: 1 }).withMessage("Please provide a valid age"),
        body("gender").notEmpty().withMessage("Gender is required"),
        body("height").optional().isFloat().withMessage("Height must be a number"),
        body("weight").optional().isFloat().withMessage("Weight must be a number"),
        body("activity_level").optional().isNumeric().withMessage("Activity level must be an id"),
        body("health_goal").optional().isNumeric().withMessage("Health goal must be an id"),
        body("dietary_preferences").optional().isString().withMessage("Dietary preferences must be a string"),
        body("fitness_level").optional().isString().withMessage("Fitness level must be a string"),
    ],
    isAuth,
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            next(error);
        }
        controller.setUpProfile(req, res, next);
    }
)

router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Please provide a valid email"),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            next(error);
        }
        controller.login(req, res, next);
    }
);

router.post(
    "/verify",
    [
        body("email").isEmail().withMessage("Please provide a valid email"),
        body("otp").isInt().withMessage("OTP must be a valid number"),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            next(error);
        }
        controller.verifyOtp(req, res, next);
    }
);

router.post(
    "/otp",
    [
        body("email").isEmail().withMessage("Please provide a valid email"),
    ],
    controller.sendOtp
);

router.post(
    "/set-weight",
    isAuth,
    [
        body("weight").isNumeric().withMessage("Please Enter a valid weight")
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            next(error);
        }
        controller.setNewWeight(req, res, next);
    }
)
router.post("/delete-account", isAuth, controller.deleteAccount)

router.post("/forgot-password", controller.forgotPassword)
router.post("/reset-password", controller.resetPassword)
router.get("/sports", controller.getAllSports)
module.exports = router;
