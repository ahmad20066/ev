// const HealthGoal = require("../models/health_goal")
// exports.createHealthGoal = async (req, res, next) => {
//     const { goal_name, description } = req.body;

//     try {
//         const newHealthGoal = await HealthGoal.create({
//             goal_name,
//             description
//         });

//         res.status(201).json({
//             message: 'Health goal created successfully!',
//             healthGoal: newHealthGoal
//         });
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// };
// exports.getHealthGoals = async (req, res, next) => {
//     try {
//         const healthGoals = await HealthGoal.findAll();
//         res.status(200).json(healthGoals);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// };
// exports.getHealthGoalById = async (req, res, next) => {
//     const { healthGoalId } = req.params;

//     try {
//         const healthGoal = await HealthGoal.findByPk(healthGoalId);

//         if (!healthGoal) {
//             return res.status(404).json({ message: 'Health goal not found.' });
//         }

//         res.status(200).json(healthGoal);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// };
// exports.updateHealthGoal = async (req, res, next) => {
//     const { healthGoalId } = req.params;
//     const { goal_name, description } = req.body;

//     try {
//         const healthGoal = await HealthGoal.findByPk(healthGoalId);

//         if (!healthGoal) {
//             return res.status(404).json({ message: 'Health goal not found.' });
//         }

//         healthGoal.goal_name = goal_name;
//         healthGoal.description = description;
//         await healthGoal.save();

//         res.status(200).json({
//             message: 'Health goal updated successfully!',
//             healthGoal
//         });
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// };
// exports.deleteHealthGoal = async (req, res, next) => {
//     const { healthGoalId } = req.params;

//     try {
//         const healthGoal = await HealthGoal.findByPk(healthGoalId);

//         if (!healthGoal) {
//             return res.status(404).json({ message: 'Health goal not found.' });
//         }

//         await healthGoal.destroy();
//         res.status(200).json({ message: 'Health goal deleted successfully!' });
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// };
