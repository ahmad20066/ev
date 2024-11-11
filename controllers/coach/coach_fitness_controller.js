const Workout = require('../../models/fitness/workout')

const Exercise = require('../../models/fitness/exercise')
const WorkoutExercise = require('../../models/fitness/workout_exercise')
const ExerciseCompletion = require("../../models/fitness/exercise_completion");
const WorkoutAttendance = require("../../models/fitness/workout_attendance");
const WorkoutCompletion = require("../../models/fitness/workout_completion");
const MealSubscription = require("../../models/meals/meal_subscription");
const Subscription = require("../../models/subscription");
const User = require("../../models/user");
const { Op } = require("sequelize");
const WeightRecord = require('../../models/weight_record');
exports.createWorkout = async (req, res, next) => {
    try {
        const { title, type, user_id, description, duration, exercises, difficulty_level, calories_burned, date } = req.body;
        const coach = req.userId;
        const parsedDate = Date.parse(date);

        const workout = await Workout.create({
            title,
            description,
            type,
            duration,
            difficulty_level,
            calories_burned,
            coach,
            date: parsedDate,
            user_id: user_id,
        });

        await Promise.all(exercises.map(async (exercise) => {
            const { exercise_id, sets, reps } = exercise;

            await WorkoutExercise.create({
                workout_id: workout.id,
                exercise_id,
                sets,
                reps
            });
        }));


        const workoutWithExercises = await Workout.findByPk(workout.id, {
            include: [{
                model: Exercise,
                as: 'exercises',
                through: {
                    attributes: ['sets', 'reps'],
                    as: "stats"
                }
            }]
        });

        res.status(201).json({
            message: 'Workout created successfully',
            workout: workoutWithExercises
        });
    } catch (error) {
        next(error);
    }
};
// exports.createWorkout = async (req, res, next) => {
//     try {
//         const { title, type, user_id, description, duration, exercises, difficulty_level, calories_burned, date } = req.body;
//         const coach = req.userId;
//         const parsedDate = Date.parse(date)
//         const workout = await Workout.create({
//             title,
//             description,
//             type,
//             duration,
//             difficulty_level,
//             calories_burned,
//             coach,
//             date: parsedDate,
//             user_id: user_id,
//         });

//         const exercisesArray = exercises;
//         console.log(exercisesArray)
//         await Promise.all(exercisesArray.map(async (exercise, index) => {
//             const exerciseImage = req.files.find(file => file.fieldname === `exercises[${index}][image]`)
//                 ? req.files.find(file => file.fieldname === `exercises[${index}][image]`).path
//                 : null;
//             const targetMuscleImage = req.files.find(file => file.fieldname === `exercises[${index}][target_muscles_image]`)
//                 ? req.files.find(file => file.fieldname === `exercises[${index}][target_muscles_image]`).path
//                 : null;

//             if (!exerciseImage) {
//                 const error = new Error("You should include images for all exercises");
//                 error.statusCode = 422;
//                 throw error;
//             }

//             exercise.image_url = exerciseImage;
//             exercise.target_muscles_image = targetMuscleImage
//             await Exercise.create({
//                 ...exercise,
//                 workout_id: workout.id
//             });
//         }));

//         const workoutWithExercises = await Workout.findByPk(workout.id, {
//             include: [{
//                 model: Exercise,
//                 as: 'exercises'
//             }]
//         });

