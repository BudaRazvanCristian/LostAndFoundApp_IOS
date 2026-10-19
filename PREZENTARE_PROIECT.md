# 📱 Proiect Lost & Found - Documentație Completă

**Autor:** Cristian Budara  
**Data:** Octombrie 2026  
**Versiune Proiect:** 0.0.1

---

## 📋 Cuprins

1. [Descriere Proiect](#descriere-proiect)
2. [Arhitectura Aplicației](#arhitectura-aplicației)
3. [Pornirea Aplicației](#pornirea-aplicației)
4. [Structura Folderelor](#structura-folderelor)
5. [Tehnologii Folosite](#tehnologii-folosite)
6. [Funcționalități Principale](#funcționalități-principale)
7. [Fluxul de Autentificare](#fluxul-de-autentificare)
8. [Gestionarea Obiectelor (Posts)](#gestionarea-obiectelor-posts)
9. [Sistem de Chat](#sistem-de-chat)
10. [Upload Imagini](#upload-imagini)
11. [Geolocalitate și Hartă](#geolocalitate-și-hartă)
12. [Căutare și Filtrare](#căutare-și-filtrare)
13. [Baza de Date MongoDB](#baza-de-date-mongodb)
14. [Troubleshooting](#troubleshooting)

---

## Descriere Proiect

**Lost & Found** este o aplicație mobile React Native care permite utilizatorilor să:
- **Anunțe pierderi**: Posteze obiecte pierdute cu detalii, poze și locație
- **Anunțe găsiri**: Posteze obiecte găsite
- **Contacteze proprietari**: Comunică cu alți utilizatori prin sistem de chat
- **Caute filtrează**: Gaseasca obiecte după categorie, locație, dată

**Arhitectură**: **Client-Server** (Frontend: React Native + Expo, Backend: Node.js + Express)  
**Baza de Date**: **MongoDB Atlas**  
**Autentificare**: **JWT (JSON Web Tokens)**

---

## Arhitectura Aplicației

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React Native)               │
│              (iOS/Android via Expo CLI)                 │
├─────────────────────────────────────────────────────────┤
│  • AuthContext → Sesiune utilizator                     │
│  • ItemsContext → State management posts                │
│  • React Navigation → Navigare între ecrane             │
│  • AsyncStorage → Persistență date locale               │
├─────────────────────────────────────────────────────────┤
│         HTTP/REST API (JWT Bearer Token)                │
├─────────────────────────────────────────────────────────┤
│                 BACKEND (Node.js/Express)               │
│              (http://localhost:3000/api)                │
├─────────────────────────────────────────────────────────┤
│  • Routes: /auth, /posts, /chats                        │
│  • JWT Middleware → Verificare token                    │
│  • Mongoose Models → User, Post, Conversation, Message  │
├─────────────────────────────────────────────────────────┤
│              MONGODB ATLAS (Cloud Database)             │
│                  cluster0.vzgkqjm.mongodb.net           │
├─────────────────────────────────────────────────────────┤
│  • Collections: users, posts, conversations, messages   │
└─────────────────────────────────────────────────────────┘
```

---

## Pornirea Aplicației

### Pasul 1: Instalare Dependințe (o singură dată)

```bash
# Frontend
cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound
npm install

# Backend
cd backend
npm install
```

### Pasul 2: Setup MongoDB Atlas

1. Mergi pe [MongoDB Atlas](https://cloud.mongodb.com/)
2. Selectează **Cluster0**
3. Mergi la **Security → Network Access**
4. Apasă **"+ Add IP Address"**
5. Selectează **"Add Current IP Address"** (detectează automat)
6. Apasă **CONFIRM**

### Pasul 3: Pornire Backend (Terminal 1)

```bash
cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound/backend
npm run dev
```

✅ Backend va rula pe `http://localhost:3000`  
✅ Endpoint health check: `curl http://localhost:3000/health`

### Pasul 4: Pornire Metro + Setup IP (Terminal 2)

```bash
cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound
npm run setup      # Detectează IP-ul local automat
npm start -- --reset-cache
```

### Pasul 5: Pornire Aplicația (Terminal 3)

**Pentru iOS:**
```bash
npm run ios
```

**Pentru Android:**
```bash
npm run android
```

---

## Structura Folderelor

```
LostAndFound/
├── src/
│   ├── components/              # Componente React refolosite
│   │   ├── AppButton.tsx        # Buton custom
│   │   ├── AppTextInput.tsx     # Input custom
│   │   ├── ItemCard.tsx         # Card pentru articol
│   │   ├── ChatBubble.tsx       # Mesaj chat
│   │   └── ...
│   ├── screens/                 # Ecrane (pages)
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx  # Logare
│   │   │   └── RegisterScreen.tsx # Înregistrare
│   │   └── main/
│   │       ├── HomeScreen.tsx      # Pagina principală
│   │       ├── AddPostScreen.tsx   # Adăugare anunț
│   │       ├── EditPostScreen.tsx  # Editare anunț
│   │       ├── DetailsScreen.tsx   # Detalii articol
│   │       ├── LostItemsScreen.tsx # Căutare obiecte pierdute
│   │       ├── FoundItemsScreen.tsx # Căutare obiecte găsite
│   │       ├── ChatScreen.tsx      # Lista conversații
│   │       ├── ChatThreadScreen.tsx # Chat cu o persoană
│   │       └── ProfileScreen.tsx   # Profil utilizator
│   ├── navigation/              # React Navigation setup
│   │   ├── RootNavigator.tsx    # Decidă Auth vs Main flow
│   │   ├── AuthNavigator.tsx    # Ecrane login/register
│   │   └── MainNavigator.tsx    # Taburi principale + stack
│   ├── context/                 # State management
│   │   ├── AuthContext.tsx      # Sesiune utilizator (login/logout)
│   │   └── ItemsContext.tsx     # State posts/items
│   ├── services/                # API calls
│   │   └── apiService.ts        # HTTP requests la backend
│   ├── config/                  # Configurații
│   │   ├── api.ts               # URL backend (auto-detect IP)
│   │   └── generatedLocalHost.ts # IP local generat
│   ├── constants/               # Constante
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── typography.ts
│   ├── types/                   # TypeScript interfaces
│   │   ├── item.ts
│   │   └── chat.ts
│   └── data/
│       └── mockItems.ts         # Date fake pentru testing
│
├── backend/                     # Backend Node.js/Express
│   ├── src/
│   │   ├── server.ts            # Entry point
│   │   ├── config/
│   │   │   └── database.ts      # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT verification
│   │   ├── models/              # Mongoose schemas
│   │   │   ├── User.ts
│   │   │   ├── Post.ts
│   │   │   ├── Conversation.ts
│   │   │   └── Message.ts
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.ts          # /api/auth
│   │   │   ├── posts.ts         # /api/posts
│   │   │   └── chats.ts         # /api/chats
│   │   └── services/
│   │       └── notifications.ts # Push notifications
│   ├── .env                     # Variabile mediu
│   └── package.json
│
└── package.json
```

---

## Tehnologii Folosite

### Frontend
| Tehnologie | Versiune | Rol |
|---|---|---|
| React Native | 0.83.6 | Framework mobil |
| Expo | ~55.0.26 | Tool de development/build |
| React Navigation | ^7.x | Navigare între ecrane |
| AsyncStorage | ^1.23.1 | Persistență date locale |
| React Native Maps | ^1.20.1 | Afișare hartă |
| Expo Image Picker | ~55.0.20 | Selectare imagini |
| TypeScript | ^5.8.3 | Type safety |

### Backend
| Tehnologie | Versiune | Rol |
|---|---|---|
| Node.js | >=22.11.0 | Runtime |
| Express | ^4.18.2 | Framework web |
| Mongoose | ^7.5.0 | ODM MongoDB |
| JWT | ^9.0.2 | Autentificare |
| Bcryptjs | ^2.4.3 | Hash parolă |
| CORS | ^2.8.5 | Cross-origin requests |
| TypeScript | ^5.2.2 | Type safety |

### Database
| Tehnologie | Rol |
|---|---|
| MongoDB Atlas | Cloud database |
| Cluster0 | Cluster cu 3 noduri (replica set) |

---

## Funcționalități Principale

### ✅ 1. Autentificare (Auth)
- **Înregistrare**: Email + parolă + nume + telefon (opțional)
- **Logare**: Email + parolă
- **JWT Token**: Stocat în AsyncStorage, trimis în header la fiecare request
- **Logout**: Șterge token și date utilizator
- **Sesiune Persistentă**: Se restorează la restart aplicației

### ✅ 2. Adăugare Anunțuri (Add Post)
- Titlu, descriere, categorie
- Locație pe hartă (tap pe hartă = salvează lat/long)
- Data anunțului
- Nume proprietar + telefon
- Poză (din galerie sau cameră)
- Status: "Lost" sau "Found"

### ✅ 3. Editare și Ștergere Anunțuri
- Doar proprietarul poate edita/șterge
- Backend verifică ownership via JWT

### ✅ 4. Vizualizare Anunțuri
- **Home Screen**: Obiecte pierdute + găsite recente
- **Details Screen**: Detalii complete, hartă, contact owner
- **Lost Items Screen**: Căutare obiecte pierdute cu filtre
- **Found Items Screen**: Căutare obiecte găsite cu filtre

### ✅ 5. Sistem de Chat
- **Inbox**: Lista conversații
- **Chat Thread**: Mesaje cu o persoană (polling la 5 sec)
- Atunci când dai click "Contact owner", se crează o conversație
- Mesajele sunt persistate în MongoDB

### ✅ 6. Profil Utilizator
- Afișare date utilizator curent
- Logout

---

## Fluxul de Autentificare

### 1. Înregistrare (Register)

```
User fills register form
       ↓
Frontend validates (email, password min 6 chars, name)
       ↓
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe",
  "phone": "+40123456789"
}
       ↓
Backend checks if email already exists
       ↓
Backend hashes password with bcryptjs (salt=10)
       ↓
Backend saves User document in MongoDB
       ↓
Backend generates JWT token (7 days expiry)
       ↓
Returns: { user: {...}, token: "eyJhbGc..." }
       ↓
Frontend saves token in AsyncStorage
       ↓
Frontend navigates to Main flow (Home screen)
```

### 2. Logare (Login)

```
User fills login form (email + password)
       ↓
Frontend validates
       ↓
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
       ↓
Backend finds user by email
       ↓
Backend compares password with hash using bcryptjs
       ↓
If valid: generates JWT token
If invalid: returns 401 error
       ↓
Frontend saves token in AsyncStorage
       ↓
Frontend saves current user in AsyncStorage
       ↓
AuthContext updates (isAuthenticated = true)
       ↓
Navigates to Main flow
```

### 3. Verificare Token (Protected Routes)

```
Frontend makes request to /api/posts (protected endpoint)
       ↓
Reads token from AsyncStorage
       ↓
Adds header: Authorization: Bearer <token>
       ↓
Backend middleware verifyToken() receives request
       ↓
Extracts token from Authorization header
       ↓
Verifies JWT signature using JWT_SECRET
       ↓
Decodes token → extracts userId
       ↓
Injects userId in req.userId
       ↓
Route handler accesses req.userId
       ↓
If token expired/invalid: 401 error
```

### 4. Logout

```
User taps "Logout" in Profile screen
       ↓
Frontend removes "authToken" from AsyncStorage
       ↓
Frontend removes "currentUser" from AsyncStorage
       ↓
AuthContext updates (user = null, isAuthenticated = false)
       ↓
Navigates back to Auth flow (Login screen)
```

---

## Gestionarea Obiectelor (Posts)

### Schema Post

```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // Foreign key to User
  title: string,              // "Lost Wallet"
  description: string,        // "Black leather, cards inside"
  category: string,           // "Accessories", "Electronics", etc.
  location: string,           // "Downtown Park"
  latitude: number,           // 44.4268
  longitude: number,          // 26.1025
  status: "Lost" | "Found",
  date: string,               // "2024-10-03"
  ownerName: string,          // "John Doe"
  phoneNumber: string,        // "+40123456789"
  imageUri: string,           // Data URI sau URL
  createdAt: Date,
  updatedAt: Date
}
```

### Adăugare Post (Add Post Screen)

```typescript
Frontend form validation:
  ✓ Titlu (nepraz)
  ✓ Categorie selectată
  ✓ Locație setată
  ✓ Coordonate geografice (lat/long) din hartă
  ✓ Dată selectată
  ✓ Descriere (nepraz)
  ✓ Nume proprietar
  ✓ Telefon
  ✓ Imagine încărcată

POST /api/posts (cu JWT token)
{
  "title": "...",
  "description": "...",
  "category": "...",
  "location": "...",
  "latitude": 44.4268,
  "longitude": 26.1025,
  "status": "Lost",
  "date": "2024-10-03",
  "ownerName": "...",
  "phoneNumber": "...",
  "imageUri": "data:image/jpeg;base64,..."
}

Backend:
  • Primește userId din JWT token
  • Creează Post document
  • Salvează în MongoDB
  • Returnează postul creat

Frontend:
  • Adaugă postul în ItemsContext
  • Afișează notificare "Post added successfully"
  • Navigează înapoi la Home
```

### Editare Post (Edit Post Screen)

```
Frontend: Preîncarcă form-ul cu datele postului
User modifica câteva câmpuri
Apasă "Save"

PUT /api/posts/:postId (cu JWT token)
{
  "title": "...",
  "description": "...",
  // ... alte câmpuri
}

Backend:
  • Verifică dacă postul aparține utilizatorului curent (ownership check)
  • Dacă NU: returnează 403 Forbidden
  • Dacă DA: actualizează postul în MongoDB
  • Returnează postul modificat

Frontend:
  • ItemsContext se actualizează
  • Afișează post updated notification
  • Navigează înapoi la Home
```

### Ștergere Post (Details Screen)

```
User apasă butonul "Delete Post"
Frontend cere confirmare: "Are you sure?"

DELETE /api/posts/:postId (cu JWT token)

Backend:
  • Verifică ownership
  • Șterge din MongoDB
  • Returnează status 200

Frontend:
  • ItemsContext se actualizează (elimină din array)
  • Navigează înapoi la Home
```

### Listare Posts (Home, Search Screens)

```
GET /api/posts?status=Lost&title=&category=&date=&location=

Backend:
  • Construiește MongoDB query din parametri
  • Filtrează cu $regex (case-insensitive)
  • Populates userId field cu displayName, phone, profileImage
  • Sort descending by createdAt
  • Returnează array de posts

Frontend:
  • ItemsContext stochează rezultatele
  • Home Screen: afișează 5 recent lost + 5 recent found
  • Search Screens: afișează filtrate
```

---

## Sistem de Chat

### Schema Conversation

```typescript
{
  _id: ObjectId,
  postId: ObjectId,                    // Reference to post
  participants: [ObjectId, ObjectId],  // [user1, user2]
  participantKey: string,              // "user1_user2_postId" (prevents duplicates)
  lastMessage: string,
  lastMessageAt: Date,
  lastMessageSenderId: ObjectId,
  createdAt: Date
}
```

### Schema Message

```typescript
{
  _id: ObjectId,
  conversationId: ObjectId,
  senderId: ObjectId,
  text: string,
  createdAt: Date
}
```

### Fluxul de Chat

#### 1. Initiare Chat (din Details Screen)

```
User apasă "Contact owner"
       ↓
Frontend calls POST /api/chats/start-conversation
{
  "postId": "...",
  "otherUserId": "..."
}
       ↓
Backend:
  • Construiește participantKey din user IDs
  • Caută Conversation cu aceeași participantKey
  • Dacă NU există: creează noua conversație
  • Dacă DA: returneaza existenta (evita duplicate)
  • Returnează conversationId
       ↓
Frontend navigează la ChatThreadScreen cu conversationId
```

#### 2. Afișare Chat (Chat Thread Screen)

```
Frontend: GET /api/chats/conversations/:conversationId

Backend: Cauta conversația + populeaza mesajele

Frontend:
  • Afișează lista de mesaje
  • Setează polling la 5 secunde (reîncarcă mesaje)
  • Utilizatorul vede nouile mesaje în timp real
```

#### 3. Trimitere Mesaj

```
User scrie text + apasă "Send"
       ↓
POST /api/chats/conversations/:conversationId/messages
{
  "text": "Hello, is this item still available?"
}
       ↓
Backend:
  • Crează Message document
  • Actualizează lastMessage în Conversation
  • Returnează mesajul creat
       ↓
Frontend:
  • Adaugă mesajul imediat în UI (optimistic update)
  • Șterge input field
  • Polling va reîncărca pentru a sincroniza cu alți utilizatori
```

#### 4. Inbox (Chat Screen)

```
GET /api/chats/conversations

Backend: Returnează lista de conversații pentru user curent

Frontend afișează:
  • Numele utilizatorului cu care chatului (populate din userId)
  • Ultimul mesaj
  • Ora ultimului mesaj
  • Click → deschide ChatThreadScreen
```

---

## Upload Imagini

### Fluxul Upload

```
User selectează imagine din galerie/cameră
       ↓
expo-image-picker deschide galerie
       ↓
User selectează și editează (crop/resize)
       ↓
Frontend: Convertește la base64
       ↓
Construiește data URI: "data:image/jpeg;base64,..."
       ↓
POST /api/posts
{
  "imageUri": "data:image/jpeg;base64,..."
  // ... alte câmpuri
}
       ↓
Backend: Primește data URI ca string
       ↓
Salvează string-ul direct în MongoDB (imageUri field)
       ↓
Frontend: Afișează imagine cu <Image source={{ uri: imageUri }} />
```

### Unde Apare Imaginea

1. **Add Post Screen**: Preview imagine înainte de upload
2. **Item Card (Home)**: Thumbnail imagine
3. **Details Screen**: Imagine full-screen
4. **Edit Post Screen**: Imagine preîncărcată

---

## Geolocalitate și Hartă

### Selectare Locație (Add Post Screen)

```
User apasă pe hartă
       ↓
handleMapPress event captează coordonatele
{
  latitude: 44.4268,
  longitude: 26.1025
}
       ↓
Frontend stochează latitude/longitude în state
       ↓
Afișează Marker pe hartă la locația selectată
       ↓
User apasă "Submit"
       ↓
Trimite lat/long în POST /api/posts
       ↓
Backend salvează în Post document
```

### Afișare Hartă (Details Screen)

```
Frontend citește latitude/longitude din post
       ↓
<MapView>
  <Marker coordinate={{ latitude, longitude }} title={postTitle} />
</MapView>
       ↓
Hartă read-only (nu se poate edita)
       ↓
User poate apăsa "Open in Maps"
       ↓
Deschide Maps.app (iOS) sau Google Maps (Android)
       ↓
Locația din anunț se deschide pe hartă
```

---

## Căutare și Filtrare

### Lost Items Screen (Search Tab)

```
User poate introduce:
  • Title (cuvinte cheie din titlu)
  • Category (dropdown sau input)
  • Location (cuvinte cheie din locație)
  • Date (format YYYY-MM-DD)

Frontend:
  • Debounce 300ms după fiecare tip
  • GET /api/posts?status=Lost&title=...&category=...&location=...&date=...

Backend:
  • Construiește query MongoDB cu $regex
  • Case-insensitive search
  • $options: "i"
  • Returns matching posts sorted by createdAt desc

Frontend:
  • Afișează rezultate
  • Dacă "No items match your search"
```

---

## Baza de Date MongoDB

### Collections

#### 1. users
```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  password: "hash_bcrypt",      // hashed, never in plain text
  displayName: "John Doe",
  phone: "+40123456789",
  profileImage: null,
  expoPushToken: null,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. posts
```javascript
{
  _id: ObjectId,
  userId: ObjectId,             // ref to user
  title: "Lost Wallet",
  description: "Black leather...",
  category: "Accessories",
  location: "Downtown Park",
  latitude: 44.4268,
  longitude: 26.1025,
  status: "Lost",
  date: "2024-10-03",
  ownerName: "John Doe",
  phoneNumber: "+40123456789",
  imageUri: "data:image/jpeg;base64,... or URL",
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. conversations
```javascript
{
  _id: ObjectId,
  postId: ObjectId,             // ref to post
  participants: [ObjectId, ObjectId],
  participantKey: "user1_user2_postId",
  lastMessage: "Hello!",
  lastMessageAt: Date,
  lastMessageSenderId: ObjectId,
  createdAt: Date
}
```

#### 4. messages
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,     // ref to conversation
  senderId: ObjectId,           // ref to user
  text: "Hello, is this available?",
  createdAt: Date
}
```

### Connection String

```
mongodb+srv://lostfound_user:2mK2mwQ7rXKXM6GQ@cluster0.vzgkqjm.mongodb.net/?appName=Cluster0
```

### Cum să Accesezi Baza

#### Opțiunea 1: MongoDB Compass (Recomandată)
```bash
# Descarcă MongoDB Compass
# Deschide → "New Connection"
# Paste connection string
# Click "Connect"
# Navighează la: lostfound → users/posts/conversations/messages
```

#### Opțiunea 2: MongoDB Shell
```bash
# Instalează mongosh (dacă nu ai)
npm install -g mongosh

# Conectare
mongosh "mongodb+srv://lostfound_user:2mK2mwQ7rXKXM6GQ@cluster0.vzgkqjm.mongodb.net/lostfound"

# Comenzi
db.users.find({})
db.posts.find({})
db.conversations.find({})
db.messages.find({})
```

---

## Troubleshooting

### ❌ "MongoDB connection failed: Could not connect to any servers"

**Soluție:**
1. Mergi pe MongoDB Atlas
2. Selectează Cluster0
3. Security → Network Access
4. Add Current IP Address
5. Confirma

### ❌ "Port 8081 already in use (Metro)"

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN
kill <PID>

npm start -- --reset-cache
```

### ❌ "Network request failed" (App nu se conectează la backend)

```bash
# 1. Verifică că backend rulează
curl http://localhost:3000/health

# 2. Verifică IP din .env.local
cat .env.local | grep EXPO_PUBLIC_API_HOST

# 3. Setup din nou
npm run setup
npm start -- --reset-cache

# 4. Reinstalează app
npm run ios   # sau android
```

### ❌ "Not authenticated" (API returns 401)

```bash
# 1. User nu e logat
# 2. Token expirat (7 days)
# 3. Token nu e trimis în header

# Fix: Login din nou în app
```

### ❌ "Permission denied" (Can't edit/delete post)

```
# Doar proprietarul postului poate edita/șterge
# Verifică că ești logat cu utilizatorul corect
# Backend verifica: post.userId === req.userId
```

### ❌ "Cannot connect to iPhone Simulator" (iOS)

```bash
# Metro nu se conectează la device

# Fix:
npm start -- --reset-cache
# Apasă "i" în terminal pentru rebuild iOS

# Sau manual:
cd ios
pod install
cd ..
npm run ios
```

---

## Comenzi Rapide

```bash
# Frontend start
cd LostAndFound
npm run setup      # Setup IP
npm start          # Metro
npm run ios        # iOS
npm run android    # Android

# Backend start
cd backend
npm run dev        # Nodemon (development)
npm run build      # Compile TypeScript
npm start          # Production

# Database
mongosh "mongodb+srv://lostfound_user:2mK2mwQ7rXKXM6GQ@cluster0.vzgkqjm.mongodb.net/lostfound"
```

---

## Structura API

### Authentication Endpoints

| Metoda | Endpoint | Descriere |
|--------|----------|-----------|
| POST | `/api/auth/register` | Înregistrare utilizator nou |
| POST | `/api/auth/login` | Logare utilizator |
| GET | `/api/auth/logout` | Logout |

### Posts Endpoints

| Metoda | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/api/posts` | Obținere posts cu filtrare |
| POST | `/api/posts` | Creare post (need JWT) |
| GET | `/api/posts/:id` | Obținere post specific |
| PUT | `/api/posts/:id` | Editare post (need JWT + ownership) |
| DELETE | `/api/posts/:id` | Ștergere post (need JWT + ownership) |

### Chat Endpoints

| Metoda | Endpoint | Descriere |
|--------|----------|-----------|
| POST | `/api/chats/start-conversation` | Inițiere/obținere conversație |
| GET | `/api/chats/conversations` | Lista conversații user |
| GET | `/api/chats/conversations/:id` | Mesaje din conversație |
| POST | `/api/chats/conversations/:id/messages` | Trimitere mesaj |

---

## Ce Să Arăți la Prezentare

### Ecrane de Demonstrat

1. **Login Screen** → Introducere email/parola
2. **Register Screen** → Creare cont nou
3. **Home Screen** → Obiecte pierdute + găsite recente
4. **Add Post Screen** → Completare formular complet
   - Selectare imagine
   - Selectare locație pe hartă
   - Validări
5. **Search Screen** → Filtrare cu criterii
6. **Details Screen** → Vizualizare anunț complet
   - Hartă cu marker
   - Buton "Contact Owner"
7. **Chat** → Conversație cu altcineva
8. **Profile Screen** → Logout
9. **Flow complet**: Înregistrare → Creare post → Caută alt post → Contact owner → Chat → Logout

---

## Note Tehnice

- **JWT Expiry**: 7 days
- **Password Min Length**: 6 characters
- **Polling Chat**: 5 seconds
- **Debounce Search**: 300ms
- **Bcrypt Salt**: 10 rounds
- **Image Quality**: 0.9 (expo-image-picker)
- **MongoDB Cluster**: Replica Set cu 3 noduri
- **Backend Port**: 3000 (development), 5000 (recommended port, check .env)

---

**Ultima actualizare:** 3 octombrie 2026  
**Contact Backend:** http://localhost:3000  
**Database:** MongoDB Atlas Cluster0

