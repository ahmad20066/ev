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
const sequelize = require("../../models/index")
const Question = require('../../models/survey/question');
const UserMealSelection = require('../../models/meals/user_meal_selection');
const WorkoutRating = require('../../models/fitness/workout_rating');
const Choice = require('../../models/survey/choice');
const { startOfYear, endOfYear } = require('date-fns');
const Sport = require('../../models/sport');
const Meal = require('../../models/meals/meal');
const { sendNotification } = require('../../helpers/noitifcations_helper');
const ExerciseStat = require('../../models/fitness/exercise_stat');
const PricingModel = require('../../models/pricing_model');
exports.createWorkout = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        let { title, title_ar, user_id, description, description_ar, duration, exercises, difficulty_level, calories_burned, date, package_id, motivational_message, motivational_message_ar } = req.body;
        const coach = req.userId;
        const image = req.file.path;

        let user;
        if (user_id) {
            user = await User.findByPk(user_id);
            if (!user) {
                return res.status(404).json({ message: "User not found", message_ar: "لم يتم العثور على المستخدم" });
            }
            const subscription = await Subscription.findOne({ where: { user_id, is_active: true } });
            if (!subscription) {
                return res.status(400).json({ message: "No Active subscription for this user", message_ar: "لا يوجد اشتراك نشط لهذا المستخدم" });
            }
            package_id = subscription.package_id;
        }

        let pkg = await Package.findByPk(package_id);
        if (!pkg) {

            return res.status(404).json({ message: "Package not found", message_ar: "لم يتم العثور على الحزمة" });
        }

        const type = pkg.type;
        if (type === "personalized" && !user_id) {
            return res.status(422).json({ message: "Personalized workouts require a user id", message_ar: "التمارين الشخصية تتطلب معرف المستخدم" });
        }
        if (type === "group" && user_id) {
            user_id = undefined;
        }

        const previousWorkout = await Workout.findOne({ where: { date, package_id, is_active: true } });
        if (previousWorkout) {
            previousWorkout.is_active = false;
            await previousWorkout.save();
        }

        const workout = await Workout.create({
            title,
            title_ar,
            description,
            description_ar,
            type,
            duration,
            difficulty_level,
            // calories_burned,
            coach,
            date,
            user_id,
            package_id,
            motivational_message,
            motivational_message_ar,
            image,
            is_template: false,
        }, { transaction: t });

        await Promise.all(exercises.map(async (exercise) => {
            await WorkoutExercise.create({ workout_id: workout.id, exercise_id: exercise.exercise_id }, { transaction: t });
        }));

        const template = await Workout.create({
            title,
            title_ar,
            description,
            description_ar,
            type,
            duration,
            difficulty_level,
            // calories_burned,
            coach,
            date: null,
            user_id: null,
            package_id,
            motivational_message,
            motivational_message_ar,
            image,
            is_template: true,
        }, { transaction: t });

        await Promise.all(exercises.map(async (exercise) => {
            await WorkoutExercise.create({ workout_id: template.id, exercise_id: exercise.exercise_id }, { transaction: t });
        }));
        if (type == "personalized") {
            const requests = await WorkoutRequest.findAll({
                where: {
                    user_id,
                    package_id
                }
            })
            requests.forEach(async e => {
                await e.destroy()
            })
        }

        await t.commit();

        const workoutWithExercises = await Workout.findByPk(workout.id, { include: [{ model: Exercise, as: 'exercises' }] });

        if (type === 'personalized' && user) {
            sendNotification(user.id, user.fcm_token, "Coach created your workout", "Coach created your workout you can now view it", { workout_id: workout.id, type: "workout_created" });
        }

        res.status(201).json({
            message: "Workout created and saved to library",
            message_ar: "تم إنشاء التمرين وتم حفظه في المكتبة",
            workout: workoutWithExercises
        });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};


const copyWorkoutExercises = async (fromId, toId, t) => {
    const list = await WorkoutExercise.findAll({ where: { workout_id: fromId }, transaction: t });
    await Promise.all(
        list.map((e) =>
            WorkoutExercise.create(
                { workout_id: toId, exercise_id: e.exercise_id },
                { transaction: t },
            ),
        ),
    );
};
exports.createWorkoutTemplate = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const {
            title, title_ar, description, description_ar,
            duration, exercises, difficulty_level, calories_burned,
            motivational_message, motivational_message_ar
        } = req.body;

        const coach = req.userId;
        const image = req.file ? req.file.path : null;

        const workout = await Workout.create({
            title,
            title_ar,
            description,
            description_ar,
            duration,
            difficulty_level,
            // calories_burned,
            coach,
            motivational_message,
            motivational_message_ar,
            image,
            type: "group",   // placeholder; real type chosen at instantiation
            date: null,
            user_id: null,
            package_id: null,
            is_template: true
        }, { transaction: t });

        await Promise.all(
            exercises.map(e =>
                WorkoutExercise.create(
                    { workout_id: workout.id, exercise_id: e.exercise_id },
                    { transaction: t }
                )
            )
        );

        await t.commit();
        res.status(201).json({
            message: "Template saved to library",
            message_ar: "تم حفظ التمرين في المكتبة",
            workout
        });
    } catch (err) {
        await t.rollback();
        next(err);
    }
};

