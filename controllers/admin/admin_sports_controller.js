const Sport = require("../../models/sport");

exports.createSport = async (req, res, next) => {
    try {
        const { title } = req.body;
        const image = req.file.path;
        const sport = await Sport.create({ title, image });
        res.status(201).json({ message: "Sport created successfully", sport });
    } catch (error) {
        next(error);
    }
};

exports.getAllSports = async (req, res, next) => {
    try {
        const sports = await Sport.findAll();
        res.status(200).json({ sports });
    } catch (error) {
        next(error);
    }
};
exports.updateSport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const image = req.file?.path;

        const sport = await Sport.findByPk(id);
        if (!sport) {
            return res.status(404).json({ message: "Sport not found" });
        }

        sport.title = title || sport.title;
        sport.image = image || sport.image
        await sport.save();

        res.status(200).json({ message: "Sport updated successfully", sport });
    } catch (error) {
        next(error);
    }
};

exports.deleteSport = async (req, res, next) => {
    try {
        const { id } = req.params;

        const sport = await Sport.findByPk(id);
        if (!sport) {
            return res.status(404).json({ message: "Sport not found" });
        }

        await sport.destroy();
        res.status(200).json({ message: "Sport deleted successfully" });
    } catch (error) {
        next(error);
    }
};
