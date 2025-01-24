const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const WeightRecord = require("../models/weight_record");
const Sport = require("../models/sport");
const axios = require("axios")

const JWT_SECRET = "ahmad_secret";



let otpStore = {};

// Function to send OTP via SMS
const sendOtpSms = async (phoneNumber, otp) => {
    const apiUrl = "http://YOUR_API_URL/api/SendSMS";
    const payload = {
        api_id: process.env.SMS_API_ID,
        api_password: process.env.SMS_API_PASSWORD,
        sms_type: "T",
        encoding: "T",
        sender_id: "ASMSC",
        phonenumber: phoneNumber,
        textmessage: `Your OTP code is ${otp}`,
        uid: "xyz",
        callback_url: "https://xyz.com/",
        ValidityPeriodInSeconds: 300
    };

    try {
        const response = await axios.post(apiUrl, payload);
        console.log("OTP sent successfully", response.data);
    } catch (error) {
        console.error("Error sending OTP", error);
        throw new Error("Failed to send OTP");
    }
};
exports.sendOtp = async (req, res, next) => {
    const { method, email, phone } = req.body;

    try {
        // Validate method
        if (!['email', 'phone'].includes(method)) {
            return res.status(400).json({ error: "Invalid verification method. Choose 'email' or 'phone'." });
        }

        // Handle email verification
        if (method === 'email') {
            if (!email) {
                return res.status(400).json({ error: "Email is required for email verification." });
            }

            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ error: "User with this email not found." });
            }

            const otp = Math.floor(1000 + Math.random() * 9000);
            const expiry = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
            otpStore[email] = { otp, expiry };
            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            await transporter.sendMail({
                from: "a.afif@tgmena.com",
                to: email,
                subject: "Your OTP Code",
                text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
            });

            console.log(`OTP sent to email: ${email} (OTP: ${otp})`);
            return res.status(200).json({ message: "OTP sent to your email." });
        }

        // Handle phone verification
        if (method === 'phone') {
            if (!phone) {
                return res.status(400).json({ error: "Phone number is required for phone verification." });
            }

            const user = await User.findOne({ where: { phone } });
            if (!user) {
                return res.status(404).json({ error: "User with this phone number not found." });
            }

            const otp = Math.floor(100000 + Math.random() * 900000);
            const expiry = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
            otpStore[phone] = { otp, expiry };

            await sendOtpSms(phone, otp); // Function to send OTP via SMS

            console.log(`OTP sent to phone: ${phone} (OTP: ${otp})`);
            return res.status(200).json({ message: "OTP sent to your phone." });
        }
    } catch (error) {
        console.error("Error in sendOtp:", error);
        error.statusCode = 500;
        next(error);
    }
};



