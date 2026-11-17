import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Post from "../models/Post";
import User from "../models/User";
import { verifyToken } from "../middleware/auth";
import { sendPushToMany } from "../services/notifications";
import { analyzeItemImage } from "../services/itemAnalysis";
import { findMatchesForPostWithDetails, notifyMatchesForNewPost } from "../services/postMatches";

const router = Router();

// CREATE POST - Create new post
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const {
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
      aiAnalysis,
    } = req.body;

    // Validate input
    if (!title || !description || !category || !location || !status) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Create new post
    const post = new Post({
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
      aiAnalysis: aiAnalysis || null,
    });

    await post.save();

    // Notify other users that a new post was published.
    const otherUsers = await User.find({
      _id: { $ne: req.userId },
      expoPushToken: { $ne: null },
    }).select("expoPushToken");

    await sendPushToMany(
      otherUsers
        .map((user: { expoPushToken?: string | null }) => user.expoPushToken)
        .filter((token: string | null | undefined): token is string => Boolean(token)),
      `New ${status} item reported`,
      `${title} was posted in ${location}`,
      {
        type: "post-created",
        postId: post._id.toString(),
        status,
      },
    );

    // Look for matching Lost/Found posts in the background so the response is not delayed.
    void notifyMatchesForNewPost(post.toObject());

    return res.status(201).json({
      message: "Post created successfully",
      post: {
        id: post._id,
        ...post.toObject(),
      },
    });
  } catch (error) {
    console.error("Post creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create post";
    return res.status(500).json({ error: message });
  }
});

// ANALYZE IMAGE - Inspect an uploaded image and return structured AI metadata.
router.post("/analyze-image", verifyToken, async (req: Request, res: Response) => {
  try {
    const { imageUri, title, category, status, location, description } = req.body;

    if (!imageUri || typeof imageUri !== "string") {
      return res.status(400).json({ error: "Image URI is required" });
    }

    const result = await analyzeItemImage(imageUri, {
      title,
      category,
      status,
      location,
      description,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("AI analysis error:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze image";
    return res.status(500).json({ error: message });
  }
});

// GET ALL POSTS
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, category, title, date, location } = req.query;

    let query: any = {};

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

    const posts = await Post.find(query)
      .populate("userId", "displayName phone profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      posts: posts.map((post: any) => ({
        id: post._id,
        ...post.toObject(),
      })),
    });
  } catch (error) {
    console.error("Posts fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// GET USER POSTS
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      posts: posts.map((post: any) => ({
        id: post._id,
        ...post.toObject(),
      })),
    });
  } catch (error) {
    console.error("User posts fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

// GET SINGLE POST
router.get("/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).populate(
      "userId",
      "displayName phone profileImage"
    );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json({
      post: {
        id: post._id,
        ...post.toObject(),
      },
    });
  } catch (error) {
    console.error("Post fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch post" });
  }
});

// GET POSSIBLE MATCHES - Opposite-status posts that look like the same object.
router.get("/posts/:id/matches", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = await Post.findById(id).select("-imageUri").lean();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const matches = await findMatchesForPostWithDetails(post as any);

    return res.status(200).json({ matches });
  } catch (error) {
    console.error("Post matches error:", error);
    return res.status(500).json({ error: "Failed to find matches" });
  }
});

// UPDATE POST
router.put("/posts/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
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
      aiAnalysis,
    } = req.body;

    // Find post and check ownership
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized to update this post" });
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
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
        aiAnalysis: aiAnalysis ?? post.aiAnalysis ?? null,
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Post updated successfully",
      post: {
        id: updatedPost?._id,
        ...updatedPost?.toObject(),
      },
    });
  } catch (error) {
    console.error("Post update error:", error);
    return res.status(500).json({ error: "Failed to update post" });
  }
});

// DELETE POST
router.delete("/posts/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Post delete error:", error);
    return res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
