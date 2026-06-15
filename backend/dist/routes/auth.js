"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const notifications_1 = require("../services/notifications");
const router = (0, express_1.Router)();
// REGISTER - Create new user
router.post("/register", async (req, res) => {
    try {
        const { email, password, displayName, phone } = req.body;
        // Validate input
        if (!email || !password || !displayName) {
            return res.status(400).json({
                error: "Email, password, and display name are required",
            });
        }
        // Check if user exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        // Create new user
        const user = new User_1.default({
            email,
            password,
            displayName,
            phone,
        });
        await user.save();
        // Generate token
        const token = (0, auth_1.generateToken)(user._id.toString());
        // Return user data (without password)
        const userResponse = {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            phone: user.phone,
            token,
        };
        return res.status(201).json({
            message: "User registered successfully",
            user: userResponse,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ error: "Registration failed" });
    }
});
// LOGIN - Authenticate user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }
        // Find user and include password field
        const user = await User_1.default.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Generate token
        const token = (0, auth_1.generateToken)(user._id.toString());
        // Return user data (without password)
        const userResponse = {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            phone: user.phone,
            token,
        };
        return res.status(200).json({
            message: "Login successful",
            user: userResponse,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Login failed" });
    }
});
// GET PROFILE - Get current user info
router.get("/profile", auth_1.verifyToken, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                phone: user.phone,
                profileImage: user.profileImage,
            },
        });
    }
    catch (error) {
        console.error("Profile fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
});
// UPDATE PROFILE - Update user info
router.put("/profile", auth_1.verifyToken, async (req, res) => {
    try {
        const { displayName, phone, profileImage } = req.body;
        const user = await User_1.default.findByIdAndUpdate(req.userId, {
            displayName: displayName || undefined,
            phone: phone || undefined,
            profileImage: profileImage || undefined,
        }, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                phone: user.phone,
                profileImage: user.profileImage,
            },
        });
    }
    catch (error) {
        console.error("Profile update error:", error);
        return res.status(500).json({ error: "Failed to update profile" });
    }
});
// UPDATE PUSH TOKEN - Save/remove Expo push token for current user
router.put("/push-token", auth_1.verifyToken, async (req, res) => {
    try {
        const { expoPushToken } = req.body;
        await User_1.default.findByIdAndUpdate(req.userId, {
            expoPushToken: expoPushToken || null,
        });
        return res.status(200).json({ message: "Push token updated" });
    }
    catch (error) {
        console.error("Push token update error:", error);
        return res.status(500).json({ error: "Failed to update push token" });
    }
});
// TEST PUSH - Send a test notification to current user
router.post("/push-test", auth_1.verifyToken, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId).select("displayName expoPushToken");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (!user.expoPushToken) {
            return res.status(400).json({
                error: "No Expo push token saved for this user",
            });
        }
        await (0, notifications_1.sendPushNotification)(user.expoPushToken, "Push test", `Hello ${user.displayName}, notifications are working!`, { type: "push-test" });
        return res.status(200).json({ message: "Push test sent" });
    }
    catch (error) {
        console.error("Push test error:", error);
        return res.status(500).json({ error: "Failed to send push test" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map