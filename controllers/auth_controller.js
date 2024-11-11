const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const WeightRecord = require("../models/weight_record");

const JWT_SECRET = "ahmad_secret";

let otpStore = {};

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "your-email@gmail.com",
        pass: "your-email-password",
    },
});

const sendOtp = async (email, otp) => {
    const mailOptions = {
        from: "your-email@gmail.com",
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}`,
    };

    await transporter.sendMail(mailOptions);
};

exports.setUpProfile = async (req, res, next) => {
    const userId = req.userId;
    const { age, gender, weight, height, activity_level, health_goal, dietary_preferences, fitness_level } = req.body;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }


        user.age = age;
        user.gender = gender;
        const weightRecord = new WeightRecord({
            user_id: userId,
            weight
        })
        await weightRecord.save()
        user.height = height;
        user.activity_level_id = activity_level;
        user.health_goal_id = health_goal;
        user.dietary_preferences = dietary_preferences;
        user.fitness_level = fitness_level;
        user.is_set_up = true;
        await user.save();

        res.status(200).json({
            message: "Profile setup successfully",
            user,
        });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};

exports.register = async (req, res, next) => {
    const { name, email, phone, password, role } = req.body;

    try {
        if (role != "coach" && role != "consumer") {
            const error = new Error("Please Enter a valid role")
            error.statusCode = 422;
            next(error)
            return
        }
        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            if (!existingUser.is_active) {
                existingUser.name = name;
                existingUser.phone = phone;
                existingUser.password = await bcrypt.hash(password, 10);
                existingUser.role = role;
                existingUser.is_active = true;
                existingUser.deactivated_at = null;
                await existingUser.save();

                const token = jwt.sign(
                    { userId: existingUser.id, role: existingUser.role, is_set_up: existingUser.is_set_up },
                    JWT_SECRET,
                    { expiresIn: "1h" }
                );

                return res.status(200).json({
                    message: "User registered successfully. OTP sent to your email",
                    user: { email: existingUser.email },
                    token
                });
            } else {
                const error = new Error("User already exists.");
                error.statusCode = 422;
                throw error;
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(role)
        const newUser = await User.create({
            name: name,
            email,
            phone: phone,
            password: hashedPassword,
            role: role,
            age: null,
            gender: null,
            height: null,
            activity_level: null,
            health_goal: null,
            dietary_preferences: null,
            fitness_level: null,
        });

        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiry = Date.now() + 5 * 60 * 1000;

        // otpStore[email] = { otp, expiry };

        // await sendOtp(email, otp);
        const token = jwt.sign({ userId: newUser.id, role: newUser.role, is_set_up: newUser.is_set_up }, JWT_SECRET, { expiresIn: "1h" })
        res.status(201).json({
            message: "User registered successfully. OTP sent to your email.",
            user: { email: newUser.email },
            token
        });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};


exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.scope('withPassword').findOne({ where: { email, is_active: true } });
        if (!user) {
            let error = new Error("Invalid email or password");
            error.statusCode = 400;
            throw error
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            let error = new Error("Invalid email or password");
            error.statusCode = 400;
            throw error
        }

        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;
        const token = jwt.sign({ userId: user.id, role: user.role, is_set_up: user.is_set_up }, JWT_SECRET, { expiresIn: "1h" });
        if (!user.is_set_up && user.role != "admin") {
            return res.status(409).json({
                Message: "Please setup your profile",
                token,
                user
            })
        }
        return res.status(200).json({
            message: "Login successful",
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }

        next(error);
    }
};

exports.sendOtp = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(400).json({ error: "User not found." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiry = Date.now() + 5 * 60 * 1000;

        otpStore[email] = { otp, expiry };

        await sendOtp(email, otp);

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};

exports.verifyOtp = async (req, res, next) => {
    const { email, otp } = req.body;

    try {
        const otpData = otpStore[email];
        if (!otpData || otpData.expiry < Date.now()) {
            return res.status(400).json({ error: "OTP expired or invalid." });
        }

        if (otpData.otp !== parseInt(otp)) {
            return res.status(400).json({ error: "Invalid OTP." });
        }


        delete otpStore[email];

        const user = await User.findOne({ where: { email } });


        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: "OTP verified successfully",
            token,
        });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
exports.setNewWeight = async (req, res, next) => {
    try {
        const { weight } = req.body
        const user_id = req.userId
        const weightRecord = new WeightRecord({
            user_id,
            weight
        })
        await weightRecord.save()
        res.status(200).json({
            Message: "Weight Set Successfully"
        })
    } catch (e) {
        next(e)
    }
}
exports.deleteAccount = async (req, res, next) => {
    try {
        const user_id = req.userId;
        const user = await User.findOne({
            where: {
                id: user_id,
                is_active: true
            }
        })
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404
            throw error;
        }
        user.is_active = false
        user.deactivated_at = new Date()
        await user.save()
        res.status(201).json({
            Message: "Account Deleted Successfully"
        })
    } catch (e) {
        next(e)
    }
}