exports.createWorkoutFromTemplate = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { template_id, date, user_id, difficulty_level, calories_burned } = req.body;

        const template = await Workout.findByPk(template_id, { transaction: t });
        if (!template || !template.is_template) {
            await t.rollback();
            return res.status(404).json({ message: "Template not found", message_ar: "لم يتم العثور على التمرين في المكتبة" });
        }

        const subscription = await Subscription.findOne({
            where: { user_id: user_id, is_active: true },
            transaction: t
        });

        if (!subscription) {
            await t.rollback();
            return res.status(404).json({ message: "No active subscription found", message_ar: "لم يتم العثور على اشتراك نشط" });
        }

        const package_id = subscription.package_id;
        const pkg = await Package.findByPk(package_id, { transaction: t });
        if (!pkg) {
            await t.rollback();
            return res.status(404).json({ message: "Package not found", message_ar: "لم يتم العثور على الحزمة" });
        }

        const type = pkg.type;
        if (type === "personalized" && !user_id) {
            await t.rollback();
            return res.status(422).json({ message: "Personalized workout needs user_id", message_ar: "التمارين الشخصية تتطلب معرف المستخدم" });
        }

        const existing = await Workout.findOne({ where: { date, package_id, is_Active: true }, transaction: t });
        if (existing) {
            existing.is_Active = false;
            await existing.save({ transaction: t });
        }

        const workout = await Workout.create({
            ...template.get({ plain: true }),
            id: undefined,
            type,
            date,
            user_id: type === "group" ? null : user_id,
            package_id,
            difficulty_level: difficulty_level ?? template.difficulty_level,
            // calories_burned: calories_burned ?? template.calories_burned,
            is_template: false,
            template_id: template.id,
            createdAt: undefined,
            updatedAt: undefined
        }, { transaction: t });

        await copyWorkoutExercises(template.id, workout.id, t);
        await t.commit();
        res.status(201).json({ message: "Workout created from template", message_ar: "تم إنشاء التمرين من المكتبة", workout });
    } catch (err) {
        await t.rollback();
        next(err);
    }
};

exports.updateWorkoutTemplate = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            title, title_ar, description, description_ar,
            duration, exercises, difficulty_level, calories_burned,
            motivational_message, motivational_message_ar
        } = req.body;

        const workout = await Workout.findByPk(id, { transaction: t });
        if (!workout || !workout.is_template) {
            await t.rollback();
            return res.status(404).json({ message: "Template not found", message_ar: "لم يتم العثور على القالب" });
        }

        const image = req.file ? req.file.path : workout.image;

        Object.assign(workout, {
            title: title ?? workout.title,
            title_ar: title_ar ?? workout.title_ar,
            description: description ?? workout.description,
            description_ar: description_ar ?? workout.description_ar,
            duration: duration ?? workout.duration,
            difficulty_level: difficulty_level ?? workout.difficulty_level,
            // calories_burned: calories_burned ?? workout.calories_burned,
            motivational_message: motivational_message ?? workout.motivational_message,
            motivational_message_ar: motivational_message_ar ?? workout.motivational_message_ar,
            image
        });

        await workout.save({ transaction: t });

        if (exercises) {
            await WorkoutExercise.destroy({ where: { workout_id: id }, transaction: t });
            await Promise.all(exercises.map(e =>
                WorkoutExercise.create({ workout_id: id, exercise_id: e.exercise_id }, { transaction: t })
            ));
        }

        await t.commit();
        res.status(200).json({ message: "Template updated", message_ar: "تم تحديث القالب", workout });
    } catch (err) {
        await t.rollback();
        next(err);
    }
};

exports.deleteWorkoutTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const template = await Workout.findByPk(id);
        if (!template || !template.is_template) {
            return res.status(404).json({ message: "Template not found", message_ar: "لم يتم العثور على القالب" });
        }
        await WorkoutExercise.destroy({ where: { workout_id: id } });
        await template.destroy();
        res.status(200).json({ message: "Template deleted", message_ar: "تم حذف القالب" });
    } catch (err) {
        next(err);
    }
};

exports.getAllWorkoutTemplates = async (req, res, next) => {
    try {
        const templates = await Workout.findAll({
            where: { is_template: true },
            include: [{ model: Exercise, as: 'exercises', through: { attributes: [] } }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(templates);
    } catch (err) {
        next(err);
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

                    }
                },
                {
                    model: WorkoutRating,
                    as: "reviews",
                }
            ]
        });

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found', message_ar: "لم يتم العثور على التمرين" });
        }

        res.status(200).json({ workout });
    } catch (error) {
        next(error);
    }
};

