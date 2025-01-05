const Workout = require('../../models/fitness/workout')
const Exercise = require('../../models/fitness/exercise')
const WorkoutExercise = require('../../models/fitness/workout_exercise')
const ExerciseCompletion = require("../../models/fitness/exercise_completion");
const WorkoutAttendance = require("../../models/fitness/workout_attendance");
const WorkoutCompletion = require("../../models/fitness/workout_completion");
const MealSubscription = require("../../models/meals/meal_subscription");
const Subscription = require("../../models/subscription");
const User = require("../../models/user");
const { Op, Sequelize } = require("sequelize");
const WeightRecord = require('../../models/weight_record');
const Package = require('../../models/package');
const WorkoutRequest = require('../../models/fitness/user_workout_request');
const Answer = require('../../models/survey/answer');

const Question = require('../../models/survey/question');
const UserMealSelection = require('../../models/meals/user_meal_selection');
const WorkoutRating = require('../../models/fitness/workout_rating');
const Choice = require('../../models/survey/choice');
const { startOfYear, endOfYear } = require('date-fns');
const Sport = require('../../models/sport');
const Meal = require('../../models/meals/meal');
exports.createWorkout = async (req, res, next) => {
    try {
        let { title, user_id, description, duration, exercises, difficulty_level, calories_burned, day, package_id } = req.body;
        const coach = req.userId;
        console.log(req.files);
        const image = req.file.path;
        if (user_id) {
            const user = await User.findByPk(user_id)
            if (!user) {
                const error = new Error("User not found");
                error.statusCode = 404;
                throw error;
            }
            const subscription = await Subscription.findOne({
                where: {
                    user_id,
                    is_active: true
                }
            })
            if (!subscription) {
                const error = new Error("No Active subscription for this user");
                error.statusCode = 400;
                throw error;
            }
            package_id = subscription.package_id
        }
        const package = await Package.findByPk(package_id);
        if (!package) {
            const error = new Error("Package not found");
            error.statusCode = 404;
            throw error;
        }

        const type = package.type;
        if (type == "personalized" && !user_id) {
            const error = new Error("Personalized workouts require a user id");
            error.statusCode = 422;
            throw error;
        }
        if (type == "group" && user_id) {
            user_id = undefined
        }
        if (type == "group") {
            const previousWorkout = await Workout.findOne({
                where: {
                    day,
                    package_id
                }
            })
            if (previousWorkout) {
                await previousWorkout.destroy()
            }
        } else {
            const previousWorkout = await Workout.findOne({
                where: {
                    day,
                    user_id
                }
            })
            if (previousWorkout) {
                await previousWorkout.destroy()
            }
        }

        const workout = await Workout.create({
            title,
            description,
            type,
            duration,
            difficulty_level,
            calories_burned,
            coach,
            day,
            user_id,
            package_id,
            image
        });

        await Promise.all(exercises.map(async (exercise) => {
            const { exercise_id, sets, reps, duration } = exercise;

            await WorkoutExercise.create({
                workout_id: workout.id,
                exercise_id,
                sets,
                reps,
                duration
            });
        }));

        const workoutWithExercises = await Workout.findByPk(workout.id, {
            include: [{
                model: Exercise,
                as: 'exercises',
                through: {
                    attributes: ['sets', 'reps', 'duration'],
                    as: "stats"
                }
            }]
        });
        workoutWithExercises.exercises = workoutWithExercises.exercises.map((exercise) => {
            const stats = exercise.get('stats').dataValues;
            console.log(stats)
            exercise.dataValues.stats = Object.fromEntries(
                Object.entries(stats).filter(([key, value]) => value != null)
            );
            return exercise;
        });
        console.log("ssss")
        res.status(201).json({
            message: 'Workout created successfully',
            workout: workoutWithExercises
        });
    } catch (error) {
        next(error);
    }
};

