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
const { body, param, validationResult, query } = require("express-validator");

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

router.post('/types', typeController.createType);
router.get('/types', typeController.getAllTypes);
router.get('/types/:id', typeController.getTypeById);
router.put('/types/:id', typeController.updateType);
router.delete('/types/:id', typeController.deleteType);

router.post("/meals", imageMiddleWare.uploadSingleImage("image"), mealController.createMeal);
router.get("/meals", mealController.getMeals);
router.get("/meals/:id", mealController.showMeal);
router.put("/meals/:id", mealController.updateMeal);
router.delete("/meals/:id", mealController.deleteMeal);


router.get("/week", mealController.getUpcomingWeek);
router.post("/assign-meals", mealController.assignMealsToDays);
router.get("/week-meals", mealController.getMealsForWeek);

//Surveys
router.post("/surveys", surveyController.createSurvey);
router.get("/surveys", surveyController.getSurveys);
router.get("/surveys/:id", surveyController.getSurvey);
router.put("/surveys/:id", surveyController.updateSurvey);
router.delete("/surveys/:id", surveyController.deleteSurvey);

// Question routes
router.post("/questions", imageMiddleWare.uploadSingleImage("image"), surveyController.createQuestion);
router.get("/surveys/:surveyId/questions", surveyController.getQuestions);

module.exports = router;