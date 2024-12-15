const express = require('express');
const router = express.Router();
const controller = require("../controllers/kitchen/orders_controller");
const { body, validationResult } = require('express-validator');
router.get("/orders", controller.getOrders)
router.post("/order-status", [
    body("status").isIn(['pending', 'done']).withMessage("Please enter a valid status")
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(errors.array()[0].msg);
        error.statusCode = 422;
        next(error);
    }
    controller.changeOrderStatus(req, res, next)
})
module.exports = router