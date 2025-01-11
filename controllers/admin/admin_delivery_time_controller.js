const DeliveryTime = require("../../models/meals/delivery_time");

exports.createDeliveryTime = async (req, res, next) => {
    try {
        const { title } = req.body;


        if (!title) {
            return res.status(400).json({ error: "Title is required." });
        }

        const deliveryTime = await DeliveryTime.create({ title });

        res.status(201).json({
            message: "Delivery time created successfully.",
            deliveryTime,
        });
    } catch (error) {
        next(error);
    }
};
exports.getAllDeliveryTimes = async (req, res, next) => {
    try {
        const deliveryTimes = await DeliveryTime.findAll();

        res.status(200).json(deliveryTimes);
    } catch (error) {
        next(error);
    }
};
exports.updateDeliveryTime = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        // Validate input
        if (!title) {
            return res.status(400).json({ error: "Title is required for update." });
        }

        const deliveryTime = await DeliveryTime.findByPk(id);

        if (!deliveryTime) {
            return res.status(404).json({ error: "Delivery time not found." });
        }

        deliveryTime.title = title;
        await deliveryTime.save();

        res.status(200).json({
            message: "Delivery time updated successfully.",
            deliveryTime,
        });
    } catch (error) {
        next(error);
    }
};
exports.deleteDeliveryTime = async (req, res, next) => {
    try {
        const { id } = req.params;

        const deliveryTime = await DeliveryTime.findByPk(id);

        if (!deliveryTime) {
            return res.status(404).json({ error: "Delivery time not found." });
        }

        await deliveryTime.destroy();

        res.status(200).json({
            message: "Delivery time deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};
