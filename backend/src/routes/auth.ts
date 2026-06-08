import { Router, Request, Response } from "express";
import User, { IUser } from "../models/User";
import { generateToken, verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();

// REGISTER - Create new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, phone } = req.body;

    // Validate input
    if (!email || !password || !displayName) {
      return res.status(400).json({
        error: "Email, password, and display name are required",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    const user = new User({
      email,
      password,
      displayName,
      phone,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

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
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// LOGIN - Authenticate user
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id.toString());

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
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

// GET PROFILE - Get current user info
router.get("/profile", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);

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
  } catch (error) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// UPDATE PROFILE - Update user info
router.put("/profile", verifyToken, async (req: Request, res: Response) => {
  try {
    const { displayName, phone, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        displayName: displayName || undefined,
        phone: phone || undefined,
        profileImage: profileImage || undefined,
      },
      { new: true, runValidators: true }
    );

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
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;

