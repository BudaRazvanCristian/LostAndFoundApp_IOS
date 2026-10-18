# 🎯 MongoDB + JWT Implementation Guide

## ✅ What I've Created For You

### Backend (Node.js + Express + MongoDB + JWT)
```
/backend/
├── src/
│   ├── server.ts              ← Main server entry
│   ├── config/
│   │   └── database.ts        ← MongoDB connection
│   ├── middleware/
│   │   └── auth.ts            ← JWT verification + token generation
│   ├── models/
│   │   ├── User.ts            ← User schema (with password hashing)
│   │   └── Post.ts            ← Post schema
│   └── routes/
│       ├── auth.ts            ← /api/auth endpoints
│       └── posts.ts           ← /api/posts endpoints
├── package.json
├── tsconfig.json
└── .env.example
```

### Frontend (React Native API Service)
```
/LostAndFound/src/services/
└── apiService.ts              ← HTTP calls to backend with JWT
```

---

## 🚀 Quick Start (10 Minutes)

### STEP 1: MongoDB Atlas Setup (2 min)

Follow `MONGODB_JWT_SETUP.md` → **STEP 1: MongoDB Atlas Setup**

You'll get:
- ✅ MongoDB connection string: `mongodb+srv://...`
- ✅ Database user: `lostfound_user`
- ✅ Password for the user

### STEP 2: Backend Setup (3 min)

```bash
cd backend

# Install dependencies
npm install

# Copy and edit .env
cp .env.example .env

# Edit .env with your MongoDB connection string
nano .env  # or use your favorite editor

# Start backend
npm run dev
```

**You should see:**
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

### STEP 3: Test Backend (2 min)

Open Postman or use curl:

```bash
# Test health
curl http://localhost:5000/health

# Test register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'

# Should return: { "user": {...}, "token": "eyJ..." }
```

### STEP 4: Update Frontend .env (1 min)

Edit `LostAndFound/.env.local`:

```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

**For physical device, use your machine IP:**
```
EXPO_PUBLIC_API_URL=http://192.168.1.5:5000/api
```

### STEP 5: Frontend Uses apiService (1 min)

The React Native app now uses `apiService.ts` instead of Firebase!

**Update LoginScreen.tsx:**
```typescript
import apiService from "@/services/apiService";

// Instead of Firebase:
// const user = await loginUser(email, password); // OLD

// Now use MongoDB + JWT:
const { user, token } = await apiService.loginUser(email, password);
```

**Update AddPostScreen.tsx:**
```typescript
// Replace Firebase addItem with API call
const postId = await apiService.createPost({
  title, description, category, location, date, ownerName, phoneNumber, imageUri, status
});
```

---

## 📊 How It Works

### Authentication Flow with JWT

```
1. User fills register form
   ↓
2. Frontend calls: apiService.registerUser(email, password, name)
   ↓
3. Backend POST /api/auth/register
   ├─ Hash password with bcrypt
   ├─ Save user to MongoDB
   └─ Generate JWT token (valid 7 days)
   ↓
4. Backend returns: { user, token }
   ↓
5. Frontend saves token to AsyncStorage:
   await AsyncStorage.setItem("authToken", token)
   ↓
6. All future requests include JWT in header:
   Authorization: Bearer <TOKEN>
   ↓
7. Backend middleware (verifyToken) checks JWT
   ├─ If valid → req.userId set → continue
   └─ If invalid → 401 Unauthorized → error
```

### Data Flow

```
Frontend (React Native)
    ↓ (HTTP JSON + JWT token)
Backend (Express + Mongoose)
    ↓ (Queries)
MongoDB Atlas
    ↓
Collection "users": { email, password(hashed), displayName, phone }
Collection "posts": { userId, title, status, location, imageUri, ... }
```

---

## 🔑 API Endpoints Ready

### Auth Routes

```typescript
// ❌ Firebase (old)
const user = await auth.createUserWithEmailAndPassword(email, password);

// ✅ MongoDB + JWT (new)
const { user, token } = await apiService.registerUser(email, password, name);

// Save token automatically
await AsyncStorage.setItem("authToken", token);
```

### Posts Routes

```typescript
// ✅ Create post
const postId = await apiService.createPost({
  title, description, category, location, status, date, ownerName, phoneNumber, imageUri
});

// ✅ Get all posts
const posts = await apiService.getAllPosts();

// ✅ Get lost items
const lostPosts = await apiService.getPostsByStatus("Lost");

// ✅ Get user posts
const userPosts = await apiService.getPostsByUser(userId);

