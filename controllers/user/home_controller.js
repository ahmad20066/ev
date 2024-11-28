const Banner = require("../../models/banner");

exports.getBanner = async (req, res, next) => {
    try {
        const banners = await Banner.findAll();
        res.status(200).json(banners);
    } catch (error) {
        next(error);
    }
}