
const Exercise = require('../../models/fitness/exercise');

exports.createExercise = async (req, res, next) => {
    try {
        const { name, description, duration } = req.body;
        const image_url = req.files.image ? `/uploads/images/${req.files.image[0].filename}` : null;
        const target_muscles_image = req.files.target_muscles_image ? `/uploads/images/${req.files.target_muscles_image[0].filename}` : null;
        const video_url = req.files.video ? `/uploads/images/${req.files.video[0].filename}` : null;

        const exercise = await Exercise.create({
            name,
            description,
            duration,
            image_url,
            target_muscles_image,
            video_url
        });

        res.status(201).json({ message: 'Exercise created successfully', exercise });
    } catch (error) {
        next(error);
    }
};

exports.updateExercise = async (req, res, next) => {
    try {
        const exercise = await Exercise.findByPk(req.params.id);
        if (!exercise) return res.status(404).json({ message: 'Exercise not found' });

        const { name, description, duration } = req.body;
        exercise.name = name || exercise.name;
        exercise.description = description || exercise.description;
        exercise.duration = duration || exercise.duration;

        if (req.files.image) {
            exercise.image_url = `/uploads/images/${req.files.image[0].filename}`;
        }
        if (req.files.target_muscles_image) {
            exercise.target_muscles_image = `/uploads/images/${req.files.target_muscles_image[0].filename}`;
        }
        if (req.files.video) {
            exercise.video_url = `/uploads/images/${req.files.video[0].filename}`;
        }

        await exercise.save();
        res.status(200).json({ message: 'Exercise updated successfully', exercise });
    } catch (error) {
        next(error);
    }
};
exports.getExercises = async (req, res, next) => {
    try {
        const exercises = await Exercise.findAll();

        res.status(200).json(exercises);
    } catch (error) {
        next(error);
    }
};
exports.getExercise = async (req, res, next) => {
    try {
        const { id } = req.params
        const exercise = await Exercise.findByPk(id);
        if (!exercise) {
            const error = new Error("Exercise not found")
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(exercise);
    } catch (error) {
        next(error);
    }
};
exports.deleteExercise = async (req, res, next) => {
    try {
        const exercise = await Exercise.findByPk(req.params.id);
        if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
        await exercise.destroy();
        res.status(200).json({ message: 'Exercise deleted successfully' });
    } catch (error) {
        next(error);
    }
};
