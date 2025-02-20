const Type = require("../../models/meals/type");

exports.createType = async (req, res, next) => {
    try {
        const { title, title_ar } = req.body;

        if (!title || !title_ar) {
            return res.status(400).json({ message: "Title is required" });
        }

        const newType = await Type.create({ title, title_ar });

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
        const { title, title_ar } = req.body;



        const type = await Type.findByPk(id);

        if (!type) {
            return res.status(404).json({ message: "Type not found" });
        }


        type.title = title || type.title;
        type.title_ar = title_ar || type.title_ar;

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

        const type = await Type.findByPk(id);

        if (!type) {
            return res.status(404).json({ message: "Type not found" });
        }

        await type.destroy();

        res.status(200).json({ message: "Type deleted successfully" });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
