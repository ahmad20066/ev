const ActivityLevel = require('../models/activity_level')
exports.getActivityLevels = (req, res, next) => {
    ActivityLevel.findAll().then(result => res.status(200).json(result)).catch(e => {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e)
    })
}
exports.createActivityLevel = async (req, res, next) => {
    const { level_name, description } = req.body;

    try {
        const newActivityLevel = await ActivityLevel.create({
            level_name,
            description
        });
        res.status(201).json({
            message: 'Activity level created successfully!',
            activityLevel: newActivityLevel
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
exports.getActivityLevelById = async (req, res, next) => {
    const { activityLevelId } = req.params;

    try {
        const activityLevel = await ActivityLevel.findByPk(activityLevelId);
        if (!activityLevel) {
            return res.status(404).json({ message: 'Activity level not found.' });
        }
        res.status(200).json(activityLevel);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
exports.updateActivityLevel = async (req, res, next) => {
    const { activityLevelId } = req.params;
    const { level_name, description } = req.body;

    try {
        const activityLevel = await ActivityLevel.findByPk(activityLevelId);
        if (!activityLevel) {
            return res.status(404).json({ message: 'Activity level not found.' });
        }

        activityLevel.level_name = level_name;
        activityLevel.description = description;
        await activityLevel.save();

        res.status(200).json({
            message: 'Activity level updated successfully!',
            activityLevel
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
exports.deleteActivityLevel = async (req, res, next) => {
    const { activityLevelId } = req.params;

    try {
        const activityLevel = await ActivityLevel.findByPk(activityLevelId);
        if (!activityLevel) {
            return res.status(404).json({ message: 'Activity level not found.' });
        }

        await activityLevel.destroy();
        res.status(200).json({ message: 'Activity level deleted successfully!' });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
