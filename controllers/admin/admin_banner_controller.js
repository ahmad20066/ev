const Banner = require("../../models/banner");

exports.createBanner = async (req, res, next) => {
    try {
        const image = req.file.path

        if (!image) {
            return res.status(400).json({ message: "Image URL is required" });
        }

        const banner = await Banner.create({ image });
        res.status(201).json(banner);
    } catch (error) {
        next(error);
    }
};
exports.getAllBanners = async (req, res, next) => {
    try {
        const banners = await Banner.findAll();
        res.status(200).json(banners);
    } catch (error) {
        next(error);
    }
};
exports.deleteBanner = async (req, res, next) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findByPk(id);

        if (!banner) {
            return res.status(404).json({ message: "Banner not found" });
        }

        await banner.destroy();
        res.status(200).json({ message: "Banner deleted successfully" });
    } catch (error) {
        next(error);
    }
};

