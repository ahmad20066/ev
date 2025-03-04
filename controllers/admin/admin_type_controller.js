const Type = require("../../models/meals/type");

exports.createType = async (req, res, next) => {
    try {
        const { title, title_ar } = req.body;

        if (!title || !title_ar) {
            return res.status(400).json({ message: "Title is required", message_ar: "العنوان مطلوب" });
        }

        const newType = await Type.create({ title, title_ar });

        res.status(201).json({ message: "Type created successfully", message_ar: "تم إنشاء النوع بنجاح", type: newType });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};

exports.getAllTypes = async (req, res, next) => {
    try {
        const types = await Type.findAll();
        res.status(200).json({ message: "Types retrieved successfully", message_ar: "تم استرجاع الأنواع بنجاح", types });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};

exports.getTypeById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const type = await Type.findByPk(id);

        if (!type) {
            return res.status(404).json({ message: "Type not found", message_ar: "لم يتم العثور على النوع" });
        }

        res.status(200).json({ message: "Type retrieved successfully", message_ar: "تم استرجاع النوع بنجاح", type });
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
            return res.status(404).json({ message: "Type not found", message_ar: "لم يتم العثور على النوع" });
        }

        type.title = title || type.title;
        type.title_ar = title_ar || type.title_ar;
        await type.save();

        res.status(200).json({ message: "Type updated successfully", message_ar: "تم تحديث النوع بنجاح", type });
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
            return res.status(404).json({ message: "Type not found", message_ar: "لم يتم العثور على النوع" });
        }

        await type.destroy();

        res.status(200).json({ message: "Type deleted successfully", message_ar: "تم حذف النوع بنجاح" });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
