import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Item } from "../types/item";

// Collection names
const POSTS_COLLECTION = "posts";
const USERS_COLLECTION = "users";

// Types
export interface FirebasePost extends Omit<Item, "id"> {
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  imageUrl?: string; // URL din Firebase Storage після upload
}

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  profileImage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * POSTS SERVICE
 */

// Create a new post
export const createPost = async (
  userId: string,
  postData: Omit<Item, "id">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      ...postData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

// Get all posts
export const getAllPosts = async (): Promise<(Item & { firebaseId: string })[]> => {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const posts: (Item & { firebaseId: string })[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: data.id || doc.id, // Fallback to Firestore doc ID
        firebaseId: doc.id,
        title: data.title,
        imageUri: data.imageUri,
        status: data.status,
        category: data.category,
        location: data.location,
        date: data.date,
        description: data.description,
        ownerName: data.ownerName,
        phoneNumber: data.phoneNumber,
      });
    });

    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
};

// Get posts by user ID
export const getPostsByUser = async (userId: string): Promise<(Item & { firebaseId: string })[]> => {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const posts: (Item & { firebaseId: string })[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: data.id || doc.id,
        firebaseId: doc.id,
        title: data.title,
        imageUri: data.imageUri,
        status: data.status,
        category: data.category,
        location: data.location,
        date: data.date,
        description: data.description,
        ownerName: data.ownerName,
        phoneNumber: data.phoneNumber,
      });
    });

    return posts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw error;
  }
};

// Get posts by status (Lost or Found)
export const getPostsByStatus = async (
  status: "Lost" | "Found"
): Promise<(Item & { firebaseId: string })[]> => {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const posts: (Item & { firebaseId: string })[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: data.id || doc.id,
        firebaseId: doc.id,
        title: data.title,
        imageUri: data.imageUri,
        status: data.status,
        category: data.category,
        location: data.location,
        date: data.date,
        description: data.description,
        ownerName: data.ownerName,
        phoneNumber: data.phoneNumber,
      });
    });

    return posts;
  } catch (error) {
    console.error("Error fetching posts by status:", error);
    throw error;
  }
};

// Get single post
export const getPost = async (postId: string): Promise<(Item & { firebaseId: string }) | null> => {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: data.id || postId,
        firebaseId: postId,
        title: data.title,
        imageUri: data.imageUri,
        status: data.status,
        category: data.category,
        location: data.location,
        date: data.date,
        description: data.description,
        ownerName: data.ownerName,
        phoneNumber: data.phoneNumber,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching post:", error);
    throw error;
  }
};

// Update post
export const updatePost = async (
  postId: string,
  updates: Partial<Item>
): Promise<void> => {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
};

// Delete post
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};

/**
 * USERS SERVICE
 */

// Create or update user profile
export const createOrUpdateUserProfile = async (
  uid: string,
  userData: Partial<FirebaseUser>
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        ...userData,
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create new user
      await addDoc(collection(db, USERS_COLLECTION), {
        uid,
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<FirebaseUser | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as FirebaseUser;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<FirebaseUser | null> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.docs.length > 0) {
      return querySnapshot.docs[0].data() as FirebaseUser;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw error;
  }
};

export default {
  createPost,
  getAllPosts,
  getPostsByUser,
  getPostsByStatus,
  getPost,
  updatePost,
  deletePost,
  createOrUpdateUserProfile,
  getUserProfile,
  getUserByEmail,
};


