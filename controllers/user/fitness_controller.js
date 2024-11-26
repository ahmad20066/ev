const Workout = require('../../models/fitness/workout')
const Exercise = require('../../models/fitness/exercise')
const Subscription = require('../../models/subscription');
const Package = require('../../models/package');
const PricingModel = require('../../models/pricing_model');
const WorkoutAttendance = require('../../models/fitness/workout_attendance');
const ExerciseCompletion = require('../../models/fitness/exercise_completion');
const WorkoutExercise = require("../../models/fitness/workout_exercise");
const WorkoutCompletion = require('../../models/fitness/workout_completion');
const { Op } = require('sequelize');
const Answer = require('../../models/survey/answer');
const Survey = require('../../models/survey/survey');
const Question = require('../../models/survey/question');
const WorkoutRequest = require('../../models/fitness/user_workout_request');


exports.getWorkoutsByDate = async (req, res, next) => {
    try {
        let date = req.query.date;

        // Default to today's date if no date is provided
        if (!date) {
            date = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
        }

        // Validate date format
        if (isNaN(Date.parse(date))) {
            const error = new Error("Invalid date format. Use YYYY-MM-DD.");
            error.statusCode = 422;
            throw error;
        }

        // Extract the day of the week from the provided date
        const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const parsedDate = new Date(date);
        const dayIndex = parsedDate.getDay(); // Get day of the week (0-6, where 0 = Sunday)
        const day = daysOfWeek[dayIndex]; // Get the name of the day (e.g., "monday")

        // Ensure user has an active subscription
        const subscription = await Subscription.findOne({
            where: {
                user_id: req.userId,
                is_active: true
            },
            include: {
                model: Package,
                as: 'package',
                attributes: ['type'],
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
            ...(type === "personalized" ? { user_id: req.userId } : {})
        };

        const workouts = await Workout.findOne({
            where: where,
            order: [['createdAt', 'DESC']],
            include: {
                model: Exercise,
                as: "exercises",
                through: {
                    attributes: ["sets", "reps"],
                    as: "stats"
                }
            }
        });

        if (workouts.length === 0) {
            const error = new Error("You do not have workouts for this day");
            error.statusCode = 400;
            throw error;
        }




        res.status(200).json(workouts);
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};
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
        let message
        if (package.type === "personalized") {
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
        const { workout_id } = req.body
        const workout = await Workout.findByPk(workout_id)
        if (!workout) {
            const error = new Error("Workout Not Found")
            error.statusCode = 404;
            throw error;
        }
        if (workout.type != 'group') {
            const error = new Error("You cant join a personalized workout")
            error.statusCode = 403;
            throw error;
        }
        const user_id = req.userId
        const attendance = new WorkoutAttendance({
            user_id,
            workout_id
        })
        await attendance.save()
        res.status(201).json({
            message: "Workout Joined",
        })
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500
        }
        next(e)
    }
}
exports.markExerciseDone = async (req, res, next) => {
    try {
        const { workout_id, exercise_id, stats } = req.body
        const exercise = await Exercise.findByPk(exercise_id)
        if (!exercise) {
            const error = new Error("Exercise Not Found")
            error.statusCode = 404;
            throw error;
        }
        const workoutExercise = await WorkoutExercise.findOne({
            where: {
                workout_id,
                exercise_id
            }
        });

        if (!workoutExercise) {
            const error = new Error("Workout Exercise Not Found");
            error.statusCode = 404;
            throw error;
        }
        const user_id = req.userId
        const exerciseCompletion = new ExerciseCompletion({
            exercise_id,
            user_id,
            stats
        })
        await exerciseCompletion.save()
        res.status(201).json({
            message: "Exercise Done"
        })
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500
        }
        next(e)
    }
}
exports.markWorkoutDone = async (req, res, next) => {
    try {
        const { workout_id } = req.body;
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

        // Retrieve the user's subscription
        const userSubscription = await Subscription.findOne({
            where: { user_id: userId, is_active: true }
        });

        if (!userSubscription) {
            const error = new Error("You cannot answer this survey. No active subscription found.");
            error.statusCode = 403;
            throw error;
        }

        const questionId = answers[0]?.qustion_id;
        const question = await Question.findByPk(questionId)
        if (!question) {
            const error = new Error("Question not found");
            error.statusCode = 404;
            throw error;
        }
        const surveyId = question.survey_id;
        const survey = await Survey.findByPk(surveyId);

        if (!survey) {
            const error = new Error("The survey does not exist.");
            error.statusCode = 404;
            throw error;
        }

        if (userSubscription.package_id !== survey.package_id) {
            const error = new Error("You cannot answer this survey as it is not part of your subscription package.");
            error.statusCode = 403;
            throw error;
        }


        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: "Invalid input, 'answers' must be a non-empty array." });
        }


        const savedAnswers = answers.map(answer => ({
            qustion_id: answer.qustion_id,
            answer: answer.answer,
            user_id: userId
        }));

        const result = await Answer.bulkCreate(savedAnswers);

        res.status(201).json({
            message: "Answers submitted successfully",
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
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
                as: "questions"
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


// exports.renewSubscription = (req,res,next) => {}