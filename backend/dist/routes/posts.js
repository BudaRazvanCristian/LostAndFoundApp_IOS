"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Post_1 = __importDefault(require("../models/Post"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const notifications_1 = require("../services/notifications");
const router = (0, express_1.Router)();
// CREATE POST - Create new post
router.post("/", auth_1.verifyToken, async (req, res) => {
    try {
        const { title, description, category, location, latitude, longitude, status, date, ownerName, phoneNumber, imageUri, } = req.body;
        // Validate input
        if (!title || !description || !category || !location || !status) {
            return res.status(400).json({
                error: "Missing required fields",
            });
        }
        // Create new post
        const post = new Post_1.default({
            userId: req.userId,
            title,
            description,
            category,
            location,
            latitude,
            longitude,
            status,
            date,
            ownerName,
            phoneNumber,
            imageUri,
        });
        await post.save();
        // Notify other users that a new post was published.
        const otherUsers = await User_1.default.find({
            _id: { $ne: req.userId },
            expoPushToken: { $ne: null },
        }).select("expoPushToken");
        await (0, notifications_1.sendPushToMany)(otherUsers
            .map((user) => user.expoPushToken)
            .filter((token) => Boolean(token)), `New ${status} item reported`, `${title} was posted in ${location}`, {
            type: "post-created",
            postId: post._id.toString(),
            status,
        });
        return res.status(201).json({
            message: "Post created successfully",
            post: {
                id: post._id,
                ...post.toObject(),
            },
        });
    }
    catch (error) {
        console.error("Post creation error:", error);
        const message = error instanceof Error ? error.message : "Failed to create post";
        return res.status(500).json({ error: message });
    }
});
// GET ALL POSTS
router.get("/", async (req, res) => {
    try {
        const { status, category, title, date, location } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }
        if (category) {
            query.category = { $regex: String(category), $options: "i" };
        }
        if (title) {
            query.title = { $regex: String(title), $options: "i" };
        }
        if (date) {
            query.date = { $regex: String(date), $options: "i" };
        }
        if (location) {
            query.location = { $regex: String(location), $options: "i" };
        }
        const posts = await Post_1.default.find(query)
            .populate("userId", "displayName phone profileImage")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            posts: posts.map((post) => ({
                id: post._id,
                ...post.toObject(),
            })),
        });
    }
    catch (error) {
        console.error("Posts fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch posts" });
    }
});
// GET USER POSTS
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await Post_1.default.find({ userId })
            .sort({ createdAt: -1 });
        return res.status(200).json({
            posts: posts.map((post) => ({
                id: post._id,
                ...post.toObject(),
            })),
        });
    }
    catch (error) {
        console.error("User posts fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch user posts" });
    }
});
// GET SINGLE POST
router.get("/posts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post_1.default.findById(id).populate("userId", "displayName phone profileImage");
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        return res.status(200).json({
            post: {
                id: post._id,
                ...post.toObject(),
            },
        });
    }
    catch (error) {
        console.error("Post fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch post" });
    }
});
// UPDATE POST
router.put("/posts/:id", auth_1.verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, location, latitude, longitude, status, date, ownerName, phoneNumber, imageUri, } = req.body;
        // Find post and check ownership
        const post = await Post_1.default.findById(id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        if (post.userId.toString() !== req.userId) {
            return res.status(403).json({ error: "Not authorized to update this post" });
        }
        // Update post
        const updatedPost = await Post_1.default.findByIdAndUpdate(id, {
            title: title || post.title,
            description: description || post.description,
            category: category || post.category,
            location: location || post.location,
            latitude: latitude ?? post.latitude,
            longitude: longitude ?? post.longitude,
            status: status || post.status,
            date: date || post.date,
            ownerName: ownerName || post.ownerName,
            phoneNumber: phoneNumber || post.phoneNumber,
            imageUri: imageUri || post.imageUri,
        }, { new: true, runValidators: true });
        return res.status(200).json({
            message: "Post updated successfully",
            post: {
                id: updatedPost?._id,
                ...updatedPost?.toObject(),
            },
        });
    }
    catch (error) {
        console.error("Post update error:", error);
        return res.status(500).json({ error: "Failed to update post" });
    }
});
// DELETE POST
router.delete("/posts/:id", auth_1.verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post_1.default.findById(id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        if (post.userId.toString() !== req.userId) {
            return res.status(403).json({ error: "Not authorized to delete this post" });
        }
        await Post_1.default.findByIdAndDelete(id);
        return res.status(200).json({
            message: "Post deleted successfully",
        });
    }
    catch (error) {
        console.error("Post delete error:", error);
        return res.status(500).json({ error: "Failed to delete post" });
    }
});
exports.default = router;
//# sourceMappingURL=posts.js.map