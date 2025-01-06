
const Exercise = require('../../models/fitness/exercise');

exports.createExercise = async (req, res, next) => {
    try {
        const { name, description, duration, notes } = req.body;

        // Process multiple uploaded images for `image_urls`
        const image_urls = req.files.images
            ? req.files.images.map((file) => file.path)
            : [];
        console.log(req.files);
        // Handle single files for target muscles image and video
        const target_muscles_image = req.files.target_muscles_image
            ? req.files.target_muscles_image[0].path
            : null;
        const video_url = req.files.video
            ? req.files.video[0].path
            : null;

        // Create exercise and save JSON string for `image_urls`
        const exercise = await Exercise.create({
            name,
            description,
            duration,
            image_urls: JSON.stringify(image_urls), // Convert array to JSON string
            target_muscles_image,
            video_url,
            notes: notes, // Ensure notes is stored as JSON string
        });

        res.status(201).json({
            message: 'Exercise created successfully',
            exercise,
        });
    } catch (error) {
        next(error);
    }
};
exports.updateExercise = async (req, res, next) => {
    try {
        const { id } = req.params; // Get exercise ID from route params
        const { name, description, duration, notes } = req.body;

        // Find the exercise by ID
        const exercise = await Exercise.findByPk(id);

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // Process multiple uploaded images for `image_urls`
        const image_urls = req.files.images
            ? req.files.images.map((file) => file.path)
            : JSON.parse(exercise.image_urls); // Retain existing images if none are uploaded

        // Handle single files for target muscles image and video
        const target_muscles_image = req.files.target_muscles_image
            ? req.files.target_muscles_image[0].path
            : exercise.target_muscles_image; // Retain existing image if none is uploaded

        const video_url = req.files.video
            ? req.files.video[0].path
            : exercise.video_url; // Retain existing video if none is uploaded

        // Update exercise and save JSON string for `image_urls`
        exercise.name = name || exercise.name;
        exercise.description = description || exercise.description;
        exercise.duration = duration || exercise.duration;
        exercise.image_urls = JSON.stringify(image_urls); // Convert array to JSON string
        exercise.target_muscles_image = target_muscles_image;
        exercise.video_url = video_url;
        exercise.notes = notes || exercise.notes;

        // Save the updated exercise
        await exercise.save();

        res.status(200).json({
            message: 'Exercise updated successfully',
            exercise,
        });
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
