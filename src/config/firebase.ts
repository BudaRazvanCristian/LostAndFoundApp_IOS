import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  Firestore,
} from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Try to import React Native persistence, fallback to regular auth
let authPersistence: any = undefined;
try {
  const { getReactNativePersistence } = require("firebase/auth/react-native");
  authPersistence = getReactNativePersistence(AsyncStorage);
} catch (e) {
  // React Native persistence not available in this environment
  console.log("React Native persistence unavailable, using default");
}

// Firebase Configuration - Replace with your config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKey",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "lostfound-demo.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "lostfound-demo",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "lostfound-demo.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
let auth: Auth;
if (authPersistence && Platform.OS !== "web") {
  auth = initializeAuth(app, {
    persistence: authPersistence,
  });
} else {
  auth = getAuth(app);
}

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Enable Firestore offline persistence (for web only)
if (Platform.OS === "web") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === "unimplemented") {
      console.log("The current browser does not support all of the features required to enable persistence");
    }
  });
}

// Note: Storage is optional for MVP - images are stored locally on device
// To enable Firebase Storage in future, uncomment below and add STORAGE_BUCKET to .env.local

// import { getStorage, FirebaseStorage } from "firebase/storage";
// export const storage: FirebaseStorage = getStorage(app);

export { auth };
export default app;




