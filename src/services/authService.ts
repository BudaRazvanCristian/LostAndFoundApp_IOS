import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  Auth,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { createOrUpdateUserProfile, getUserProfile } from "./firebaseService";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phone?: string;
}

/**
 * Register new user with email and password
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  phone?: string
): Promise<AuthUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await createOrUpdateUserProfile(user.uid, {
      uid: user.uid,
      email,
      displayName,
      phone,
    });

    return {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      phone,
    };
  } catch (error: any) {
    console.error("Registration error:", error.code, error.message);
    throw new Error(error.message);
  }
};

/**
 * Login user with email and password
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    };
  } catch (error: any) {
    console.error("Login error:", error.code, error.message);
    throw new Error(error.message);
  }
};

/**
 * Logout user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Logout error:", error.message);
    throw new Error(error.message);
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error("Password reset error:", error.message);
    throw new Error(error.message);
  }
};

/**
 * Get current user from Firebase Auth
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthState = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Get extended user profile from Firestore
      const profile = await getUserProfile(firebaseUser.uid);
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || profile?.displayName || "Anonymous",
        phone: profile?.phone,
      });
    } else {
      callback(null);
    }
  });
};

export default {
  registerUser,
  loginUser,
  logoutUser,
  sendPasswordReset,
  getCurrentUser,
  subscribeToAuthState,
};



