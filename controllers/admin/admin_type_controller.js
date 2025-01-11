const Type = require("../../models/meals/type");

exports.createType = async (req, res, next) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const newType = await Type.create({ title });

        res.status(201).json(newType);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.getAllTypes = async (req, res, next) => {
    try {
        const types = await Type.findAll();
        res.status(200).json(types);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.getTypeById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Fetch the type
        const type = await Type.findByPk(id);

        if (!type) {
            return res.status(404).json({ message: "Type not found" });
        }

        res.status(200).json(type);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.updateType = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        // Validate the request body
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        // Find the type by ID
        const type = await Type.findByPk(id);

        if (!type) {
            return res.status(404).json({ message: "Type not found" });
        }

        // Update the type
        type.title = title;
        await type.save();

        res.status(200).json(type);
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.deleteType = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the type by ID
        const type = await Type.findByPk(id);

        if (!type) {
            return res.status(404).json({ message: "Type not found" });
        }

        // Delete the type
        await type.destroy();

        res.status(200).json({ message: "Type deleted successfully" });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
