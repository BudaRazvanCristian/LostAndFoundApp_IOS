/**
 * API Service - Communicates with Node.js/Express Backend using JWT tokens
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Item } from "../types/item";
import { API_URL } from "../config/api";

const API_BASE_URL = API_URL;

// Helper to get JWT token from storage
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Helper for API calls with JWT
const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<any> => {
  try {
    const headers: any = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...options.headers,
    };

    // Add JWT token if required
    if (requireAuth) {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "API call failed");
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

/**
 * AUTHENTICATION SERVICES
 */

export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  phone?: string
): Promise<{ user: any; token: string }> => {
  const data = await apiCall(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        displayName,
        phone,
      }),
    },
    false // Auth not required for register
  );

  // Save token
  if (data.user.token) {
    await AsyncStorage.setItem("authToken", data.user.token);
  }

  return { user: data.user, token: data.user.token };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: any; token: string }> => {
  const data = await apiCall(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    false // Auth not required for login
  );

  // Save token
  if (data.user.token) {
    await AsyncStorage.setItem("authToken", data.user.token);
  }

  return { user: data.user, token: data.user.token };
};

export const logoutUser = async (): Promise<void> => {
  await AsyncStorage.removeItem("authToken");
  await AsyncStorage.removeItem("currentUser");
};

export const getProfile = async (): Promise<any> => {
  const data = await apiCall("/auth/profile", {
    method: "GET",
  });

  return data.user;
};

export const updateProfile = async (
  displayName?: string,
  phone?: string,
  profileImage?: string
): Promise<any> => {
  const data = await apiCall(
    "/auth/profile",
    {
      method: "PUT",
      body: JSON.stringify({
        displayName,
        phone,
        profileImage,
      }),
    },
    true
  );

  return data.user;
};

/**
 * POSTS SERVICES
 */

export const createPost = async (post: Omit<Item, "id">): Promise<string> => {
  const data = await apiCall(
    "/posts",
    {
      method: "POST",
      body: JSON.stringify(post),
    },
    true
  );

  return data.post.id;
};

export const getAllPosts = async (status?: string, category?: string): Promise<Item[]> => {
  let endpoint = "/posts";
  const params = new URLSearchParams();

  if (status) params.append("status", status);
  if (category) params.append("category", category);

  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }

  const data = await apiCall(
    endpoint,
    { method: "GET" },
    false  // Public endpoint
  );

  return data.posts.map((post: any) => ({ ...post, id: post.id }));
};

export const getPostsByUser = async (userId: string): Promise<Item[]> => {
  const data = await apiCall(
    `/posts/user/${userId}`,
    { method: "GET" },
    false
  );

  return data.posts.map((post: any) => ({ ...post, id: post.id }));
};

export const getPostsByStatus = async (status: "Lost" | "Found"): Promise<Item[]> => {
  const data = await apiCall(
    `/posts?status=${status}`,
    { method: "GET" },
    false
  );

  return data.posts.map((post: any) => ({ ...post, id: post.id }));
};

export const getPost = async (postId: string): Promise<Item | null> => {
  try {
    const data = await apiCall(
      `/posts/posts/${postId}`,
      { method: "GET" },
      false
    );

    return { ...data.post, id: data.post.id };
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
};

export const updatePost = async (
  postId: string,
  updates: Partial<Item>
): Promise<void> => {
  await apiCall(
    `/posts/posts/${postId}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    },
    true
  );
};

export const deletePost = async (postId: string): Promise<void> => {
  await apiCall(
    `/posts/posts/${postId}`,
    { method: "DELETE" },
    true
  );
};

export default {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  createPost,
  getAllPosts,
  getPostsByUser,
  getPostsByStatus,
  getPost,
  updatePost,
  deletePost,
};

