# Firebase Setup Guide - Lost & Found App

## 🔧 Setup Complet

### 1. **Crează Firebase Project**

1. Mergi pe [Firebase Console](https://console.firebase.google.com/)
2. Crează un nou project: "LostAndFound"
3. Activează Google Analytics (opțional)
4. Copiază config-ul

### 2. **Obține Firebase Credentials**

Din Firebase Console → Project Settings → Web App:

```json
{
  "apiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
  "authDomain": "lostfound-xxxxx.firebaseapp.com",
  "projectId": "lostfound-xxxxx",
  "storageBucket": "lostfound-xxxxx.appspot.com",
  "messagingSenderId": "123456789012",
  "appId": "1:123456789012:web:XXXXXXXXXXXXX"
}
```

### 3. **Setup Environment Variables**

Crează `.env.local` în root-ul proiectului:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=lostfound-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=lostfound-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=lostfound-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:XXXXXXXXXXXXX
```

### 4. **Activează Firebase Services**

#### Authentication
- Firebase Console → Authentication → Get Started
- Activează: Email/Password, Google (opțional)

#### Firestore Database
- Firebase Console → Firestore Database → Create Database
- Start in production mode
- Region: `europe-west1` (sau cea mai apropiată)
- Firestore rules (production):

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Posts collection - readable by all, writable by owner
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

#### Firebase Storage
- Firebase Console → Storage → Get Started
- Storage rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. **Instalează Dependencies**

```bash
npm install @react-native-async-storage/async-storage
# sau
yarn add @react-native-async-storage/async-storage
```

### 6. **Inițializează Firebase în App**

App.tsx e deja configurat cu ItemsProvider și AuthProvider va fi adăugat.

---

## 📁 Database Schema

### Collection: `users`
```
uid (document ID)
├── email: string
├── displayName: string
├── phone: string (optional)
├── profileImage: string (optional)
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Collection: `posts`
```
{postId} (document ID)
├── userId: string (FK → users.uid)
├── title: string
├── description: string
├── category: string
├── location: string
├── status: "Lost" | "Found"
├── date: string
├── ownerName: string
├── phoneNumber: string
├── imageUri: string
├── imageUrl: string (Firebase Storage URL - after upload)
├── createdAt: timestamp
└── updatedAt: timestamp
```

---

## 🚀 Usage Examples

### Authenticate User

```typescript
import { loginUser, registerUser, logoutUser } from "@/services/authService";

// Register
const user = await registerUser(
  "user@example.com",
  "password123",
  "John Doe",
  "+40712345678"
);

// Login
const user = await loginUser("user@example.com", "password123");

// Logout
await logoutUser();
```

### Create Post

```typescript
import { useItems } from "@/context/ItemsContext";

const { addItem, currentUserId } = useItems();

const newPost = await addItem({
  title: "Lost Wallet",
  description: "Black leather wallet with student ID",
  category: "Accessories",
  location: "Central Park",
  status: "Lost",
  date: "2026-06-08",
  ownerName: "John Doe",
  phoneNumber: "+40712345678",
  imageUri: "https://example.com/wallet.jpg",
});
```

### Get Posts

```typescript
import firebaseService from "@/services/firebaseService";

// All posts
const allPosts = await firebaseService.getAllPosts();

// By status
const lostPosts = await firebaseService.getPostsByStatus("Lost");
const foundPosts = await firebaseService.getPostsByStatus("Found");

// By user
const userPosts = await firebaseService.getPostsByUser(userId);

// Single post
const post = await firebaseService.getPost(postId);
```

### Update/Delete Post

```typescript
// Update
await firebaseService.updatePost(postId, {
  status: "Found",
  description: "Updated description"
});

// Delete
await firebaseService.deletePost(postId);
```

---

## 🔐 Security Notes

- **Never expose Firebase credentials** în public code
- Folosește `.env` file cu `EXPO_PUBLIC_` prefix
- Firestore rules sunt restrictive (users pot edita doar propriile posts)
- Enable 2FA pe Firebase console
- Revizuiește regular accesul utilizatorilor

---

## ✅ Testing Checklist

- [ ] Firebase credentials în `.env.local`
- [ ] Firestore database creat și reguli aplicate
- [ ] Storage bucket creat
- [ ] Authentication Email/Password enabled
- [ ] `@react-native-async-storage/async-storage` instalat
- [ ] Login funcțional
- [ ] Creare post salvează în Firestore
- [ ] Posts persit după logout/login
- [ ] Alte utilizatori pot vedea posts

---

## 📊 Monitoring

Firebase Console oferă:
- **Analytics** - usage patterns
- **Crashlytics** - crash reports
- **Performance** - app performance
- **Cloud Functions** - backend logic (future)

---

## 🚨 Troubleshooting

### Error: "Firebase API key not found"
- Verifica `.env.local` file cu values corecte
- Restart Expo server: `npm start -- --clear`

### Error: "User not authenticated to create post"
- Asigură-te că user-ul e logged in
- Verifica `useItems()` hook - `currentUserId` trebuie să nu fie null

### Firestore rules rejected request
- Check Firebase Console → Firestore → Rules
- Asigură-te că auth state e correct

---

## 🎯 Next Steps

1. ✅ Setup Firebase
2. ✅ Database schema
3. ⏳ **Update LoginScreen** - logout mock setup
4. ⏳ **Update AddPostScreen** - save to Firestore
5. ⏳ **Add image upload** - Firebase Storage
6. ⏳ **Search/Filter** - Firestore queries

