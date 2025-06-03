const Package = require("../../models/package");
const PricingModel = require("../../models/pricing_model");
const Coupon = require('../../models/fitness/coupon');

exports.createPackage = async (req, res, next) => {
    try {
        const { name, name_ar, description, description_ar, prices, type } = req.body;


        const newPackage = await Package.create({ name, name_ar, description_ar, description, type });

        if (prices && prices.length > 0) {
            const pricingData = prices.map(price => ({
                ...price,
                package_id: newPackage.id
            }));

            await PricingModel.bulkCreate(pricingData);
        }

        res.status(201).json({ message: "Package created succesfully", package: newPackage });
    } catch (e) {
        e.statusCode = 500;
        next(e);
    }
};

exports.getAllPackages = async (req, res, next) => {
    try {
        const type = req.query.type;
        const where = {
            is_active: true
        };
        if (type && !['group', 'personalized'].includes(type)) {
            const err = new Error("Invalid package type.");
            err.statusCode = 400;
            throw err;
        }
        if (type) {
            where.type = type;
        }
        const packages = await Package.findAll({
            where,
            include: [{
                model: PricingModel,
                as: "pricings",
                where: {
                    is_active: true
                },
                required: false
            }]
        });
        res.status(200).json(packages);
    } catch (e) {
        e.statusCode = 500;
        next(e);
    }
};

exports.getPackageById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const package = await Package.findByPk(id, {
            include: [{
                model: PricingModel,
                as: "pricings",
                where: {
                    is_active: true
                },
                required: false
            }]
        });

        if (!package) {
            const err = new Error("Package not found");
            err.statusCode = 404;
            next(err);
            return;
        }

        res.status(200).json(package);
    } catch (e) {
        e.statusCode = 500;
        next(e);
    }
};

exports.updatePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, name_ar, description_ar, description, prices, type } = req.body;

        const package = await Package.findByPk(id);
        if (!package) {
            const err = new Error("Package not found");
            err.statusCode = 404;
            next(err);
            return;
        }

        const updatedFields = {};
        if (name !== undefined) updatedFields.name = name;
        if (name_ar !== undefined) updatedFields.name_ar = name_ar;
        if (description !== undefined) updatedFields.description = description;
        if (description_ar !== undefined) updatedFields.description_ar = description_ar;
        if (type !== undefined) updatedFields.type = type;

        await package.update(updatedFields);

        if (prices && prices.length > 0) {
            await PricingModel.destroy({ where: { package_id: id } });

            const pricingData = prices.map(price => ({
                ...price,
                package_id: id
            }));
            await PricingModel.bulkCreate(pricingData);
        }

        res.status(200).json({ message: "Package updated successfully", package });
    } catch (e) {
        e.statusCode = 500;
        next(e);
    }
};


exports.deletePackage = async (req, res, next) => {
    try {
        const { id } = req.params;

        const package = await Package.findByPk(id);
        if (!package) {
            const err = new Error("Package not found");
            err.statusCode = 404;
            next(err);
            return;
        }

        await PricingModel.update({
            is_active: false
        }, { where: { package_id: id } });
        await package.update({ is_active: false });

        res.status(204).json({
            message: "Package deleted succesfully"
        });
    } catch (e) {
        e.statusCode = 500;
        next(e);
    }
};
exports.createPricing = async (req, res, next) => {
    try {
        const { title, title_ar, price, number_of_days, package_id } = req.body;

        if (!title || !title_ar || !price || !number_of_days) {
            return res.status(400).json({ message: "All fields (title, price, number_of_days) are required." });
        }

        const pricing = await PricingModel.create({ title, title_ar, price, number_of_days, package_id });
        res.status(201).json({ message: "Pricing created successfully.", pricing });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create pricing.", error: error.message });
    }
};
exports.getAllPricings = async (req, res, next) => {
    try {
        const pricings = await PricingModel.findAll({
            where: {
                is_active: true
            }
        });
        res.status(200).json({ message: "Pricings retrieved successfully.", pricings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve pricings.", error: error.message });
    }
};
exports.getPricingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pricing = await PricingModel.findByPk(id);

        if (!pricing || pricing.is_active === false) {
            return res.status(404).json({ message: "Pricing not found." });
        }

        res.status(200).json({ message: "Pricing retrieved successfully.", pricing });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve pricing.", error: error.message });
    }
};
exports.updatePricing = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, title_ar, price, number_of_days, package_id } = req.body;

        const pricing = await PricingModel.findByPk(id);

        if (!pricing) {
            return res.status(404).json({ message: "Pricing not found." });
        }

        const updatedPricing = await pricing.update({ title, title_ar, price, number_of_days, package_id });
        res.status(200).json({ message: "Pricing updated successfully.", updatedPricing });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update pricing.", error: error.message });
    }
};
exports.deletePricing = async (req, res, next) => {
    try {
        const { id } = req.params;

        const pricing = await PricingModel.findByPk(id);

        if (!pricing) {
            return res.status(404).json({ message: "Pricing not found." });
        }

        await pricing.update({ is_active: false });
        res.status(200).json({ message: "Pricing deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete pricing.", error: error.message });
    }
};



