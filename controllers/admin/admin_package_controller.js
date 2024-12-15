const Package = require("../../models/package");
const PricingModel = require("../../models/pricing_model");

exports.createPackage = async (req, res, next) => {
    try {
        const { name, description, prices, type } = req.body;


        const newPackage = await Package.create({ name, description, type });

        if (prices && prices.length > 0) {
            const pricingData = prices.map(price => ({
                ...price,
                package_id: newPackage.id
            }));

            await PricingModel.bulkCreate(pricingData);
        }

        res.status(201).json(newPackage);
    } catch (e) {
        e.statusCode = 500;
        next(e);
    }
};

exports.getAllPackages = async (req, res, next) => {
    try {
        const packages = await Package.findAll({
            include: [{
                model: PricingModel,
                as: "pricings"
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
            include: [{ model: PricingModel, as: "pricings" }]
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
        const { name, description, prices, type } = req.body;

        const package = await Package.findByPk(id);
        if (!package) {
            const err = new Error("Package not found");
            err.statusCode = 404;
            next(err);
            return;
        }

        await package.update({ name, description, type });

        if (prices && prices.length > 0) {
            await PricingModel.destroy({ where: { package_id: id } });

            const pricingData = prices.map(price => ({
                ...price,
                package_id: id
            }));
            await PricingModel.bulkCreate(pricingData);
        }

        res.status(200).json(package);
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

        await PricingModel.destroy({ where: { package_id: id } });
        await package.destroy();

        res.status(204).send();
    } catch (e) {
        e.statusCode = 500;
        next(e);
    }
};
exports.createPricing = async (req, res, next) => {
    try {
        const { title, price, number_of_days, package_id } = req.body;

        // Validate input
        if (!title || !price || !number_of_days) {
            return res.status(400).json({ message: "All fields (title, price, number_of_days) are required." });
        }

        const pricing = await PricingModel.create({ title, price, number_of_days, package_id });
        res.status(201).json({ message: "Pricing created successfully.", pricing });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create pricing.", error: error.message });
    }
};
exports.getAllPricings = async (req, res, next) => {
    try {
        const pricings = await PricingModel.findAll();
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

        if (!pricing) {
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
        const { title, price, number_of_days, package_id } = req.body;

        const pricing = await PricingModel.findByPk(id);

        if (!pricing) {
            return res.status(404).json({ message: "Pricing not found." });
        }

        const updatedPricing = await pricing.update({ title, price, number_of_days, package_id });
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

        await pricing.destroy();
        res.status(200).json({ message: "Pricing deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete pricing.", error: error.message });
    }
};