exports.updateWorkout = async (req, res, next) => {
    try {
        const workoutId = req.params.id;
        const { title, type, description, duration, difficulty_level, calories_burned, date, exercises, package_id } = req.body;

        const workout = await Workout.findByPk(workoutId);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        workout.title = title || workout.title;
        workout.type = type || workout.type;
        workout.description = description || workout.description;
        workout.duration = duration || workout.duration;
        workout.difficulty_level = difficulty_level || workout.difficulty_level;
        // workout.calories_burned = calories_burned || workout.calories_burned;
        workout.package_id = package_id || workout.package_id;
        workout.date = date || workout.date;

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
                const { exercise_id } = exercise;

                const existingExercise = await WorkoutExercise.findOne({
                    where: { workout_id: workoutId, exercise_id },
                });

                if (existingExercise) {

                    await existingExercise.destroy();
                } else {
                    await WorkoutExercise.create({
                        workout_id: workoutId,
                        exercise_id,

                    });
                }
            }));
        }

        const updatedWorkout = await Workout.findByPk(workoutId, {
            include: [{
                model: Exercise,
                as: 'exercises',

            }],
        });

        res.status(200).json({ message: 'Workout updated successfully', message_ar: "تم تعديل التمرين بنجاح", workout: updatedWorkout });
    } catch (error) {
        next(error);
    }
};
exports.deleteWorkout = async (req, res, next) => {
    try {
        const workoutId = req.params.id;
        const workout = await Workout.findByPk(workoutId);
        if (!workout) {
            return res.status(404).json({ message: "Workout not found", message_ar: "لم يتم العثور على التمرين" });
        }
        await workout.destroy();
        res.status(200).json({ message: "Workout deleted successfully", message_ar: "تم حذف التمرين بنجاح" });
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
exports.searchUser = async (req, res, next) => {
    try {
        const { role } = req.query;

        const conditions = {
            is_active: true,
            ...(role && { role }),

        };

        const users = await User.findAndCountAll({
            where: conditions,
            attributes: [
                'name',
                'id',
                'phone',
                'email',
                'role'
            ],
            include: {
                model: WeightRecord,
                as: "weight-record",
                required: false,
            },

        });

        if (users.rows.length === 0) {
            return res.status(404).json({ message: "No users found." });
        }

        res.status(200).json({
            message: "Users fetched successfully",

            users: users.rows,
        });
    } catch (error) {
        console.error("Error searching users:", error);
        next(error);
    }
};
exports.getFitnessSubscriptions = async (req, res, next) => {
    const { id } = req.params;
    try {
        const subscriptions = await Subscription.findAll({
            where: { user_id: id },
            include: [{
                model: Package,
                as: "package",
                // attributes: ['name', 'description', 'price'],
            },
            {
                model: PricingModel,
                as: "pricing",
                // attributes: ['prici']
            }
            ],
            order: [['created_at', 'DESC']]
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
            include: [
                {
                    model: Sport,
                    as: "sport"
                },
                {
                    model: Subscription,
                    as: "fitness_subscriptions",
                    include: {
                        model: Package,
                        as: "package",
                        attributes: ['type'] // Include only the type of the package
                    },
                    where: {
                        is_active: true
                    },
                    required: false // Allow users without active subscriptions
                }
            ]
        });

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        // Determine if the package type is personalized
        const hasActiveSubscription = user.fitness_subscriptions && user.fitness_subscriptions.length > 0;
        const isPersonalized = hasActiveSubscription
            ? user.fitness_subscriptions[0].package.type === "personalized"
            : false;

        // Add isPersonalized field to the user object
        user.dataValues.isPersonalized = isPersonalized;

        // Remove unnecessary field
        delete user.dataValues.fitness_subscriptions;

        res.status(200).json(user);
    } catch (e) {
        next(e);
    }
};
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
        const { user_id, date } = req.query
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
                date,
                is_active: true
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
};
exports.getDatesForMonth = async (req, res, next) => {
    try {
        const today = new Date();
        const dates = [];

        for (let i = 0; i < 30; i++) {
            let futureDate = new Date();
            futureDate.setDate(today.getDate() + i);
            const formattedDate = futureDate.toISOString().split('T')[0];
            const dayOfWeek = futureDate.toLocaleString('en-US', { weekday: 'long' });
            dates.push({ date: formattedDate, day: dayOfWeek });
        }

        res.status(200).json({ dates });
    } catch (error) {
        next(error);
    }
};
exports.getGroupWorkouts = async (req, res, next) => {
    try {
        const { package_id, date } = req.query

        const workout = await Workout.findOne({
            where: {
                package_id,
                date,
                is_active: true
            },
            include: [
                {
                    model: Exercise,
                    as: 'exercises',

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
};
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



