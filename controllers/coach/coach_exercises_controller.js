
const Exercise = require('../../models/fitness/exercise');

exports.createExercise = async (req, res, next) => {
    try {
        const { name, description, duration, notes } = req.body;

        // Process multiple uploaded images for `image_urls`
        const image_urls = req.files.images
            ? req.files.images.map((file) => `/uploads/images/${file.filename}`)
            : [];

        // Handle single files for target muscles image and video
        const target_muscles_image = req.files.target_muscles_image
            ? `/uploads/images/${req.files.target_muscles_image[0].filename}`
            : null;
        const video_url = req.files.video
            ? `/uploads/images/${req.files.video[0].filename}`
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
        const { id } = req.params; // Exercise ID from request params
        const { name, description, duration, notes } = req.body;

        // Find the exercise to update
        const exercise = await Exercise.findByPk(id);
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // Process multiple uploaded images for `image_urls`
        const image_urls = req.files.images
            ? req.files.images.map((file) => `/uploads/images/${file.filename}`)
            : JSON.parse(exercise.image_urls || '[]'); // Use existing images if none uploaded

        // Handle single files for target muscles image and video
        const target_muscles_image = req.files.target_muscles_image
            ? `/uploads/images/${req.files.target_muscles_image[0].filename}`
            : exercise.target_muscles_image; // Keep existing if not updated
        const video_url = req.files.video
            ? `/uploads/images/${req.files.video[0].filename}`
            : exercise.video_url; // Keep existing if not updated

        // Update exercise fields
        await exercise.update({
            name: name ?? exercise.name,
            description: description ?? exercise.description,
            duration: duration ?? exercise.duration,
            image_urls: JSON.stringify(image_urls), // Convert array to JSON string
            target_muscles_image,
            video_url,
            notes: notes ? JSON.stringify(notes) : exercise.notes, // Convert notes to JSON if updated
        });

        res.status(200).json({
            message: 'Exercise updated successfully',
            exercise
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