exports.getWorkout = async (req, res, next) => {
    try {
        const workoutId = req.params.id;

        const workout = await Workout.findByPk(workoutId, {
            include: [
                {
                    model: Exercise,
                    as: 'exercises',
                    through: {
                        model: WorkoutExercise,
                        attributes: ['sets', 'reps']
                    }
                },
                {
                    model: WorkoutRating,
                    as: "reviews",
                }
            ]
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
        const { title, type, description, duration, difficulty_level, calories_burned, day, exercises, package_id } = req.body;

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
        workout.package_id = package_id || workout.package_id;
        workout.day = day || workout.day; // Update 'day' field

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
            // role: "consumer",
            is_active: true,
            // is_set_up: true,
            ...condition
        },
        include: {
            model: WeightRecord,
            as: "weight-record",
            required: false
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
exports.getFitnessSubscriptions = async (req, res, next) => {
    const { id } = req.params;
    try {
        const subscriptions = await Subscription.findAll({
            where: { user_id: id },
            include: {
                model: Package,
                as: "package",
                // attributes: ['name', 'description', 'price'],
            }
        });
        res.status(200).json(subscriptions);
    } catch (error) {
        next(error);
    }
};
exports.getSurveyAnswers = async (req, res, next) => {
    const { id } = req.params;
    try {
        const answers = await Answer.findAll({
            where: { user_id: id },
            attributes: { exclude: ['question_id', 'choice_id', 'user_id'] },
            include: [
                {
                    model: Question,
                    as: "question",

                },
                {
                    model: Choice,
                    as: "choice",

                    required: false
                }
            ]
        });
        res.status(200).json(answers);
    } catch (error) {
        next(error);
    }
};
exports.getMealSelections = async (req, res, next) => {
    const { id } = req.params;
    try {
        const mealSelections = await UserMealSelection.findAll({
            where: { user_id: id }
        });
        res.status(200).json(mealSelections);
    } catch (error) {
        next(error);
    }
};
exports.getDietSubscriptions = async (req, res, next) => {
    const { id } = req.params;
    try {
        const dietSubscriptions = await MealSubscription.findAll({
            where: { user_id: id, is_active: true }
        });
        res.status(200).json(dietSubscriptions);
    } catch (error) {
        next(error);
    }
};
exports.getWorkoutAttendance = async (req, res, next) => {
    const { id } = req.params;
    try {
        const workoutAttendance = await WorkoutAttendance.findAll({
            where: { user_id: id }
        });
        res.status(200).json(workoutAttendance);
    } catch (error) {
        next(error);
    }
};
exports.getWorkoutsCompleted = async (req, res, next) => {
    const { id } = req.params;
    try {
        const completedWorkouts = await WorkoutCompletion.findAll({
            where: { user_id: id },
            include: {
                model: Workout,
                as: "workout",

            }
        });
        res.status(200).json(completedWorkouts);
    } catch (error) {
        next(error);
    }
};
exports.getExercisesCompleted = async (req, res, next) => {
    const { id } = req.params;
    try {
        const exercisesCompleted = await ExerciseCompletion.findAll({
            where: { user_id: id }
        });
        res.status(200).json(exercisesCompleted);
    } catch (error) {
        next(error);
    }
};
exports.getWeightRecords = async (req, res, next) => {
    const { id } = req.params;
    try {
        const startDate = startOfYear(new Date());
        const endDate = endOfYear(new Date());

        const weightRecords = await WeightRecord.findAll({
            where: {
                user_id: id,
                createdAt: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate
                }
            },
            order: [['createdAt', 'ASC']]
        });

        // if (!weightRecords.length) {
        //     return res.status(200).json();
        // }

        const chartData = [];
        let previousWeight = null;

        weightRecords.forEach(record => {
            if (previousWeight !== record.weight) {
                chartData.push({
                    date: record.createdAt.toISOString().split('T')[0],
                    weight: record.weight
                });
                previousWeight = record.weight;
            }
        });

        res.status(200).json(chartData);
    } catch (error) {
        next(error);
    }
};
exports.getUserDetails = async (req, res, next) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id, {
            where: {
                role: "consumer"
            },
            attributes: {
                exclude: ['sport_id']
            },
            include: [
                {
                    model: Subscription,
                    as: "fitness_subscriptions"
                },
                {
                    model: Answer,
                    as: "survey_answers",
                    attributes: {
                        exclude: ['question_id', "choice_id", "user_id"]
                    },
                    include: [
                        {
                            model: Question,
                            as: "question"
                        },
                        {
                            model: Choice,
                            as: "choice",
                            required: false
                        }
                    ]
                },
                {
                    model: UserMealSelection,
                    as: "meal_selections",

                },
                {
                    model: MealSubscription,
                    as: "diet_subscriptions",

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
                },
                {
                    model: Sport,
                    as: "sport"
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
exports.getUserBasic = async (req, res, next) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id, {
            where: {
                role: "consumer"
            },
            attributes: {
                exclude: ['sport_id']
            },
            include: {
                model: Sport,
                as: "sport"
            }

        })
        if (!user) {
            throw new Error("User not found")
        }
        res.status(200).json(user)
    } catch (e) {
        next(e)
    }
}
exports.getUserWorkoutLogs = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const attendedWorkouts = await WorkoutAttendance.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Workout,
                    as: 'workout',
                    attributes: ['id', 'title'],
                },
            ],
        });
        console.log(attendedWorkouts)
        const completedWorkouts = await WorkoutCompletion.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Workout,
                    as: 'workout',
                    attributes: ['id', 'title'],
                },
            ],
        });

        const attendanceLogs = attendedWorkouts.map((attendance) => ({
            id: attendance.workout_id,
            workout_name: attendance.workout.title,
            type: 'joined',
            date: attendance.createdAt,
        }));

        const completionLogs = completedWorkouts.map((completion) => ({
            id: completion.workout_id,
            workout_name: completion.workout.title,
            type: 'completed',
            date: completion.createdAt,
        }));

        const combinedLogs = [...attendanceLogs, ...completionLogs].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedLogs = combinedLogs.slice(startIndex, endIndex);

        const totalLogs = combinedLogs.length;

        res.status(200).json({
            totalLogs,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalLogs / limit),
            logs: paginatedLogs,
        });
    } catch (error) {
        next(error);
    }
};