// ✅ Delete post
await apiService.deletePost(postId);
```

---

## 🔐 Security

### Password Hashing
- ✅ Bcrypt with 10 salt rounds
- ✅ Passwords never stored in plain text
- ✅ Compare on login using `bcryptjs.compare()`

### JWT Tokens
- ✅ Signed with SECRET from .env
- ✅ Expires after 7 days
- ✅ Verified on every protected request

### Database Security
- ✅ MongoDB Atlas IP whitelist
- ✅ Database user with minimal permissions
- ✅ Passwords in .env (not in code)

### API Authorization
- ✅ Only user can edit/delete their own posts
- ✅ Only authenticated users can create posts
- ✅ Public can view posts

---

## 📝 File Structure

```
LostAndFound/
├── .env.local                    ← API_URL configured
├── src/
│   ├── context/
│   │   ├── ItemsContext.tsx     ← Uses apiService
│   │   ├── AuthContext.tsx      ← Uses apiService
│   └── services/
│       ├── apiService.ts        ← ✅ NEW - MongoDB HTTP calls
│       ├── firebaseService.ts   ← ❌ OLD (keep for reference)
│       └── authService.ts       ← ❌ OLD (keep for reference)
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.tsx  ← Update to use apiService
│       │   └── RegisterScreen.tsx← Update to use apiService
│       └── main/
│           ├── AddPostScreen.tsx← Update to use apiService
│           └── HomeScreen.tsx   ← Already uses context

backend/                          ← ✅ NEW Backend
├── src/
│   ├── server.ts
│   ├── config/database.ts
│   ├── middleware/auth.ts
│   ├── models/User.ts
│   ├── models/Post.ts
│   ├── routes/auth.ts
│   └── routes/posts.ts
├── package.json
├── tsconfig.json
└── .env (with MongoDB URI + JWT_SECRET)
```

---

## ✨ Next Steps

### Option A: Quick Integration (Use Mock Data + Backend)
```typescript
// Keep using mock data for now
// Gradually switch screens to use apiService
// Timeline: 1-2 hours
```

### Option B: Full Replace Firebase (Recommended)
```typescript
// 1. Update ItemsContext to use apiService (15 min)
// 2. Update AuthContext to use apiService (10 min)
// 3. Update LoginScreen to use apiService (10 min)
// 4. Update AddPostScreen to use apiService (15 min)
// 5. Test everything (20 min)
// Timeline: 1 hour
```

### Option C: Gradual Migration
```typescript
// Use both Firebase + MongoDB API in parallel
// Gradually switch each feature
// Timeline: As needed
```

---

## 🧪 Testing Checklist

- [ ] Backend starts with `npm run dev`
- [ ] Health endpoint works: http://localhost:5000/health
- [ ] Register user via Postman
- [ ] Login user via Postman (get JWT token)
- [ ] Create post with JWT token
- [ ] Get all posts (no auth needed)
- [ ] Get user posts
- [ ] React Native app connects to API_URL
- [ ] Login works in app
- [ ] Create post saves to MongoDB
- [ ] Posts appear in home screen
- [ ] Other users can see posts

---

## 🚀 Deployment

Backend can be deployed to:
- ✅ **Render.com** (free tier, recommended)
- ✅ **Railway.app** (free tier)
- ✅ **AWS** (free tier + paid)
- ✅ **Heroku** (paid now, but Docker works)
- ✅ **Your own VPS** (DigitalOcean, Linode, etc.)

See `MONGODB_JWT_SETUP.md` for deployment steps.

---

## 📞 Troubleshooting

### Backend won't connect to MongoDB
```
Error: "MongoNetworkError"
Solution:
- Check MONGODB_URI in .env
- Ensure password is URL-encoded
- Check IP whitelist in MongoDB Atlas
- Verify user credentials
```

### JWT token error
```
Error: "Invalid or expired token"
Solution:
- Token might be expired (7 days)
- Check Authorization header format: "Bearer TOKEN"
- Verify JWT_SECRET matches in backend
```

### React Native can't reach backend
```
Error: "Network request failed"
Solution:
- Ensure backend is running: npm run dev
- Check EXPO_PUBLIC_API_URL in .env.local
- Use IP instead of localhost for physical device
- Check firewall allows port 5000
```

### CORS errors
```
Error: "Cross-Origin Request Blocked"
Solution:
- Update FRONTEND_URL in backend .env
- Check CORS middleware in server.ts
- Verify frontend URL format
```

---

## 🎓 Learning Resources

- **Express.js**: https://expressjs.com/
- **MongoDB Mongoose**: https://mongoosejs.com/
- **JWT**: https://jwt.io/introduction
- **Bcrypt.js**: https://www.npmjs.com/package/bcryptjs

---

🎉 **Backend is Ready!** Now update the frontend to use it! 🚀

