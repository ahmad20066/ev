const express = require('express');
const router = express.Router();
const activityLevelController = require('../controllers/activity_level_controller');
const healthGoalController = require('../controllers/health_goal_controller');
// const fitnessPlanController = require('../controllers/admin_fitness_plan_controller');
const imageMiddleWare = require('../middlewares/multer');
const fitnessController = require("../controllers/admin/admin_fitness_controller")
const packageController = require("../controllers/admin/admin_package_controller");
const mealPlanController = require("../controllers/admin/admin_diet_controller")

// CRUD Routes for ActivityLevel
router.post('/activity-level', activityLevelController.createActivityLevel);
router.get('/activity-levels', activityLevelController.getActivityLevels);
router.get('/activity-level/:activityLevelId', activityLevelController.getActivityLevelById);
router.put('/activity-level/:activityLevelId', activityLevelController.updateActivityLevel);
router.delete('/activity-level/:activityLevelId', activityLevelController.deleteActivityLevel);

// CRUD Routes for HealthGoal
router.post('/health-goal', healthGoalController.createHealthGoal);
router.get('/health-goals', healthGoalController.getHealthGoals);
router.get('/health-goal/:healthGoalId', healthGoalController.getHealthGoalById);
router.put('/health-goal/:healthGoalId', healthGoalController.updateHealthGoal);
router.delete('/health-goal/:healthGoalId', healthGoalController.deleteHealthGoal);
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
module.exports = router;