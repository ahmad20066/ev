const Workout = require('../../models/fitness/workout')
const Exercise = require('../../models/fitness/exercise')
const Subscription = require('../../models/subscription');
const Package = require('../../models/package');
const PricingModel = require('../../models/pricing_model');
const WorkoutAttendance = require('../../models/fitness/workout_attendance');
const ExerciseCompletion = require('../../models/fitness/exercise_completion');
const WorkoutExercise = require("../../models/fitness/workout_exercise");
const WorkoutCompletion = require('../../models/fitness/workout_completion');
const sequelize = require('../../models');
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
const WeightRecord = require('../../models/weight_record');
const Coupon = require('../../models/fitness/coupon');
exports.getWorkoutsByDate = async (req, res, next) => {
    try {
        const date = req.query.date;

        if (!date) {
            const error = new Error("Date is required.");
            error.statusCode = 422;
            throw error;
        }

        const subscription = await Subscription.findOne({
            where: {
                user_id: req.userId,
                is_active: true,
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
            date,
            type,
            ...(type === "personalized" ? { user_id: req.userId } : {}),
            package_id: subscription.package_id,
            is_active: true,
        };

        const workout = await Workout.findOne({
            where,
            order: [["createdAt", "DESC"]],
            include: {
                model: Exercise,
                as: "exercises",
            },
        });

        if (!workout) {
            res.status(200).json({})
        }

        for (const exercise of workout.exercises) {
            const completion = await ExerciseCompletion.findOne({
                where: {
                    user_id: req.userId,
                    exercise_id: exercise.id,
                    workout_id: workout.id
                },
            });
            exercise.dataValues.status = completion ? "completed" : "pending";
        }

        const attendance = await WorkoutAttendance.findOne({
            where: {
                user_id: req.userId,
                workout_id: workout.id,
            },
        });
        const completion = await WorkoutCompletion.findOne({
            where: {
                user_id: req.userId,
                workout_id: workout.id,
            },
        });
        workout.dataValues.session_joined = attendance ? true : false;
        workout.dataValues.session_completed = completion ? true : false;

        return res.status(200).json(workout);
    } catch (err) {
        next(err);
    }
};
exports.showWorkout = async (req, res, next) => {
    try {
        const { id } = req.params;
        const workout = await Workout.findByPk(id, {
            include: {
                model: Exercise,
                as: "exercises",
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
        const { package_id, pricing_id, token, coupon_code } = req.body

        if (!token) {
            const error = new Error("Payment token is required")
            error.statusCode = 400;
            throw error;
        }

        const package = await Package.findByPk(package_id);
        const oldSubscription = await Subscription.findOne({
            where: {
                user_id: req.userId,
                is_active: true
            }
        })

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

        const user = await User.findByPk(req.userId);
        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404;
            throw error;
        }

        let finalAmount = pricing.price;
        let discountAmount = 0;
        let appliedCoupon = null;

        if (coupon_code) {
            const coupon = await Coupon.findOne({
                where: {
                    code: coupon_code,
                    is_active: true,
                    [Op.or]: [
                        { package_id: null },
                        { package_id: package_id }
                    ]
                }
            });

            if (!coupon) {
                const error = new Error("Coupon not found or not valid for this package")
                error.statusCode = 400;
                throw error;
            }

            if (coupon.expiry_date < new Date()) {
                const error = new Error("Coupon expired")
                error.statusCode = 400;
                throw error;
            }

            if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
                const error = new Error("Coupon usage limit reached")
                error.statusCode = 400;
                throw error;
            }

            if (coupon.discount_type === 'percentage') {
                discountAmount = pricing.price * (coupon.discount_value / 100);
            } else {
                discountAmount = coupon.discount_value;
            }

            discountAmount = Math.min(discountAmount, pricing.price);
            finalAmount = pricing.price - discountAmount;
            appliedCoupon = coupon;
        }

        const { processPaymentWithToken } = require('../payments/tap_controller');

        const paymentResult = await processPaymentWithToken({
            token: token,
            amount: finalAmount,
            currency: 'SAR',
            customer: {
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            },
            description: `Fitness Package Subscription - ${package.name}${appliedCoupon ? ` (Coupon: ${coupon_code})` : ''}`,
            metadata: {
                user_id: req.userId,
                package_id: package_id,
                pricing_id: pricing_id,
                subscription_type: 'fitness',
                original_amount: pricing.price,
                discount_amount: discountAmount,
                coupon_code: coupon_code || null,
                coupon_id: appliedCoupon?.id || null
            }
        });

        if (!paymentResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Payment failed',
                error: paymentResult.error
            });
        }

        if (appliedCoupon) {
            await appliedCoupon.update({
                used_count: appliedCoupon.used_count + 1
            });
        }

        const startDate = new Date();
        let endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + pricing.number_of_days + 1);

        const subscription = new Subscription({
            user_id: req.userId,
            package_id,
            start_date: startDate,
            end_date: endDate,
            pricing_id: pricing.id,
            payment_charge_id: paymentResult.charge_id,
            coupon_id: appliedCoupon?.id || null,
            discount_applied: discountAmount
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
            message = "Subscription and payment successful, please wait for the coach to create your workouts"
        }

        res.status(201).json({
            success: true,
            message: message || "Subscription and payment successful",
            payment: {
                charge_id: paymentResult.charge_id,
                original_amount: pricing.price,
                discount_amount: discountAmount,
                final_amount: finalAmount,
                currency: paymentResult.currency,
                status: paymentResult.status
            },
            coupon_applied: appliedCoupon ? {
                code: coupon_code,
                discount_type: appliedCoupon.discount_type,
                discount_value: appliedCoupon.discount_value,
                discount_amount: discountAmount
            } : null
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

        const currentDate = new Date().toISOString().split('T')[0];

        if (workout.date !== currentDate) {
            const error = new Error(`You can only join workouts scheduled for today (${currentDate})`);
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

        await WorkoutAttendance.create({
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
                    attributes: ['weight'],
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
exports.getExercises = async (req, res, next) => {
    try {
        const exercises = await Exercise.findAll({ where: { is_active: true } });
        res.status(200).json(exercises);
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

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const completion = await ExerciseCompletion.findOne({
            where: {
                user_id: req.userId,
                exercise_id: id,
                workout_id,

            }
        });

        workoutExercise.dataValues.status = completion
            ? 'completed'
            : 'pending';
        res.status(200).json({
            ...workoutExercise.exercise.toJSON(),
            status: workoutExercise.dataValues.status,
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
exports.getPackageDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Get package with pricings
        const package = await Package.findByPk(id, {
            include: [{
                model: PricingModel,
                as: "pricings",
                where: {
                    is_active: true
                },
                required: false
            }]
        });

        if (!package) {
            const error = new Error("Package not found");
            error.statusCode = 404;
            throw error;
        }

        // Get statistics
        const [
            totalSubscribers,
            totalWorkouts,
            workoutRatings,
            totalWorkoutAttendances,
            totalWorkoutCompletions
        ] = await Promise.all([
            // Total active subscribers
            Subscription.count({
                where: {
                    package_id: id,
                    is_active: true
                }
            }),
            // Total active workouts
            Workout.count({
                where: {
                    package_id: id,
                    is_active: true
                }
            }),
            // All workout ratings for this package's workouts - using raw query
            sequelize.query(`
                SELECT wr.rating, wr.message, wr.createdAt
                FROM WorkoutRatings wr
                INNER JOIN workouts w ON w.id = wr.workout_id
                WHERE w.package_id = :packageId
                ORDER BY wr.createdAt DESC
                LIMIT 10
            `, {
                replacements: { packageId: id },
                type: sequelize.QueryTypes.SELECT
            }),
            // Total workout attendances
            WorkoutAttendance.count({
                include: [{
                    model: Workout,
                    as: "workout",
                    where: {
                        package_id: id
                    },
                    attributes: []
                }]
            }),
            // Total workout completions
            WorkoutCompletion.count({
                include: [{
                    model: Workout,
                    as: "workout",
                    where: {
                        package_id: id
                    },
                    attributes: []
                }]
            })
        ]);

        // Calculate average rating - using raw query
        const ratings = await sequelize.query(`
            SELECT wr.rating
            FROM WorkoutRatings wr
            INNER JOIN workouts w ON w.id = wr.workout_id
            WHERE w.package_id = :packageId
        `, {
            replacements: { packageId: id },
            type: sequelize.QueryTypes.SELECT
        });

        const averageRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + parseFloat(r.rating || 0), 0) / ratings.length
            : 0;

        // Calculate rating distribution
        const ratingDistribution = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };

        ratings.forEach(rating => {
            const ratingValue = Math.round(parseFloat(rating.rating || 0));
            if (ratingValue >= 1 && ratingValue <= 5) {
                ratingDistribution[ratingValue]++;
            }
        });

        // Calculate completion rate
        const completionRate = totalWorkoutAttendances > 0
            ? ((totalWorkoutCompletions / totalWorkoutAttendances) * 100).toFixed(1)
            : 0;

        // Format recent reviews
        const recentReviews = workoutRatings.map(rating => ({
            rating: parseFloat(rating.rating),
            message: rating.message || null,
            createdAt: rating.createdAt
        }));

        // Build response
        const packageData = package.toJSON();
        const response = {
            ...packageData,
            statistics: {
                totalSubscribers,
                totalWorkouts,
                averageRating: parseFloat(averageRating.toFixed(2)),
                totalReviews: ratings.length,
                completionRate: parseFloat(completionRate)
            },
            ratings: {
                average: parseFloat(averageRating.toFixed(2)),
                count: ratings.length,
                distribution: ratingDistribution,
                recent: recentReviews
            }
        };

        res.status(200).json(response);
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};

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

        // 5. Exercise Stats (Sets, Reps, Weight) - Group by exercise and sum weights
        // Use raw query to avoid Sequelize association issues with GROUP BY
        // Exercise table name is explicitly 'exercises', others are pluralized by Sequelize
        const exerciseStats = await sequelize.query(`
            SELECT 
                ec.exercise_id,
                e.name as exercise_name,
                SUM(CAST(es.weight AS DECIMAL(10,2))) as total_weight
            FROM ExerciseCompletions ec
            INNER JOIN ExerciseStats es ON es.exercise_completion_id = ec.id
            INNER JOIN exercises e ON e.id = ec.exercise_id
            WHERE ec.user_id = :userId
            GROUP BY ec.exercise_id, e.name
        `, {
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT
        });

        const exerciseStatSummary = exerciseStats.map(stat => ({
            exercise: stat.exercise_name || "Unknown",
            totalWeight: parseFloat(stat.total_weight) || 0,
        }));

        // 6. Recent Activity (Last 5 Workouts and Exercises)
        const recentWorkouts = await WorkoutAttendance.findAll({
            where: { user_id: userId },
            include: [{ model: Workout, as: "workout", attributes: ["title", "date", "duration"] }],
            order: [["createdAt", "DESC"]],
            limit: 5,
        });

        const recentWorkoutList = recentWorkouts.map(record => ({
            title: record.workout.title,
            date: record.workout.date,
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
exports.applyCouponToPackage = async (req, res, next) => {
    try {
        const { package_id, pricing_id, coupon_code } = req.body;
        console.log("applyCouponToPackage")
        console.log(package_id, pricing_id, coupon_code)
        if (!package_id || !pricing_id || !coupon_code) {
            return res.status(400).json({ message: 'package_id, pricing_id, and coupon_code are required.' });
        }
        const pricing = await PricingModel.findOne({ where: { id: pricing_id, package_id, is_active: true } });
        if (!pricing) {
            return res.status(404).json({ message: 'Pricing not found for this package.' });
        }
        const price = pricing.price;
        const coupon = await Coupon.findOne({
            where: {
                code: coupon_code,
                is_active: true,
                [Op.or]: [
                    { package_id: null },
                    { package_id: package_id }
                ]
            }
        });
        if (!coupon) return res.status(404).json({ message: 'Coupon not found or not valid for this package.' });
        if (coupon.expiry_date < new Date()) {
            return res.status(400).json({ message: 'Coupon expired' });
        }
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }
        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = price * (coupon.discount_value / 100);
        } else {
            discount = coupon.discount_value;
        }
        const discountAmount = Math.min(discount, price);
        res.status(200).json({
            message: 'Coupon applied',
            discount: discountAmount,
            new_total: price - discountAmount,
            coupon_id: coupon.id,
            pricing_id: pricing.id
        });
    } catch (error) {
        next(error);
    }
};