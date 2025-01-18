const Workout = require('../../models/fitness/workout')
const Exercise = require('../../models/fitness/exercise')
const Subscription = require('../../models/subscription');
const Package = require('../../models/package');
const PricingModel = require('../../models/pricing_model');
const WorkoutAttendance = require('../../models/fitness/workout_attendance');
const ExerciseCompletion = require('../../models/fitness/exercise_completion');
const WorkoutExercise = require("../../models/fitness/workout_exercise");
const WorkoutCompletion = require('../../models/fitness/workout_completion');
const { Op, Sequelize } = require('sequelize');
const Answer = require('../../models/survey/answer');
const Survey = require('../../models/survey/survey');
const Question = require('../../models/survey/question');
const WorkoutRequest = require('../../models/fitness/user_workout_request');
const ExerciseStat = require('../../models/fitness/exercise_stat');
const User = require('../../models/user');
const WorkoutRating = require('../../models/fitness/workout_rating');
const Choice = require('../../models/survey/choice');
const Renewal = require('../../models/fitness/renewal');
const { duration } = require('moment');
const sequelize = require('../../models');
const WeightRecord = require('../../models/weight_record');


exports.getWorkoutsByDate = async (req, res, next) => {
    try {
        let day = req.query.day;

        if (!day) {
            const error = new Error("Day is required. Use one of: sunday, monday, tuesday, wednesday, thursday, friday, saturday.");
            error.statusCode = 422;
            throw error;
        }

        const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        day = day.toLowerCase();

        if (!daysOfWeek.includes(day)) {
            const error = new Error("Invalid day. Use one of: sunday, monday, tuesday, wednesday, thursday, friday, saturday.");
            error.statusCode = 422;
            throw error;
        }

        const subscription = await Subscription.findOne({
            where: {
                user_id: req.userId,
                is_active: true
            },
            include: {
                model: Package,
                as: 'package',
            },
        });

        if (!subscription) {
            const error = new Error("You have no active subscription");
            error.statusCode = 400;
            throw error;
        }

        const type = subscription.package.type;
        const where = {
            day: day,
            type: type,
            ...(type === "personalized" ? { user_id: req.userId } : {}),
            package_id: subscription.package_id,
            is_active: true
        };

        const workout = await Workout.findOne({
            where: where,
            order: [['createdAt', 'DESC']],
            include: {
                model: Exercise,
                as: "exercises",
                through: {
                    attributes: ['sets', 'reps', 'duration'],
                    as: "stats"
                }
            }
        });

        if (!workout) {
            const error = new Error("You do not have workouts for this day");
            error.statusCode = 400;
            throw error;
        }

        // Check attendance and completion status
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await WorkoutAttendance.findOne({
            where: {
                user_id: req.userId,
                workout_id: workout.id,
                createdAt: {
                    [Sequelize.Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        const completion = await WorkoutCompletion.findOne({
            where: {
                user_id: req.userId,
                workout_id: workout.id,
            }
        });

        // Add status to the workout response
        workout.dataValues.status = completion
            ? 'completed'
            : attendance
                ? 'joined'
                : 'not joined';

        workout.exercises = workout.exercises.map((exercise) => {
            const stats = exercise.get('stats').dataValues;
            exercise.dataValues.stats = Object.fromEntries(
                Object.entries(stats).filter(([key, value]) => value != null)
            );
            return exercise;
        });

        res.status(200).json(workout);
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};

exports.showWorkout = async (req, res, next) => {
    try {
        const { id } = req.params;
        const workout = await Workout.findByPk(id, {
            include: {
                model: Exercise,
                as: "exercises",
                through: {
                    attributes: ['sets', 'reps', 'duration'],
                    as: "stats"
                }
            }
        })
        if (!workout) {
            const error = new Error("workout not found");
            error.statusCode = 404;
            throw error;
        }
        if (workout.type === 'group') {
            const subscription = await Subscription.findOne({
                where: {
                    user_id: req.userId,
                    is_active: true
                }
            })
            if (workout.package_id !== subscription.package_id) {
                const error = new Error("Workout not found")
                error.statusCode = 404
                throw error;
            }
            res.status(200).json(workout)
        } else {
            if (workout.user_id !== req.userId) {
                const error = new Error("Workout not found")
                error.statusCode = 404
                throw error;
            }
            res.status(200).json(workout)
        }

    } catch (e) {
        next(e)
    }
}

exports.subscribeToPackage = async (req, res, next) => {
    try {
        const { package_id, pricing_id } = req.body
        const package = await Package.findByPk(package_id);
        const oldSubscription = await Subscription.findOne({
            where: {
                user_id: req.userId,
                is_active: true
            }

        })
        console.log(req.userId)
        console.log(oldSubscription)
        if (oldSubscription) {
            const error = new Error("You already have a subscription")
            error.statusCode = 403;
            throw error;
        }
        if (!package) {
            const error = new Error("Package not found")
            error.statusCode = 404;
            throw error;
        }
        const pricing = await PricingModel.findOne({ where: { package_id: package_id, id: pricing_id } })
        if (!pricing) {
            const error = new Error("Pricing not found")
            error.statusCode = 404;
            throw error;
        }
        const startDate = new Date();
        let endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + pricing.number_of_days + 1);
        const subscription = new Subscription({
            user_id: req.userId,
            package_id,
            start_date: startDate,
            end_date: endDate,
            pricing_id: pricing.id
        })

        await subscription.save();
        const previousSubscription = await Subscription.findOne({
            where: {
                user_id: req.userId,
                is_active: false,
                package_id
            }

        })
        let message
        if (package.type === "personalized" && !previousSubscription) {
            const request = new WorkoutRequest({
                user_id: req.userId,
                package_id
            })
            await request.save()
            message = "Subscription Successful, please wait for the coach to create your workouts"
        }

        res.status(201).json({
            message: message || "Subscription Successful",
            // subscription
        })
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500
        }
        next(e)
    }
}



exports.joinWorkout = async (req, res, next) => {
    try {
        const { workout_id } = req.body;
        const workout = await Workout.findByPk(workout_id);

        if (!workout) {
            const error = new Error("Workout Not Found");
            error.statusCode = 404;
            throw error;
        }

        // if (workout.type !== 'group') {
        //     const error = new Error("You can't join a personalized workout");
        //     error.statusCode = 403;
        //     throw error;
        // }

        const currentDay = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

        if (workout.day !== currentDay) {
            const error = new Error(`You can only join workouts scheduled for today (${currentDay})`);
            error.statusCode = 403;
            throw error;
        }

        const user_id = req.userId;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const oldAttendance = await WorkoutAttendance.findOne({
            where: {
                workout_id: workout.id,
                user_id,
                createdAt: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        if (oldAttendance) {
            const error = new Error("You have already joined a workout for today");
            error.statusCode = 403;
            throw error;
        }

        const attendance = await WorkoutAttendance.create({
            user_id,
            workout_id
        });

        res.status(201).json({
            message: "Workout Joined",
        });
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};


exports.markExerciseDone = async (req, res, next) => {
    try {
        const { workout_id, exercise_id, stats } = req.body;
        const exercise = await Exercise.findByPk(exercise_id);
        if (!exercise) {
            const error = new Error("Exercise Not Found");
            error.statusCode = 404;
            throw error;
        }

        const user_id = req.userId;
        const attendance = await WorkoutAttendance.findOne({
            where: {
                workout_id,
                user_id
            }
        })
        if (!attendance) {
            const error = new Error("You should join the workout first")
            error.statusCode = 403;
            throw error
        }
        const exerciseCompletion = await ExerciseCompletion.create({
            exercise_id,
            user_id,
            workout_id
        });

        const statsPromises = stats.map((stat) => {
            return ExerciseStat.create({
                exercise_completion_id: exerciseCompletion.id,
                set: stat.set,
                reps: stat.reps,
                weight: stat.weight
            });
        });

        await Promise.all(statsPromises);

        res.status(201).json({
            message: "Exercise Completed and Stats Recorded",
        });
    } catch (e) {
        console.error(e);
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};
exports.markWorkoutDone = async (req, res, next) => {
    try {
        const { workout_id } = req.body;
        const workout_attendance = await WorkoutAttendance.findOne({
            where: {
                workout_id,
                user_id: req.userId
            }
        })
        if (!workout_attendance) {
            const error = new Error("Please join the workout first")
            error.statusCode = 403
            throw error;
        }
        const workoutCompletion = new WorkoutCompletion({
            workout_id,
            user_id: req.userId
        })
        await workoutCompletion.save()
        res.status(201).json({
            message: "Workout Marked Complete"
        })
    } catch (e) {
        next(e)
    }
}
exports.submitAnswers = async (req, res) => {
    try {
        const { answers } = req.body;
        const userId = req.userId;

        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: "'answers' must be a non-empty array." });
        }

        const userSubscription = await Subscription.findOne({
            where: { user_id: userId, is_active: true },
        });

        if (!userSubscription) {
            return res.status(403).json({
                message: "You cannot answer this survey. No active subscription found.",
            });
        }


        const firstQuestionId = answers[0]?.question_id;
        console.log(answers)
        console.log(firstQuestionId)
        const firstQuestion = await Question.findByPk(firstQuestionId);
        if (!firstQuestion) {
            return res.status(404).json({ message: "Question not found." });
        }

        const surveyId = firstQuestion.survey_id;
        const survey = await Survey.findByPk(surveyId);
        if (!survey) {
            return res.status(404).json({ message: "Survey not found." });
        }

        if (userSubscription.package_id !== survey.package_id) {
            return res.status(403).json({
                message: "You cannot answer this survey as it is not part of your subscription package.",
            });
        }

        // Prepare to save answers
        const savedAnswers = [];

        for (const { question_id, answer, choice_id } of answers) {
            const question = await Question.findByPk(question_id, { include: { model: Choice, as: "choices" } });
            if (!question) {
                return res.status(404).json({ message: `Question with ID ${question_id} not found.` });
            }

            if (question.type === "normal") {
                if (!answer || typeof answer !== "string") {
                    return res.status(400).json({
                        message: `Invalid answer for question ID ${question_id}. A string is required.`,
                    });
                }
                savedAnswers.push({ question_id, answer, user_id: userId });

            } else if (question.type === "choice") {
                if (!choice_id) {
                    return res.status(400).json({
                        message: `Choice ID is required for question ID ${question_id}.`,
                    });
                }

                const validChoice = question.choices.find((choice) => choice.id === choice_id);
                if (!validChoice) {
                    return res.status(400).json({
                        message: `Invalid choice ID ${choice_id} for question ID ${question_id}.`,
                    });
                }

                savedAnswers.push({ question_id, choice_id, user_id: userId });
            } else {
                return res.status(400).json({ message: `Unknown question type for question ID ${question_id}.` });
            }
        }

        await Answer.bulkCreate(savedAnswers);

        res.status(201).json({
            message: "Answers submitted successfully.",
        });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};
exports.getSurvey = async (req, res, next) => {
    try {
        const userId = req.userId
        const userSubscription = await Subscription.findOne({
            where: { user_id: userId, is_active: true }
        });
        if (!userSubscription) {
            const error = new Error("You have no active subscription");
            error.statusCode = 403;
            throw error;
        }
        const survey = await Survey.findOne({
            where: {
                package_id: userSubscription.package_id
            },
            include: {
                model: Question,
                as: "questions",
                include: {
                    model: Choice,
                    as: "choices",
                    required: false
                }
            }
        })
        if (!survey) {
            const error = new Error("No Survey For This pacakge");
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json(survey)
    } catch (e) {
        next(e)
    }
}
exports.exerciseLeaderBoard = async (req, res, next) => {
    try {
        const exercise_id = req.query.exercise_id;

        if (!exercise_id) {
            const error = new Error("Exercise ID is required");
            error.statusCode = 400;
            throw error;
        }

        const exerciseCompletions = await ExerciseCompletion.findAll({
            where: { exercise_id },
            include: [
                {
                    model: ExerciseStat,
                    attributes: ['set', 'reps', 'weight'],
                    order: [['weight', 'DESC']],
                },
                {
                    model: User,
                    as: "user",
                    attributes: ['id', 'name'],
                }
            ]
        });

        if (exerciseCompletions.length === 0) {
            return res.status(200).json([]);
        }

        const leaderboard = exerciseCompletions
            .map(completion => {
                const topStat = completion.ExerciseStats[0];

                if (topStat) {
                    return {
                        user: {
                            id: completion.user.id,
                            name: completion.user.name,

                        },
                        stats: {
                            set: topStat.set,
                            reps: topStat.reps,
                            weight: topStat.weight,
                        }
                    };
                }

                return null;
            })
            .filter(item => item !== null)
            .sort((a, b) => b.stats.weight - a.stats.weight);

        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        res.status(200).json(
            leaderboard
        );

    } catch (error) {
        console.error(error);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
exports.rateWorkout = async (req, res, next) => {
    try {
        const { workout_id, rating, message } = req.body
        const workout = await Workout.findByPk(workout_id)
        if (!workout) {
            const error = new Error("Workout not found")
            error.statusCode = 404
            throw error;
        }
        const subscription = await Subscription.findOne({
            where: {
                user_id: req.userId,
                is_active: true,
                package_id: workout.package_id
            }
        })
        if (!subscription) {
            return res.status(403).json({
                message: "You have no active subscription to this pacakge"
            })
        }
        const completion = await WorkoutCompletion.findOne({
            where: {
                workout_id: workout_id,
                user_id: req.userId
            }
        })
        if (!completion) {
            const error = new Error("You cant rate a workout that you did not complete")
            error.statusCode = 403
            throw error;
        }
        const feedback = new WorkoutRating({
            workout_id,
            rating,
            message
        })
        await feedback.save()
        res.status(201).json({
            message: "Feedback submitted"
        })
    } catch (e) {
        next(e)
    }
}
exports.renewSubscription = async (req, res, next) => {
    try {
        const { subscription_id } = req.query
        const subscription = await Subscription.findByPk(subscription_id, {
            include: {
                model: PricingModel,
                as: "pricing"
            }
        })
        if (!subscription) {
            const error = new Error("Subscription not found")
            error.statusCode = 404
            throw error;
        }
        if (subscription.is_active) {
            const error = new Error("Subscription already active")
            error.statusCode = 400
            throw error;
        }
        subscription.is_active = true;
        let endDate = new Date(subscription.end_date);
        endDate.setDate(endDate.getDate() + subscription.pricing.number_of_days);
        console.log(subscription.pricing.number_of_days)
        subscription.end_date = endDate;
        console.log(endDate)
        subscription.end_date = endDate
        await subscription.save()
        const renewal = new Renewal({
            subscription_id
        })
        await renewal.save();
        res.status(201).json({
            message: "Subscription renewed",
            subscription
        })
    } catch (e) {
        next(e)
    }
}

exports.getExercise = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { workout_id } = req.query;

        const workoutExercise = await WorkoutExercise.findOne({
            where: {
                workout_id,
                exercise_id: id,
            },
            include: [
                {
                    model: Exercise,
                    as: 'exercise',
                },
            ],
        });

        if (!workoutExercise) {
            const error = new Error("Exercise is not associated to WorkoutExercise!");
            error.statusCode = 404;
            throw error;
        }

        const stats = {};
        if (workoutExercise.sets !== null) stats.sets = workoutExercise.sets;
        if (workoutExercise.reps !== null) stats.reps = workoutExercise.reps;
        if (workoutExercise.duration !== null) stats.duration = workoutExercise.duration;

        res.status(200).json({
            ...workoutExercise.exercise.toJSON(),
            stats,
        });
    } catch (error) {
        next(error);
    }
};
exports.getPackageWorkouts = async (req, res, next) => {
    try {
        const { package_id } = req.query
        const package = await Package.findByPk(package_id)
        if (!package) {
            const error = new Error("Package not found")
            error.statusCode = 404
            throw error;
        }
        const workouts = await Workout.findAll({
            where: {
                package_id,
                type: "group",
                is_active: true
            },
            include: [
                {
                    model: WorkoutRating,
                    as: "reviews",
                }]
        })
        res.status(200).json(workouts)
    } catch (e) {
        next(e)
    }
}
exports.showPackageWorkout = async (req, res, next) => {
    try {
        const { id } = req.params
        const package = await Package.findByPk(package_id)
        if (!package) {
            const error = new Error("Package not found")
            error.statusCode = 404
            throw error;
        }
        const workouts = await Workout.findOne({
            where: {
                id,

            },
            include: [
                {
                    model: WorkoutRating,
                    as: "reviews",
                }]
        })
        res.status(200).json(workouts)
    } catch (e) {
        next(e)
    }
}
exports.getAllPackages = async (req, res, next) => {
    try {
        const packages = await Package.findAll({
            where: {
                is_active: true
            },
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
exports.getPerformanceStats = async (req, res, next) => {
    try {
        const userId = req.userId;

        // 1. Weight Change over time
        const weightRecords = await WeightRecord.findAll({
            where: { user_id: userId },
            order: [["createdAt", "ASC"]],
            attributes: ["weight", "createdAt"],
        });

        const weightChange = weightRecords.map(record => ({
            date: record.createdAt,
            weight: record.weight,
        }));

        // 2. Workout Attendance (Total and Distinct)
        const totalWorkoutAttendance = await WorkoutAttendance.count({
            where: { user_id: userId },
        });

        const distinctWorkouts = await WorkoutAttendance.count({
            where: { user_id: userId },
            distinct: true,
            col: "workout_id",
        });

        // 3. Exercise Completion (Total and Distinct)
        const totalExerciseCompletion = await ExerciseCompletion.count({
            where: { user_id: userId },
        });

        const distinctExercises = await ExerciseCompletion.count({
            where: { user_id: userId },
            distinct: true,
            col: "exercise_id",
        });

        // 4. Workout Completion (Total)
        const totalWorkoutCompletion = await WorkoutCompletion.count({
            where: { user_id: userId },
        });

        // 5. Exercise Stats (Sets, Reps, Weight)
        const exerciseStats = await ExerciseStat.findAll({
            include: [{ model: Exercise, as: "exercise", attributes: ["name"] }],
            where: { exercise_completion_id: { [Op.not]: null } },
            attributes: [
                "exercise_id",
                [sequelize.fn("SUM", sequelize.col("set")), "total_sets"],
                [sequelize.fn("SUM", sequelize.col("reps")), "total_reps"],
                [sequelize.fn("SUM", sequelize.col("weight")), "total_weight"],
            ],
            group: ["exercise_id", "exercise.name"],
        });

        const exerciseStatSummary = exerciseStats.map(stat => ({
            exercise: stat.exercise.name,
            totalSets: stat.dataValues.total_sets,
            totalReps: stat.dataValues.total_reps,
            totalWeight: stat.dataValues.total_weight,
        }));

        // 6. Recent Activity (Last 5 Workouts and Exercises)
        const recentWorkouts = await WorkoutAttendance.findAll({
            where: { user_id: userId },
            include: [{ model: Workout, as: "workout", attributes: ["title", "day", "duration"] }],
            order: [["createdAt", "DESC"]],
            limit: 5,
        });

        const recentWorkoutList = recentWorkouts.map(record => ({
            title: record.workout.title,
            day: record.workout.day,
            duration: record.workout.duration,
            attendedAt: record.createdAt,
        }));

        const recentExercises = await ExerciseCompletion.findAll({
            where: { user_id: userId },
            include: [{ model: Exercise, as: "exercise", attributes: ["name"] }],
            order: [["createdAt", "DESC"]],
            limit: 5,
        });

        const recentExerciseList = recentExercises.map(record => ({
            name: record.exercise.name,
            completedAt: record.createdAt,
        }));

        // Response
        res.status(200).json({
            message: "Performance stats fetched successfully",
            stats: {
                weightChange, // Can be visualized as a line chart
                totalWorkoutAttendance,
                distinctWorkouts,
                totalExerciseCompletion,
                distinctExercises,
                totalWorkoutCompletion,
                exerciseStatSummary, // Can be visualized as a bar chart
                recentActivity: {
                    workouts: recentWorkoutList,
                    exercises: recentExerciseList,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching performance stats:", error);
        next(error);
    }
};