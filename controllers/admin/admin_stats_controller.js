const MealSubscription = require("../../models/meals/meal_subscription")
const Subscription = require("../../models/subscription")
const User = require("../../models/user")
const { Op } = require('sequelize');
const { startOfMonth, endOfMonth } = require('date-fns');
const Exercise = require("../../models/fitness/exercise");
const WorkoutExercise = require("../../models/fitness/workout_exercise");
const ExerciseCompletion = require("../../models/fitness/exercise_completion");
const WorkoutAttendance = require("../../models/fitness/workout_attendance");
const WorkoutCompletion = require("../../models/fitness/workout_completion");
const Package = require("../../models/package");
const Renewal = require("../../models/fitness/renewal");
const moment = require("moment");
const sequelize = require("../../models");
const MealRenewal = require("../../models/meals/meal_renewal");

exports.activeSubscriptionsFitness = async (req, res, next) => {
    try {
        const { type } = req.query;

        const currentYear = moment().year();

        const monthlySubscriptions = await Subscription.unscoped().findAll({
            where: {
                is_active: true,
                createdAt: {
                    [Op.gte]: new Date(`${currentYear}-01-01`),
                },
            },

            attributes: [

                [sequelize.fn('MONTH', sequelize.col('Subscription.createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('Subscription.id')), 'count'],
            ],
            group: [sequelize.fn('MONTH', sequelize.col('Subscription.createdAt'))],
            order: [[sequelize.fn('MONTH', sequelize.col('Subscription.createdAt')), 'ASC']],
            raw: true
        });

        const subscriptionData = new Array(12).fill(0);
        monthlySubscriptions.forEach(item => {
            subscriptionData[item.get('month') - 1] = item.get('count');
        });

        const xaxis = moment.monthsShort();

        res.status(200).json({
            subscription_data: subscriptionData,
            xaxis,
        });

    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};

exports.activeSubscriptionsMeals = async (req, res, next) => {
    try {
        const currentYear = moment().year();

        const monthlySubscriptions = await MealSubscription.findAll({
            where: {
                is_active: true,
                createdAt: {
                    [Op.gte]: new Date(`${currentYear}-01-01`),
                },
            },
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('MealSubscription.createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('MealSubscription.id')), 'count'],
            ],
            group: ['month'],
            order: [[sequelize.fn('MONTH', sequelize.col('MealSubscription.createdAt')), 'ASC']],
        });

        const subscriptionData = new Array(12).fill(0);
        monthlySubscriptions.forEach(item => {
            subscriptionData[item.get('month') - 1] = item.get('count');
        });

        const xaxis = moment.monthsShort();

        res.status(200).json({
            subscription_data: subscriptionData,
            xaxis,
        });

    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};


exports.newSignUps = async (req, res, next) => {
    try {
        const currentYear = new Date().getFullYear();

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const signUpData = months.map(month => ({
            month,
            signups: 0
        }));



        for (let i = 0; i < 12; i++) {
            const startOfMonthDate = startOfMonth(new Date(currentYear, i, 1));
            const endOfMonthDate = endOfMonth(new Date(currentYear, i, 1));

            const signupsCount = await User.count({
                where: {
                    createdAt: {
                        [Op.between]: [startOfMonthDate, endOfMonthDate]
                    }
                }
            });

            signUpData[i].signups = signupsCount;
        }

        res.status(200).json(signUpData);
    } catch (error) {
        next(error);
    }
};
exports.workoutCompletionRate = async (req, res, next) => {
    try {
        const workoutsCount = await WorkoutAttendance.count()
        const completedWorkoutsCount = await WorkoutCompletion.count();
        const rate = completedWorkoutsCount == 0 ? 0 : (workoutsCount / completedWorkoutsCount) * 100;
        res.status(200).json({
            "completion_rate": rate
        })
    } catch (e) {
        next(e);
    }
}
exports.getStats = async (req, res, next) => {
    try {
        const { type } = req.query;


        const [
            activeFitnessSubscriptions,
            activeMealSubscriptions,
            newSignupsCount,
            workoutsCount,
            completedWorkoutsCount
        ] = await Promise.all([
            Subscription.findAll({
                where: {
                    is_active: true,
                },
                include: [
                    {
                        model: Package,
                        as: "package",
                        where: {
                            type: type
                        },
                        attributes: []
                    }
                ]
            }),
            MealSubscription.count({
                where: {
                    is_active: true,
                },
            }),
            User.count({
                where: {
                    createdAt: {
                        [Op.between]: [startOfMonth(new Date()), endOfMonth(new Date())],
                    },
                },
            }),
            WorkoutAttendance.count(),
            WorkoutCompletion.count(),
        ]);

        const completionRate = completedWorkoutsCount === 0
            ? 0
            : (completedWorkoutsCount / workoutsCount) * 100;

        const fitnessSubs = activeFitnessSubscriptions.length;
        res.status(200).json({
            metrics: {
                activeFitnessSubscriptions: fitnessSubs,
                activeMealSubscriptions,
                newSignupsCount,
                workoutCompletionRate: completionRate,
            },
        });
    } catch (error) {
        next(error);
    }
};
exports.getRenewalChartData = async (req, res, next) => {
    try {
        const currentYear = moment().year();

        const monthlyRenewals = await Renewal.findAll({
            where: {
                createdAt: {
                    [Op.gte]: new Date(`${currentYear}-01-01`), // Using createdAt as the renewal date
                },
            },
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: ['month'],
            order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
        });
        console.log(monthlyRenewals)
        const renewalData = new Array(12).fill(0);
        monthlyRenewals.forEach(item => {
            console.log(item.get('month'))
            console.log(item.get('count'))
            renewalData[item.get('month') - 1] = item.get('count');
            console.log(renewalData)
        });
        console.log(renewalData)
        const xaxis = moment.monthsShort();

        res.status(200).json({
            renewal_data: renewalData,
            xaxis,
        });

    } catch (error) {
        next(error);
    }
};
exports.getmealRenewalChartData = async (req, res, next) => {
    try {
        const currentYear = moment().year();

        const monthlyRenewals = await MealRenewal.findAll({
            where: {
                createdAt: {
                    [Op.gte]: new Date(`${currentYear}-01-01`), // Using createdAt as the renewal date
                },
            },
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: ['month'],
            order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
        });
        console.log(monthlyRenewals)
        const renewalData = new Array(12).fill(0);
        monthlyRenewals.forEach(item => {
            console.log(item.get('month'))
            console.log(item.get('count'))
            renewalData[item.get('month') - 1] = item.get('count');
            console.log(renewalData)
        });
        console.log(renewalData)
        const xaxis = moment.monthsShort();

        res.status(200).json({
            renewal_data: renewalData,
            xaxis,
        });

    } catch (error) {
        next(error);
    }
};