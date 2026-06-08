import { Router, Request, Response } from "express";
import Post from "../models/Post";
import { verifyToken } from "../middleware/auth";

const router = Router();

// CREATE POST - Create new post
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      location,
      status,
      date,
      ownerName,
      phoneNumber,
      imageUri,
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
      status,
      date,
      ownerName,
      phoneNumber,
      imageUri,
    });

    await post.save();

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

// GET ALL POSTS
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;

    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    const posts = await Post.find(query)
      .populate("userId", "displayName phone profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      posts: posts.map((post) => ({
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
      posts: posts.map((post) => ({
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

// UPDATE POST
router.put("/posts/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      location,
      status,
      date,
      ownerName,
      phoneNumber,
      imageUri,
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
        status: status || post.status,
        date: date || post.date,
        ownerName: ownerName || post.ownerName,
        phoneNumber: phoneNumber || post.phoneNumber,
        imageUri: imageUri || post.imageUri,
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

