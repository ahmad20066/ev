const Exercise = require('../../models/fitness/exercise');
const { Op } = require('sequelize');

function safeJsonParse(val) {
    if (!val) return null;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
        try {
            return JSON.parse(val);
        } catch (e) {
            return val;
        }
    }
    return val;
}

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
            notes: safeJsonParse(notes),
            notes_ar: safeJsonParse(notes_ar),
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

        let existingImages = safeJsonParse(exercise.image_urls) || [];
        let imagesFromRequest = [];

        if (req.files && req.files.images) {
            imagesFromRequest = imagesFromRequest.concat(
                req.files.images.map(file => file.path)
            );
        }

        if (req.body.images) {
            if (Array.isArray(req.body.images)) {
                imagesFromRequest = imagesFromRequest.concat(req.body.images.filter(url => typeof url === 'string'));
            } else if (typeof req.body.images === 'string') {
                imagesFromRequest.push(req.body.images);
            }
        }

        imagesFromRequest = [...new Set(imagesFromRequest)];

        exercise.name = name || exercise.name;
        exercise.name_ar = name_ar || exercise.name_ar;
        exercise.description = description || exercise.description;
        exercise.cooling_time = cooling_time || exercise.cooling_time;
        exercise.description_ar = description_ar || exercise.description_ar;
        exercise.image_urls = JSON.stringify(imagesFromRequest);
        exercise.target_muscles_image = req.files.target_muscles_image
            ? req.files.target_muscles_image[0].path
            : exercise.target_muscles_image;
        exercise.video_url = req.files.video
            ? req.files.video[0].path
            : exercise.video_url;
        exercise.notes = safeJsonParse(notes) || exercise.notes;

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
        const { search } = req.query;
        const whereClause = { is_active: true };

        if (search) {
            whereClause[Op.or] = [
                where(fn('LOWER', col('name')), {
                    [Op.like]: loweredSearch,
                }),
                where(fn('LOWER', col('name_ar')), {
                    [Op.like]: loweredSearch,
                })
            ];
        }
        const exercises = await Exercise.findAll({
            where: whereClause
        });
        console.log(exercises);
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
