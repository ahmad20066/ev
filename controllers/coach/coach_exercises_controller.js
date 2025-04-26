const Exercise = require('../../models/fitness/exercise');

exports.createExercise = async (req, res, next) => {
    try {
        const { name, name_ar, description_ar, description, duration, notes, notes_ar, cooling_time } = req.body;

        const image_urls = req.files.images
            ? req.files.images.map((file) => file.path)
            : [];

        const target_muscles_image = req.files.target_muscles_image
            ? req.files.target_muscles_image[0].path
            : null;
        const video_url = req.files.video
            ? req.files.video[0].path
            : null;

        const exercise = await Exercise.create({
            name,
            name_ar,
            description,
            description_ar,
            cooling_time,
            duration,
            image_urls: JSON.stringify(image_urls),
            target_muscles_image,
            video_url,
            notes: JSON.parse(notes),
            notes_ar: JSON.parse(notes_ar),
        });

        res.status(201).json({
            message: 'Exercise created successfully',
            message_ar: 'تم إنشاء التمرين بنجاح',
            // exercise
        });
    } catch (error) {
        next(error);
    }
};

exports.updateExercise = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, name_ar, description_ar, duration, notes, cooling_time } = req.body;

        const exercise = await Exercise.findByPk(id);

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found', message_ar: 'لم يتم العثور على التمرين' });
        }

        const image_urls = req.files.images
            ? req.files.images.map((file) => file.path)
            : JSON.parse(exercise.image_urls);

        const target_muscles_image = req.files.target_muscles_image
            ? req.files.target_muscles_image[0].path
            : exercise.target_muscles_image;

        const video_url = req.files.video
            ? req.files.video[0].path
            : exercise.video_url;

        exercise.name = name || exercise.name;
        exercise.name_ar = name_ar || exercise.name_ar;
        exercise.description = description || exercise.description;
        exercise.cooling_time = cooling_time || exercise.cooling_time;
        exercise.description_ar = description_ar || exercise.description_ar;
        exercise.image_urls = JSON.stringify(image_urls);
        exercise.target_muscles_image = target_muscles_image;
        exercise.video_url = video_url;
        exercise.notes = notes || exercise.notes;

        await exercise.save();

        res.status(200).json({
            message: 'Exercise updated successfully',
            message_ar: 'تم تحديث التمرين بنجاح',
            exercise
        });
    } catch (error) {
        next(error);
    }
};

exports.getExercises = async (req, res, next) => {
    try {
        const exercises = await Exercise.findAll({
            where: { is_active: true }
        });
        res.status(200).json(exercises);
    } catch (error) {
        next(error);
    }
};

exports.getExercise = async (req, res, next) => {
    try {
        const { id } = req.params;
        const exercise = await Exercise.findByPk(id);
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found', message_ar: 'لم يتم العثور على التمرين' });
        }
        res.status(200).json(exercise);
    } catch (error) {
        next(error);
    }
};

exports.deleteExercise = async (req, res, next) => {
    try {
        const exercise = await Exercise.findByPk(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found', message_ar: 'لم يتم العثور على التمرين' });
        }
        await exercise.destroy();
        res.status(200).json({ message: 'Exercise deleted successfully', message_ar: 'تم حذف التمرين بنجاح' });
    } catch (error) {
        next(error);
    }
};
