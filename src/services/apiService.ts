/**
 * API Service - Communicates with Node.js/Express Backend using JWT tokens
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Item } from "../types/item";
import { ChatConversation, ChatMessage } from "../types/chat";
import { API_URL, getDevApiUrlCandidates } from "../config/api";

const API_BASE_URLS = __DEV__ ? getDevApiUrlCandidates() : [API_URL];

// Helper to get JWT token from storage
const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem("authToken").catch((error) => {
    console.error("Error getting auth token:", error);
    return null;
  });
};

// Helper for API calls with JWT
const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<any> => {
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

  let lastNetworkError: unknown = null;

  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const raw = await response.text();
      const data: unknown = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        const errorMessage =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error?: unknown }).error || "API call failed")
            : "API call failed";
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isNetworkFailure = /network request failed/i.test(message) || /failed to fetch/i.test(message);

      if (!isNetworkFailure) {
        throw error;
      }

      lastNetworkError = error;
      console.warn(`Network failed for ${baseUrl}${endpoint}, trying next candidate...`);
    }
  }

  const tried = API_BASE_URLS.join(", ");
  const details = lastNetworkError instanceof Error ? lastNetworkError.message : "unknown network error";
  throw new Error(`Network request failed. Tried: ${tried}. Last error: ${details}`);
};

const extractUserId = (userField: any): string | undefined => {
  if (!userField) return undefined;
  if (typeof userField === "string") return userField;
  if (typeof userField === "object") {
    return userField._id || userField.id;
  }
  return undefined;
};

const mapPostToItem = (post: any): Item => ({
  ...post,
  id: post.id,
  userId: extractUserId(post.userId),
});

const mapChatUser = (user: any) => ({
   id: extractUserId(user) || "",
  displayName: user?.displayName,
  profileImage: user?.profileImage ?? null,
  email: user?.email,
});

const mapChatConversation = (conversation: any): ChatConversation => ({
  id: conversation.id,
  postId: conversation.postId
    ? {
        id: conversation.postId.id || conversation.postId._id,
        title: conversation.postId.title,
        status: conversation.postId.status,
        imageUri: conversation.postId.imageUri ?? null,
        userId: extractUserId(conversation.postId.userId),
      }
    : null,
  participants: Array.isArray(conversation.participants)
    ? conversation.participants.map(mapChatUser)
    : [],
  otherUser: conversation.otherUser ? mapChatUser(conversation.otherUser) : null,
  lastMessage: conversation.lastMessage || "",
  lastMessageAt: conversation.lastMessageAt || null,
  lastMessageSenderId: conversation.lastMessageSenderId
    ? mapChatUser(conversation.lastMessageSenderId)
    : null,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt,
});

const mapChatMessage = (message: any): ChatMessage => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId ? mapChatUser(message.senderId) : null,
  text: message.text,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

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

export const updatePushToken = async (expoPushToken: string | null): Promise<void> => {
  await apiCall(
    "/auth/push-token",
    {
      method: "PUT",
      body: JSON.stringify({ expoPushToken }),
    },
    true,
  );
};

export const sendPushTest = async (): Promise<void> => {
  await apiCall(
    "/auth/push-test",
    {
      method: "POST",
    },
    true,
  );
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

export interface PostFilters {
  status?: string;
  category?: string;
  title?: string;
  date?: string;
  location?: string;
}

export const getAllPosts = async (filters: PostFilters = {}): Promise<Item[]> => {
  let endpoint = "/posts";
  const params = new URLSearchParams();

  if (filters.status) params.append("status", filters.status);
  if (filters.category) params.append("category", filters.category);
  if (filters.title) params.append("title", filters.title);
  if (filters.date) params.append("date", filters.date);
  if (filters.location) params.append("location", filters.location);

  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }

  const data = await apiCall(
    endpoint,
    { method: "GET" },
    false  // Public endpoint
  );

  return data.posts.map(mapPostToItem);
};

export const getPostsByUser = async (userId: string): Promise<Item[]> => {
  const data = await apiCall(
    `/posts/user/${userId}`,
    { method: "GET" },
    false
  );

  return data.posts.map(mapPostToItem);
};

export const getPostsByStatus = async (status: "Lost" | "Found"): Promise<Item[]> => {
  const data = await apiCall(
    `/posts?status=${status}`,
    { method: "GET" },
    false
  );

  return data.posts.map(mapPostToItem);
};

export const getPost = async (postId: string): Promise<Item | null> => {
  try {
    const data = await apiCall(
      `/posts/posts/${postId}`,
      { method: "GET" },
      false
    );

    return mapPostToItem(data.post);
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

export const createOrGetConversation = async (
  postId: string,
  otherUserId: string,
): Promise<ChatConversation> => {
  const data = await apiCall(
    "/chats/conversations",
    {
      method: "POST",
      body: JSON.stringify({ postId, otherUserId }),
    },
    true,
  );

  return mapChatConversation(data.conversation);
};

export const getConversations = async (): Promise<ChatConversation[]> => {
  const data = await apiCall(
    "/chats/conversations",
    { method: "GET" },
    true,
  );

  return (data.conversations || []).map(mapChatConversation);
};

export const getConversationMessages = async (
  conversationId: string,
): Promise<{ conversation: ChatConversation; messages: ChatMessage[] }> => {
  const data = await apiCall(
    `/chats/conversations/${conversationId}/messages`,
    { method: "GET" },
    true,
  );

  return {
    conversation: mapChatConversation(data.conversation),
    messages: (data.messages || []).map(mapChatMessage),
  };
};

export const sendMessage = async (
  conversationId: string,
  text: string,
): Promise<{ message: ChatMessage; conversation: ChatConversation }> => {
  const data = await apiCall(
    `/chats/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
    true,
  );

  return {
    message: mapChatMessage(data.message),
    conversation: mapChatConversation(data.conversation),
  };
};
