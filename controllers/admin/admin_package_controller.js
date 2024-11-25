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
