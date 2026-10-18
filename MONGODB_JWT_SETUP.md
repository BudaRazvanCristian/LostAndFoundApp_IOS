# 🚀 MongoDB + JWT Backend Setup Guide

## 📋 Architecture

```
React Native Frontend
        ↓ (HTTP + JWT)
Express.js Backend
        ↓ (Mongoose)
MongoDB Atlas
```

---

## 🔧 STEP 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Create account with email/password or Google

### 1.2 Create Free Cluster
1. Click "Create" on MongoDB Atlas dashboard
2. Choose **"Free"** tier (M0 - shared cluster)
3. Click "Create Cluster"
4. Wait ~3-5 minutes for cluster creation

### 1.3 Create Database User
1. Click "Database Access" (left menu)
2. Click "Add New Database User"
3. **Username**: `lostfound_user`
4. **Password**: Generate strong password (copy it!)
5. **Database User Privileges**: `Atlas Admin` (for MVP)
6. Click "Add User"

**Save the password - you'll need it!**

### 1.4 Allow Network Access
1. Click "Network Access" (left menu)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for dev)
   - Sets IP to `0.0.0.0/0`
4. Click "Confirm"

### 1.5 Get Connection String
1. Click "Databases" (left menu)
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Copy the connection string:
   ```
   mongodb+srv://lostfound_user:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `PASSWORD` with your database user password
6. Save this!

---

## 💻 STEP 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd /path/to/LostAndFound/backend

npm install
```

### 2.2 Create `.env` file

Copy `.env.example` to `.env` and fill with your values:

```bash
cp .env.example .env
```

**Edit `.env`:**
```
PORT=5000
NODE_ENV=development

# MongoDB Connection String (from STEP 1.5)
MONGODB_URI=mongodb+srv://lostfound_user:YOUR_PASSWORD@cluster.mongodb.net/lostfound?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# CORS - React Native App URL
FRONTEND_URL=http://localhost:19000
```

**Change:**
- `YOUR_PASSWORD` → password din STEP 1.3
- `JWT_SECRET` → random string (puți folosi: `openssl rand -hex 32`)
- `FRONTEND_URL` → URL din Expo (ex: `exp://192.168.1.5:19000`)

### 2.3 Start Backend

```bash
npm run dev
```

**Output ar trebui:**
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📍 API: http://localhost:5000/api
💚 Health: http://localhost:5000/health
```

### 2.4 Test Backend

Visit: http://localhost:5000/health

Ar trebui să vezi:
```json
{ "status": "OK", "message": "Server is running" }
```

---

## 📱 STEP 3: React Native Frontend Setup

### 3.1 Update `.env.local`

Add API URL to `LostAndFound/.env.local`:

```
EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api
```

**Replace `YOUR_IP`:**
- Local: `http://localhost:5000/api` (Android Emulator)
- Local Machine: `http://10.0.2.2:5000/api` (Android physical device on same network)
- Physical Device: `http://192.168.1.X:5000/api` (your machine IP)

### 3.2 Services Already Updated

✅ Created `src/services/apiService.ts` - replaces Firebase
✅ All functions ready to use (registerUser, loginUser, createPost, etc.)

---

## 🔐 STEP 4: Get JWT Token Flow

```
User Registration
    ↓
POST /api/auth/register
    ↓
Backend creates user + generates JWT
    ↓
Returns: { user, token }
    ↓
Frontend saves token in AsyncStorage
    ↓
↓ All future requests include:
Authorization: Bearer <TOKEN>
```

---

## 📡 API Endpoints

### Auth Endpoints
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
GET    /api/auth/profile      - Get user profile (requires JWT)
PUT    /api/auth/profile      - Update profile (requires JWT)
```

### Posts Endpoints
```
POST   /api/posts             - Create post (requires JWT)
GET    /api/posts             - Get all posts
GET    /api/posts?status=Lost - Get Lost items
GET    /api/posts/user/:id    - Get user's posts
GET    /api/posts/posts/:id   - Get single post
PUT    /api/posts/posts/:id   - Update post (requires JWT)
DELETE /api/posts/posts/:id   - Delete post (requires JWT)
```

---

## 🚀 Deployment

### Backend Deployment (Free Options)

#### Option 1: Heroku (Deprecated - use Render)
#### Option 2: Render.com (Recommended)

```bash
# 1. Create account on render.com
# 2. Connect GitHub
# 3. New Service → Web Service
# 4. Select backend repo
# 5. Build: npm install
# 6. Start: npm run build && npm start
# 7. Add environment variables
# 8. Deploy
```

#### Option 3: Railway.app
```bash
npm install @railway/cli
railway login
railway link
railway up
```

#### Option 4: Docker (for any VPS)
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npm", "start"]
```

---

## 🧪 Testing with Postman

```bash
# 1. Download Postman
# 2. Create new collection "LostAndFound"

# Register
POST http://localhost:5000/api/auth/register
Body: {
  "email": "test@example.com",
  "password": "password123",
  "displayName": "Test User",
  "phone": "+40712345678"
}

# Login
POST http://localhost:5000/api/auth/login
Body: {
  "email": "test@example.com",
  "password": "password123"
}
Response: { "user": {...}, "token": "eyJhbGc..." }

# Create Post (with JWT)
POST http://localhost:5000/api/posts
Headers: Authorization: Bearer YOUR_JWT_TOKEN
Body: {
  "title": "Lost Wallet",
  "description": "Black leather wallet",
  ...
}

# Get All Posts
GET http://localhost:5000/api/posts
```

---

## 🐛 Troubleshooting

### "MongoDB connection failed"
- Check MONGODB_URI în .env
- Verify password is URL-encoded
- Check IP whitelist în MongoDB Atlas

### "JWT verification failed"
- Make sure token is sent în Authorization header
- Token format: `Bearer <TOKEN>` (note the space!)
- Check JWT_SECRET match

### "CORS error on React Native"
- Update FRONTEND_URL în .env
- Check CORS middleware în server.ts

### "Cannot connect to localhost:5000"
- Backend must be running (npm run dev)
- Check PORT în .env
- Verify IP if on physical device

---

## ✅ Checklist

- [ ] MongoDB Atlas account created
- [ ] Database user created
- [ ] Connection string copied
- [ ] Backend directory setup
- [ ] `.env` file created with credentials
- [ ] `npm install` ran successfully
- [ ] `npm run dev` started backend
- [ ] Health check working (http://localhost:5000/health)
- [ ] React Native `.env.local` updated with API_URL
- [ ] Tested registration/login via Postman
- [ ] Created first post successfully

---

## 📞 Quick Reference

**Backend Start:**
```bash
cd backend
npm install
npm run dev
```

**MongoDB Connection String Format:**
```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority
```

**JWT in Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**React Native API Call:**
```typescript
import apiService from "@/services/apiService";

const user = await apiService.loginUser(email, password);
const posts = await apiService.getAllPosts();
```

---

🎉 **Backend Ready!** Now test avec Frontend! 🚀