//         res.status(201).json({
//             message: 'Workout created successfully',
//             workout: workoutWithExercises
//         });
//     } catch (error) {
//         next(error);
//     }
// };
exports.getWorkout = async (req, res, next) => {
    try {
        const workoutId = req.params.id;

        const workout = await Workout.findByPk(workoutId, {
            include: [{
                model: Exercise,
                as: 'exercises',
                through: {
                    model: WorkoutExercise,
                    attributes: ['sets', 'reps']
                }
            }]
        });

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        res.status(200).json({ workout });
    } catch (error) {
        next(error);
    }
};
exports.updateWorkout = async (req, res, next) => {
    try {
        const workoutId = req.params.id;
        const { title, type, description, duration, difficulty_level, calories_burned, date, exercises } = req.body;
        const parsedDate = Date.parse(date);

        const workout = await Workout.findByPk(workoutId);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        workout.title = title || workout.title;
        workout.type = type || workout.type;
        workout.description = description || workout.description;
        workout.duration = duration || workout.duration;
        workout.difficulty_level = difficulty_level || workout.difficulty_level;
        workout.calories_burned = calories_burned || workout.calories_burned;
        workout.date = parsedDate || workout.date;

        await workout.save();

        if (exercises && exercises.length > 0) {
            const existingAssociations = await WorkoutExercise.findAll({
                where: { workout_id: workoutId },
            });

            const existingExerciseIds = existingAssociations.map(assoc => assoc.exercise_id);
            const newExerciseIds = exercises.map(ex => ex.exercise_id);
            const exerciseIdsToRemove = existingExerciseIds.filter(id => !newExerciseIds.includes(id));

            await WorkoutExercise.destroy({
                where: {
                    workout_id: workoutId,
                    exercise_id: exerciseIdsToRemove,
                },
            });

            await Promise.all(exercises.map(async (exercise) => {
                const { exercise_id, sets, reps } = exercise;

                const existingExercise = await WorkoutExercise.findOne({
                    where: { workout_id: workoutId, exercise_id },
                });

                if (existingExercise) {
                    existingExercise.sets = sets;
                    existingExercise.reps = reps;
                    await existingExercise.save();
                } else {
                    await WorkoutExercise.create({
                        workout_id: workoutId,
                        exercise_id,
                        sets,
                        reps,
                    });
                }
            }));
        }

        const updatedWorkout = await Workout.findByPk(workoutId, {
            include: [{
                model: Exercise,
                as: 'exercises',
                through: {
                    attributes: ['sets', 'reps'],
                },
            }],
        });

        res.status(200).json({ message: 'Workout updated successfully', workout: updatedWorkout });
    } catch (error) {
        next(error);
    }
};
exports.deleteWorkout = async (req, res, next) => {
    try {
        const workoutId = req.params.id;
        const workout = await Workout.findByPk(workoutId);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        await Exercise.destroy({ where: { workout_id: workoutId } });
        await workout.destroy();

        res.status(200).json({ message: 'Workout and associated exercises deleted successfully' });
    } catch (error) {
        next(error);
    }
};
exports.getUsers = (req, res, next) => {
    User.findAll({
        where: {
            role: "consumer",
            is_active: true,
            is_set_up: true,
        },
        include: {
            model: WeightRecord,
            as: "weight"
        }
    }).then(users => {
        res.status(200).json(users)
    }).catch(e => {
        if (!e.statusCode) {
            e.statusCode = 500
        }
        next(e)
    })
}
exports.searchUser = (req, res, next) => {
    const searchTerm = req.query.name;

    const condition = searchTerm ? {
        name: {
            [Op.like]: `%${searchTerm}%`
        },

    } : {};

    User.findAll({
        where: {
            role: "consumer",
            is_active: true,
            is_set_up: true,
            ...condition
        },
        include: {
            model: WeightRecord,
            as: "weight"
        }
    })
        .then(users => {
            res.status(200).json(users);
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        });
};
exports.getUserDetails = async (req, res, next) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id, {
            where: {
                role: "consumer"
            },
            include: [
                {
                    model: Subscription,
                    as: "fitness_subscriptions"
                },
                {
                    model: MealSubscription,
                    as: "diet_subscriptions"
                },
                {
                    model: WorkoutAttendance,
                    as: "workout_attendances"
                },
                {
                    model: WorkoutCompletion,
                    as: "workouts_completed",
                    include: [
                        {
                            model: Workout,
                            as: "workout"
                        }
                    ]
                },
                {
                    model: ExerciseCompletion,
                    as: "exercises_completed"
                },

                {
                    model: WeightRecord,
                    as: "weight-record"
                }
            ]
        })
        if (!user) {
            throw new Error("User not found")
        }
        res.status(200).json(user)
    } catch (e) {
        next(e)
    }
}