exports.getWorkoutRequests = async (req, res, next) => {
    try {

        let date = req.query.date;

        const where = {};

        if (date) {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;
            if (!datePattern.test(date)) {
                const error = new Error("Invalid date format. Use YYYY-MM-DD.");
                error.statusCode = 422;
                throw error;
            }

            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(startDate.getDate() + 1);

            where.createdAt = {
                [Sequelize.Op.gte]: startDate,
                [Sequelize.Op.lt]: endDate
            };
        }

        const workoutRequests = await WorkoutRequest.findAll({
            where: where,
            include: [{
                model: Package,
                as: "package",
                attributes: ['id', 'name']
            },
            {
                model: User,
                as: "user",
                attributes: {
                    exclude: ['is_set_up', "is_active", "deactivated_at", "package_id", "health_goal_id", "activity_level_id", "password"]
                },
                include: [
                    {
                        model: Answer,
                        as: "survey_answers",
                        include: {
                            model: Question,
                            as: "question"
                        }
                    },
                    {
                        model: WeightRecord,
                        as: "weight-record"
                    },

                ]
            }
            ],
            order: [['createdAt', 'DESC']]
        });



        res.status(200).json(workoutRequests);
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};
// exports.getWeightRecord = async (req, res, next) => {
//     try {
//         const { userId } = req.query
//         const record = await WeightRecord.findAll({
//             where: {
//                 user_id: userId
//             }
//         })
//         res.status(200).json(record)
//     } catch (e) {
//         next(e)
//     }
// }
exports.getUserWorkout = async (req, res, next) => {
    try {
        const { user_id, day } = req.query
        const user = await User.findByPk(user_id)
        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404
            throw error;
        }
        const workout = await Workout.findOne({
            where: {
                user_id,
                type: "personalized",
                day: day
            }
        })
        if (!workout) {
            res.status(200).json({})
            return
        }
        res.status(200).json(workout)
    } catch (e) {
        next(e)
    }
}
exports.getGroupWorkouts = async (req, res, next) => {
    try {
        const { package_id, day } = req.query

        const workout = await Workout.findOne({
            where: {
                package_id,
                day
            },
            include: [
                {
                    model: Exercise,
                    as: 'exercises',
                    through: {
                        model: WorkoutExercise,
                        attributes: ['sets', 'reps']
                    }
                },
                {
                    model: WorkoutRating,
                    as: "reviews",
                }
            ]
        })
        if (!workout) {
            res.status(200).json([])
        }
        res.status(200).json([workout])
    } catch (e) {
        next(e)
    }
}





