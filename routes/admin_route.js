const express = require('express');
const router = express.Router();
const activityLevelController = require('../controllers/activity_level_controller');
const healthGoalController = require('../controllers/health_goal_controller');
// const fitnessPlanController = require('../controllers/admin_fitness_plan_controller');
const imageMiddleWare = require('../middlewares/multer');
const fitnessController = require("../controllers/admin/admin_fitness_controller")
const packageController = require("../controllers/admin/admin_package_controller");
const mealPlanController = require("../controllers/admin/admin_diet_controller");
const subscriptionController = require('../controllers/admin/admin_subscription_controller');
const typeController = require("../controllers/admin/admin_type_controller")
const mealController = require("../controllers/admin/meals_controller")
const surveyController = require("../controllers/admin/admin_survey_controller")
const bannerController = require("../controllers/admin/admin_banner_controller")
const deliveryTimeController = require("../controllers/admin/admin_delivery_time_controller")
const sportsController = require("../controllers/admin/admin_sports_controller")
const notificationsController = require("../controllers/admin/admin_notifications_controller")
const userController = require("../controllers/admin/admin_user_controller")
const { body, param, validationResult, query } = require("express-validator");
const { createOrders } = require('../controllers/kitchen/orders_controller');

// // CRUD Routes for ActivityLevel
// router.post('/activity-level', activityLevelController.createActivityLevel);
// router.get('/activity-levels', activityLevelController.getActivityLevels);
// router.get('/activity-level/:activityLevelId', activityLevelController.getActivityLevelById);
// router.put('/activity-level/:activityLevelId', activityLevelController.updateActivityLevel);
// router.delete('/activity-level/:activityLevelId', activityLevelController.deleteActivityLevel);

// // CRUD Routes for HealthGoal
// router.post('/health-goal', healthGoalController.createHealthGoal);
// router.get('/health-goals', healthGoalController.getHealthGoals);
// router.get('/health-goal/:healthGoalId', healthGoalController.getHealthGoalById);
// router.put('/health-goal/:healthGoalId', healthGoalController.updateHealthGoal);
// router.delete('/health-goal/:healthGoalId', healthGoalController.deleteHealthGoal);
//CRUD Routes for fitness plan
// router.post('/fitness-plan', imageMiddleWare.uploadSingleImage(
//     "image",
// ), fitnessPlanController.createFitnessPlan);

// router.post(
//     '/fitness-plan/:fitness_plan_id/workout',
//     imageMiddleWare.uploadAnyImages(),
//     fitnessPlanController.createWorkoutWithExercises
// );
// router.get(
//     '/fitness-plan/:id',
//     fitnessPlanController.getFitnessPlanById
// )
// router.get(
//     '/fitness-plans',
//     fitnessPlanController.getFitnessPlans
// )
// router.delete(
//     '/fitness-plan/:id',
//     fitnessPlanController.deleteFitnessPlan
// )
// router.post('/group-workout', imageMiddleWare.uploadAnyImages(), fitnessController.createGroupWorkout)
router.get('/workouts', fitnessController.getWorkouts)
router.get('/workouts/:id', fitnessController.showWorkout)
//packages
router.post('/packages', packageController.createPackage);
router.get('/packages', packageController.getAllPackages);
router.get('/packages/:id', packageController.getPackageById);
router.put('/packages/:id', packageController.updatePackage);
router.delete('/packages/:id', packageController.deletePackage);
//diet
router.post('/meal-plans', imageMiddleWare.uploadSingleImage("image"), mealPlanController.createMealPlan);
router.get('/meal-plans', mealPlanController.getAllMealPlans);
router.get('/meal-plans/:id', mealPlanController.getMealPlanById);
router.put('/meal-plans/:id', mealPlanController.updateMealPlan);
router.delete('/meal-plans/:id', mealPlanController.deleteMealPlan);

router.get("/subscriptions", subscriptionController.getSubscriptions)
router.get("/meal-subscriptions", query('type').optional()
    .isIn(['weekly', 'monthly'])
    .withMessage("Invalid type. please enter a valid type"), (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            next(error);
        }
        subscriptionController.getMealSubscriptions(req, res, next);
    });
router.post("/cancel-subscription/:id", subscriptionController.cancelSubscription)
router.post("/cancel-meal-subscription/:id", subscriptionController.cancelMealSubscription)

router.post('/types', typeController.createType);
router.get('/types', typeController.getAllTypes);
router.get('/types/:id', typeController.getTypeById);
router.put('/types/:id', typeController.updateType);
router.delete('/types/:id', typeController.deleteType);

router.post("/meals", imageMiddleWare.uploadMultiImages([{ name: 'images', maxCount: 10 }]), mealController.createMeal);
router.get("/meals", mealController.getMeals);
router.get("/meals/:id", mealController.showMeal);
router.put("/meals/:id", imageMiddleWare.uploadMultiImages([{ name: 'images', maxCount: 10 }]), mealController.updateMeal);
router.delete("/meals/:id", mealController.deleteMeal);


router.get("/week", mealController.getUpcomingWeek);
router.post("/assign-meals", mealController.assignMealsToDays);
router.get("/week-meals", mealController.getMealsForWeek);

//Surveys
router.post("/surveys", surveyController.createSurvey);
router.get("/surveys", surveyController.getSurveys);
router.get("/package-survey", surveyController.getPackageSurvey);
router.get("/surveys/:id", surveyController.getSurvey);
router.put("/surveys/:id", surveyController.updateSurvey);
router.delete("/surveys/:id", surveyController.deleteSurvey);

// Question routes
router.post("/questions", imageMiddleWare.uploadSingleImage("image"), surveyController.createQuestion);
router.get("/surveys/:surveyId/questions", surveyController.getQuestions);
router.put("/questions/:id", imageMiddleWare.uploadSingleImage("image"), surveyController.updateQuestion)
router.delete("/questions/:id", surveyController.deleteQuestion)
//banner routes
router.post("/banner", imageMiddleWare.uploadSingleImage("image"), bannerController.createBanner)
router.get("/banner", bannerController.getAllBanners)
router.delete("/banner/:id", bannerController.deleteBanner)

//delivery times
router.post("/delivery-time", deliveryTimeController.createDeliveryTime);
router.get("/delivery-time", deliveryTimeController.getAllDeliveryTimes);
router.put("/delivery-time/:id", deliveryTimeController.updateDeliveryTime);
router.delete("/delivery-time/:id", deliveryTimeController.deleteDeliveryTime);

//ingredients routes
router.post("/ingredients", imageMiddleWare.uploadSingleImage("image"), mealController.createIngredient)
router.get("/ingredients", mealController.getAllIngredients)
router.put("/ingredients/:id", imageMiddleWare.uploadSingleImage("image"), mealController.updateIngredient)
router.delete("/ingredients/:id", mealController.deleteIngredient)

router.get("/orders", createOrders)

router.post("/pricing", packageController.createPricing);
router.get("/pricing", packageController.getAllPricings);
router.get("/pricing/:id", packageController.getPricingById);
router.put("/pricing/:id", packageController.updatePricing);
router.delete("/pricing/:id", packageController.deletePricing);

//Sports
router.post("/sports", sportsController.createSport);
router.get("/sports", sportsController.getAllSports);
router.put("/sports/:id", sportsController.updateSport);
router.delete("/sports/:id", sportsController.deleteSport)


//Notifications
router.post("/push-notification", notificationsController.sendPushNotification)

//users
router.post("/users/deactivate/:id", userController.deactivateUser)
router.post("/users/create", userController.createUser)
module.exports = router;