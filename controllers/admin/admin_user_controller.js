const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const User = require("../../models/user");
const WeightRecord = require("../../models/weight_record");
const Subscription = require("../../models/subscription");
const MealSubscription = require("../../models/meals/meal_subscription");
const WorkoutAttendance = require("../../models/fitness/workout_attendance");
const WorkoutCompletion = require("../../models/fitness/workout_completion");
const ExerciseCompletion = require("../../models/fitness/exercise_completion");
const Sport = require("../../models/sport");

// Create User
exports.createUser = async (req, res, next) => {
    const { name, email, phone, password, role, } = req.body;

    try {
        const validRoles = ["consumer", "admin", "kitchen_staff", "coach"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be one of consumer, admin, kitchen_staff, or coach." });
        }

        const existingUser = await User.findOne({
            where: { [Op.or]: [{ email }, { phone }] },
        });

        if (existingUser) {
            return res.status(400).json({ message: "User with this email or phone already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            role,
            is_verified: role === "admin" ? true : false,
        });

        res.status(201).json({
            message: "User created successfully",
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
        });
    } catch (error) {
        console.error("Error creating user:", error);
        next(error);
    }
};

// Get Active Users
exports.getUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        const users = await User.findAll({
            where: {
                is_active: true,
                ...(role && { role }),
            },
            include: { model: WeightRecord, as: "weight" },
        });

        res.status(200).json(users);
    } catch (e) {
        next(e);
    }
};

// Get Deactivated Users
exports.getDeactivatedUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        const users = await User.findAll({
            where: {
                is_active: false,
                ...(role && { role }),
            },
            include: { model: WeightRecord, as: "weight" },
        });

        res.status(200).json(users);
    } catch (e) {
        next(e);
    }
};

// Get Users with Active Subscriptions
exports.getUsersActiveSubscription = async (req, res, next) => {
    try {
        const activeUsers = await User.findAll({
            include: {
                model: Subscription,
                where: { is_active: true },
                include: { model: WeightRecord, as: "weight" },
            },
        });

        res.status(200).json({ activeUsers });
    } catch (error) {
        next(error);
    }
};

// Get User Details
exports.getUserDetails = async (req, res, next) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id, {
            include: [
                { model: Subscription, as: "fitness_subscription" },
                { model: MealSubscription, as: "diet_subscription" },
                { model: WorkoutAttendance, as: "workout_attendances" },
                { model: WorkoutCompletion, as: "workouts_completed" },
                { model: ExerciseCompletion, as: "exercises_completed" },
                { model: Sport },
            ],
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (e) {
        next(e);
    }
};

// Deactivate User
exports.deactivateUser = async (req, res, next) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.update({
            is_active: false,
            deactivated_at: new Date(),
        });

        res.status(200).json({ message: "User has been deactivated" });
    } catch (error) {
        next(error);
    }
};

// Reactivate User
exports.reactivateUser = async (req, res, next) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.update({
            is_active: true,
            deactivated_at: null,
        });

        res.status(200).json({ message: "User has been reactivated" });
    } catch (error) {
        next(error);
    }
};