exports.setUpProfile = async (req, res, next) => {
    const userId = req.userId;
    const { age, gender, weight, height, goal, dietary_preferences, fitness_level, sport_duration, sport, training_location } = req.body;

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

        user.goal = goal;
        user.dietary_preferences = dietary_preferences;
        user.fitness_level = fitness_level;
        user.is_set_up = true;
        user.training_location = training_location;
        user.sport_duration = sport_duration;
        user.sport_id = sport
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
exports.getAllSports = async (req, res, next) => {
    try {
        const sports = await Sport.findAll({
            where: {
                is_active: true
            }
        });
        res.status(200).json(sports);
    } catch (error) {
        next(error);
    }
};
exports.register = async (req, res, next) => {
    const { name, email, phone, password, role, fcm_token } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            if (!existingUser.is_active) {
                existingUser.name = name;
                existingUser.phone = phone;
                existingUser.password = await bcrypt.hash(password, 10);
                existingUser.role = role;
                existingUser.is_active = true;
                existingUser.deactivated_at = null;
                existingUser.fcm_token = fcm_token
                await existingUser.save();

                const otp = Math.floor(100000 + Math.random() * 900000);
                otpStore[email] = { otp, expiry: Date.now() + 5 * 60 * 1000 };

                // await sendOtpSms(phone, otp);

                // const token = jwt.sign(
                //     { userId: existingUser.id, role: existingUser.role, is_set_up: existingUser.is_set_up },
                //     JWT_SECRET,
                //     { expiresIn: "1h" }
                // );

                return res.status(200).json({
                    message: "User registered successfully. Please verify your account",
                    user: { email: existingUser.email },
                    // token
                });
            } else {
                const error = new Error("User already exists.");
                error.statusCode = 422;
                throw error;
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
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
            goal: null,
            dietary_preferences: null,
            fitness_level: null,
            fcm_token: fcm_token
        });

        const otp = Math.floor(100000 + Math.random() * 900000);
        // otpStore[email] = { otp, expiry: Date.now() + 5 * 60 * 1000 };

        // await sendOtpSms(phone, otp);

        // const token = jwt.sign({ userId: newUser.id, role: newUser.role, is_set_up: newUser.is_set_up }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
            message: "User registered successfully. Please verify your account",
            user: { email: newUser.email },
            // token
        });
    } catch (error) {
        console.log(error);
        if (error.name === "SequelizeUniqueConstraintError") {
            const message = error.errors[0].message.includes("phone")
                ? "A user with this phone number already exists."
                : "A user with this email already exists.";
            return res.status(422).json({ error: error.errors[0].message });
        }

        if (error.name === "SequelizeValidationError") {
            return res.status(422).json({ error: error.errors[0].message });
        }
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
        if (user.is_blocked) {
            let error = new Error("You have been blocked");
            error.statusCode = 403;
            throw error
        }
        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;
        const token = jwt.sign({ userId: user.id, role: user.role, is_set_up: user.is_set_up }, JWT_SECRET, { expiresIn: "7d" });
        if (!user.is_set_up && user.role != "admin") {
            return res.status(200).json({
                message: "Please setup your profile",
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
exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email, is_active: true } });

        if (!user) {
            return res.status(404).json({ error: "User not found or account is inactive." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiry = Date.now() + 5 * 60 * 1000;

        otpStore[email] = { otp, expiry };

        await sendOtp(email, otp);

        res.status(200).json({
            message: "OTP sent successfully to reset your password.",
        });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};


exports.verifyOtp = async (req, res, next) => {
    const { method, email, phone, otp } = req.body;

    try {
        if (method === 'email') {
            const otpData = otpStore[email];

            if (!otpData || otpData.expiry < Date.now()) {
                return res.status(400).json({ error: "OTP expired or invalid." });
            }

            if (otpData.otp !== parseInt(otp)) {
                return res.status(400).json({ error: "Invalid OTP." });
            }

            delete otpStore[email];

            const user = await User.findOne({ where: { email } });
            if (user) {
                user.is_verified = true;
                await user.save();
            }
            const token = jwt.sign({ userId: user.id, role: user.role, is_set_up: user.is_set_up }, JWT_SECRET, { expiresIn: "7d" });
            if (!user.is_set_up && user.role != "admin") {
                return res.status(200).json({
                    message: "Please setup your profile",
                    token,
                    user
                })
            }
            return res.status(200).json({ message: "Email verified successfully." });
        }

        if (method === 'phone') {
            const otpData = otpStore[phone];

            if (!otpData || otpData.expiry < Date.now()) {
                return res.status(400).json({ error: "OTP expired or invalid." });
            }

            if (otpData.otp !== parseInt(otp)) {
                return res.status(400).json({ error: "Invalid OTP." });
            }

            delete otpStore[phone];

            const user = await User.findOne({ where: { phone } });
            if (user) {
                user.is_verified = true;
                await user.save();
            }

            const token = jwt.sign({ userId: user.id, role: user.role, is_set_up: user.is_set_up }, JWT_SECRET, { expiresIn: "7d" });
            if (!user.is_set_up && user.role != "admin") {
                return res.status(200).json({
                    message: "Please setup your profile",
                    token,
                    user
                })
            }
            return res.status(200).json({ message: "Phone verified successfully." });
        }

        res.status(400).json({ error: "Invalid verification method." });
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
            message: "Weight Set Successfully"
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
            message: "Account Deleted Successfully"
        })
    } catch (e) {
        next(e)
    }
}
exports.resetPassword = async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    try {
        const otpData = otpStore[email];

        // if (!otpData || otpData.expiry < Date.now()) {
        //     return res.status(400).json({ error: "OTP expired or invalid." });
        // }

        // if (otpData.otp !== parseInt(otp)) {
        //     return res.status(400).json({ error: "Invalid OTP." });
        // }

        delete otpStore[email];

        const user = await User.findOne({ where: { email, is_active: true, is_blocked: false } });

        if (!user) {
            return res.status(404).json({ error: "User not found or account is inactive." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            message: "Password reset successfully.",
        });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};

