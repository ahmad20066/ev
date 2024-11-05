const Workout = require('../../models/fitness/workout')
const Exercise = require('../../models/fitness/exercise')
const Subscription = require('../../models/subscription');
const Package = require('../../models/package');
const PricingModel = require('../../models/pricing_model');
const WorkoutAttendance = require('../../models/fitness/workout_attendance');
const ExerciseCompletion = require('../../models/fitness/exercise_completion');
const WorkoutExercise = require("../../models/fitness/workout_exercise")
exports.getWorkoutsByDate = async (req, res, next) => {
    try {
        const date = req.query.date;
        if (!date) {
            const err = new Error("Please add a date")
            err.statusCode = 422;
            throw err;
        }
        const subscription = await Subscription.findOne({
            where: {
                user_id: req.userId,
                is_active: true
            }
        })
        console.log(subscription)
        if (!subscription) {
            const error = new Error("You have no active subscription")
            error.statusCode = 400;
            throw error;
        }
        const formattedDate = Date.parse(date)
        const type = subscription.package_id === 1 ? "group" : "personalized"
        const where = type === "group" ? {
            date: formattedDate,
            type
        } : {
            date: formattedDate,
            type,
            user_id: req.userId
        }

        Workout.findAll({
            where: where,
            include: {
                model: Exercise,
                as: "exercises",
                through: {
                    attributes: ["sets", "reps"],
                    as: "stats"
                }
            }
        }).then(workouts => {
            res.status(200).json(workouts)
        }).catch(e => {
            if (!e.statusCode) {
                e.statusCode = 500
            }
            next(e)
        });
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500
        }
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
        const pricing = await PricingModel.findOne({ package_id: package_id, id: pricing_id })
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
        res.status(201).json({
            Message: "Subscription Successful",
            subscription
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
            Message: "Workout Joined",
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
            Message: "Exercise Done"
        })
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500
        }
        next(e)
    }
}
// exports.renewSubscription = (req,res,next) => {}