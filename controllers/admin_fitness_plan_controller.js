const FitnessPlan = require("../models/fitness_plan")
const Workout = require("../models/workout")
const WorkoutSchedule = require("../models/workout_schedule")
const Exercise = require("../models/exercise")
const sequelize = require('../models/index')


exports.createFitnessPlan = async (req, res, next) => {
    const { name, price, description } = req.body;
    const fitnessPlanImage = req.file ? req.file.path : null;

    try {
        const fitnessPlan = await FitnessPlan.create({
            name,
            image: fitnessPlanImage,
            price,
            description,
        });

        res.status(201).json({
            message: 'Fitness Plan created successfully!',
            fitnessPlan
        });
    } catch (error) {
        next(error);
    }
}
exports.createWorkoutWithExercises = async (req, res, next) => {
    console.log(req.files);
    const { fitness_plan_id } = req.params;
    const { name, status, difficulty_level, notes, calories_burned, scheduled_dates, exercises } = req.body;

    const workoutImage = req.files['workoutImage'] ? req.files['workoutImage'][0].path : null;

    const transaction = await sequelize.transaction();
    const uploadedFilePaths = [];
    try {
        const workout = await Workout.create({
            name,
            status,
            fitness_plan_id,
            difficulty_level,
            notes,
            calories_burned,
            target_muscles_image: workoutImage,
        }, { transaction });

        const schedulesToCreate = scheduled_dates.map(date => ({
            workout_id: workout.id,
            scheduled_date: date,
        }));
        await WorkoutSchedule.bulkCreate(schedulesToCreate, { transaction });

        const exercisesArray = exercises;

        const exercisesToCreate = exercisesArray.map((exercise, index) => {
            const exerciseImage = req.files.find(file => file.fieldname === `exercises[${index}][image]`)
                ? req.files.find(file => file.fieldname === `exercises[${index}][image]`).path
                : null;
            if (!exerciseImage) {
                const error = new Error("You should include images for exercise" + " " + (index + 1))
                error.statusCode = 422;
                throw error;
            }
            uploadedFilePaths.push(exerciseImage);
            console.log("----------------");
            console.log(uploadedFilePaths);


            return {
                name: exercise.name,
                description: exercise.description,
                sets: exercise.sets,
                duration: exercise.duration,
                video_url: exercise.video_url,
                reps: exercise.reps,
                image_url: exerciseImage,
                workout_id: workout.id,
            };
        });

        await Exercise.bulkCreate(exercisesToCreate, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: 'Workout and Exercises with images created successfully!',
            workout
        });
    } catch (error) {
        // Rollback the transaction if there's an error
        await transaction.rollback();
        console.log(uploadedFilePaths)
        uploadedFilePaths.forEach(filePath => {

            const fullFilePath = path.resolve(filePath);
            console.log(fullFilePath)
            fs.unlink(fullFilePath, err => {
                if (err) {
                    console.error(`Error while deleting file ${fullFilePath}:`, err);
                } else {
                    console.log(`File deleted successfully: ${fullFilePath}`);
                }
            });
        });
        next(error);
    }
};
exports.getFitnessPlans = (req, res, next) => {
    FitnessPlan.findAll().then(result => {
        res.status(200).json(result)
    }).catch(e => {
        if (!e.statusCode) {
            e.statusCode = 500
        }
        next(e)
    })
}
exports.getFitnessPlanById = async (req, res, next) => {
    const { id } = req.params;

    try {
        const plan = await FitnessPlan.findByPk(id, {
            include: [
                {
                    model: Workout,
                    as: 'workouts',
                    include: [
                        {
                            model: Exercise,
                            as: 'exercises',
                        }
                    ]
                }
            ]
        });

        if (!plan) {
            return res.status(404).json({ message: 'Fitness plan not found' });
        }

        res.status(200).json({
            fitnessPlan: plan
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
exports.deleteFitnessPlan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const plan = await FitnessPlan.findByPk(id)
        if (!plan) {
            const error = new Error("fitness plan not found")
            error.statusCode = 404
            throw error;
        }
        await plan.destroy()
        res.status(201).json({
            Message: "Fitness plan deleted successfully"
        })
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500
        }
        next(e)
    }
}

