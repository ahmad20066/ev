
const dbConfig = require('../config/db_config');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(dbConfig.DATABASE, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.DIALECT
});

module.exports = sequelize;


const Workout = require('./fitness/workout');
const Exercise = require('./fitness/exercise');
// const WorkoutSession = require("./fitness/workout_session")
const Package = require('./package')
const Subscription = require('./subscription');

const MealPlan = require('./meals/meal_plan');
const MealSubscription = require('./meals/meal_subscription');
const PricingModel = require('./pricing_model');
const Chat = require('./chat/chat');
const Message = require('./chat/message');
const User = require('./user');
const WeightRecord = require('./weight_record');
const WorkoutAttendance = require('./fitness/workout_attendance');
const WorkoutCompletion = require('./fitness/workout_completion');
const ExerciseCompletion = require('./fitness/exercise_completion');
const WorkoutExercise = require('./fitness/workout_exercise');
const Meal = require('./meals/meal');
const UserMealSelection = require('./meals/user_meal_selection');
const Type = require('./meals/type');
const MealPlanType = require('./meals/meal_plan_type');
const MealType = require('./meals/meal_type');
const MealDay = require('./meals/meal_day');
const Question = require('./survey/question');
const Survey = require('./survey/survey');
const WorkoutRequest = require('./fitness/user_workout_request');
const Answer = require('./survey/answer');
const ExerciseStat = require('./fitness/exercise_stat');
const DeliveryTime = require('./meals/delivery_time');
const Address = require('./meals/address');
// Package.hasMany(Workout, { foreignKey: "package_id" });
// Workout.belongsTo(Package, { foreignKey: "package_id" });

// Workout.hasMany(WorkoutSession, { foreignKey: "workout_id" });


// Workout.hasMany(Exercise, { foreignKey: "workout_id", as: "exercises" });
// Exercise.belongsTo(Workout, { foreignKey: "workout_id" });

Workout.belongsTo(sequelize.models.User, { foreignKey: "user_id" });
Package.hasMany(Subscription, { foreignKey: "package_id" });
Package.hasMany(PricingModel, { foreignKey: "package_id", as: "pricings" })
Subscription.belongsTo(Package, { foreignKey: "package_id", as: "package" });
Subscription.belongsTo(PricingModel, { foreignKey: "pricing_id", as: "pricing" });
MealSubscription.belongsTo(MealPlan, { foreignKey: "meal_plan_id", as: "meal_plan" });
MealPlan.hasMany(MealSubscription, { foreignKey: "meal_plan_id", as: "subscriptions" });

Chat.hasMany(Message, { foreignKey: "chat_id", as: "messages" });
Message.belongsTo(Chat, { foreignKey: "chat_id" })
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

User.hasMany(Chat, { foreignKey: 'user_id', as: 'userChats' });
User.hasMany(Chat, { foreignKey: 'coach_id', as: 'coachChats' });
Chat.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Chat.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

WeightRecord.belongsTo(User, { foreignKey: "user_id" })
User.hasMany(WeightRecord, { foreignKey: "user_id", as: "weight-record" })

User.hasMany(Subscription, { foreignKey: "user_id", as: "fitness_subscriptions" })
Subscription.belongsTo(User, { foreignKey: "user_id", as: "user" })
User.hasMany(MealSubscription, { foreignKey: "user_id", as: "diet_subscriptions" })
MealSubscription.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(WorkoutAttendance, { foreignKey: "user_id", as: "workout_attendances" })
User.hasMany(WorkoutCompletion, { foreignKey: "user_id", as: "workouts_completed" })
WorkoutCompletion.belongsTo(Workout, { foreignKey: "workout_id", as: "workout" })
WorkoutAttendance.belongsTo(Workout, { foreignKey: "workout_id", as: "workout" })
User.hasMany(ExerciseCompletion, { foreignKey: "user_id", as: "exercises_completed" })
ExerciseCompletion.belongsTo(User, { foreignKey: "user_id", as: "user" })
WorkoutExercise.belongsTo(Exercise, { foreignKey: "exercise_id", as: "exercise" })


Meal.hasMany(UserMealSelection, { as: "selections", foreignKey: 'meal_id' });
UserMealSelection.belongsTo(Meal, { as: "meal", foreignKey: 'meal_id' });
User.hasMany(UserMealSelection, { as: "meal_selections", foreignKey: "user_id" })
UserMealSelection.belongsTo(User, { as: "user", foreignKey: "user_id" })



Meal.hasMany(MealType, { as: 'mealTypes', foreignKey: 'meal_id' });
MealType.belongsTo(Meal, { as: 'meal', foreignKey: 'meal_id' });

Type.hasMany(MealType, { as: 'mealTypes', foreignKey: 'type_id' });
MealType.belongsTo(Type, { as: 'type', foreignKey: 'type_id' });

// One-to-Many: Type -> MealPlanType
Type.hasMany(MealPlanType, { as: 'mealPlanTypes', foreignKey: 'type_id' });
MealPlanType.belongsTo(Type, { as: 'type', foreignKey: 'type_id' });

MealPlan.hasMany(MealPlanType, { as: 'mealPlanTypes', foreignKey: 'meal_plan_id' });
MealPlanType.belongsTo(MealPlan, { as: 'mealPlan', foreignKey: 'meal_plan_id' });

MealPlan.belongsToMany(Type, { through: MealPlanType, as: 'types', foreignKey: 'meal_plan_id' });
Type.belongsToMany(MealPlan, { through: MealPlanType, as: 'mealPlans', foreignKey: 'type_id' });

Meal.belongsToMany(Type, { through: MealType, as: 'types', foreignKey: 'meal_id' });
Type.belongsToMany(Meal, { through: MealType, as: 'meals', foreignKey: 'type_id' });

Meal.hasMany(MealDay, { as: "meal", foreignKey: "meal_id" })
MealDay.belongsTo(Meal, { as: "meal", foreignKey: "meal_id" })

Survey.hasMany(Question, { as: "questions", foreignKey: "survey_id" })
User.hasMany(Answer, { as: "survey_answers", foreignKey: "user_id" })
Question.hasMany(Answer, { as: "answers", foreignKey: "qustion_id" })
Answer.belongsTo(Question, { as: "question", foreignKey: "qustion_id" })

User.hasMany(WorkoutRequest, { as: "requests", foreignKey: "user_id" })
WorkoutRequest.belongsTo(User, { as: "user", foreignKey: "user_id" })
Package.hasMany(WorkoutRequest, { as: "requests", foreignKey: "package_id" })
WorkoutRequest.belongsTo(Package, { as: "package", foreignKey: "package_id" })

ExerciseCompletion.hasMany(ExerciseStat, {
    foreignKey: "exercise_completion_id"
});
ExerciseStat.belongsTo(ExerciseCompletion, {
    foreignKey: "exercise_completion_id"
});

MealSubscription.belongsTo(DeliveryTime, { as: "delivery_time", foreignKey: "delivery_time_id" })

MealSubscription.belongsTo(Address, { foreignKey: "address_id", as: "address" });
Address.hasMany(MealSubscription, { foreignKey: "address_id" });