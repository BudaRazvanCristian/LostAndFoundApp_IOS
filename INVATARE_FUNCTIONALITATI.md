# 📚 Ghid de Învățare: Funcționalități Principale Lost & Found

**Pentru înțelegere și explicare profesoarei**

---

## 1️⃣ AUTENTIFICARE (Login & Register)

### Ce se întâmplă?
Utilizatorul se loghează cu email/parola → Aplicația primește un token JWT → Token-ul este stocat local → La fiecare cerere API, token-ul este trimis în header.

### Structura Coda

#### A. Frontend: LoginScreen.tsx

```typescript
// Utilizatorul apasă butonul "Login"
const handleLogin = async () => {
  // 1. Validare: email și parola nu sunt goale
  if (!email.trim() || !password.trim()) {
    Alert.alert("Error", "Please enter email and password.");
    return;
  }

  setIsLoading(true);
  try {
    // 2. Apel funcție din AuthContext
    await login(email.trim(), password);
    // 3. Dacă reușește → navigă automat la Home
  } catch (error) {
    // 4. Dacă eșuează → afișează mesaj de eroare
    Alert.alert("Login Failed", error.message);
  } finally {
    setIsLoading(false);
  }
};
```

**Ce face:**
- ✅ Preia email și parola din input-uri
- ✅ Validează că nu sunt goale
- ✅ Trimite la `login()` din AuthContext
- ✅ Tratează erori și afișează mesaje

#### B. Frontend: AuthContext.tsx (login function)

```typescript
// Funcție care se apelează din LoginScreen
const login = async (email: string, password: string): Promise<void> => {
  // 1. Apelează API backend cu email și parola
  const { user: apiUser, token } = await apiService.loginUser(email, password);
  
  // 2. Creează obiect utilizator
  const authUser: AuthUser = {
    id: apiUser.id,
    email: apiUser.email,
    displayName: apiUser.displayName,
    phone: apiUser.phone,
    token,  // JWT Token important!
  };
  
  // 3. Salvează în AsyncStorage (memorie locală persistentă)
  await AsyncStorage.setItem("currentUser", JSON.stringify(authUser));
  
  // 4. Actualizează state global
  setUser(authUser);
  // Automat, RootNavigator vede că user != null
  // → navigă la Main flow (Home screen)
};
```

**Ce face:**
- ✅ Trimite credențialele la backend
- ✅ Primește tokenul JWT
- ✅ Salvează în AsyncStorage (nu dispare la restart)
- ✅ Actualizează state → declanșează re-render navigației

#### C. Backend: auth.ts (Login endpoint)

```typescript
// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 1. Validare input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // 2. Caută utilizator în MongoDB după email
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // 3. Compară parola din input cu hash-ul din DB
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // 4. Creează JWT token (valabil 7 zile)
  const token = generateToken(user._id.toString());

  // 5. Returnează user data + token
  return res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      phone: user.phone,
      token,  // Acesta primește frontend-ul
    },
  });
});
```

**Ce face:**
- ✅ Primește email și parola
- ✅ Caută utilizatorul în BD
- ✅ Verifică parola (hash)
- ✅ Genereaza JWT
- ✅ Returnează token

#### D. Backend: Middleware (verifyToken)

```typescript
// Middleware care protejează endpoint-urile private
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Extrage token din header
  // Header arată: "Authorization: Bearer eyJhbGc..."
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    // 2. Verifică semătura JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    
    // 3. Injectează userId în request
    req.userId = (decoded as any).userId;
    req.user = decoded;
    
    // 4. Continuă la handler-ul de route
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
```

**Ce face:**
- ✅ Citește tokenul din header
- ✅ Validează că e un JWT valid
- ✅ Extrage userId din token
- ✅ Permite accesul la endpoint

### Diagrama Flux Login

```
User Input (email, password)
         ↓
LoginScreen validates
         ↓
apiService.loginUser()
         ↓
POST /api/auth/login (backend)
         ↓
Backend caută user în DB
         ↓
Backend compară parola (bcryptjs)
         ↓
Backend generează JWT token
         ↓
Response: { user, token }
         ↓
Frontend salvează token în AsyncStorage
         ↓
AuthContext actualizează setUser()
         ↓
RootNavigator vede isAuthenticated = true
         ↓
Navigare la MainNavigator (Home)
```

### Unde să Citești

- **Frontend Auth**: `src/context/AuthContext.tsx` (login, register, logout)
- **Frontend Login Screen**: `src/screens/auth/LoginScreen.tsx`
- **Backend Auth Routes**: `backend/src/routes/auth.ts`
- **Backend JWT Middleware**: `backend/src/middleware/auth.ts`
- **User Model**: `backend/src/models/User.ts` (password hashing)

---

## 2️⃣ ADĂUGARE POST (Add Post Screen)

### Ce se întâmplă?
Utilizatorul umple un formular (titlu, descriere, imagine, locație pe hartă) → Validează toate câmpurile → Trimite la backend → Backend salvează în MongoDB → Post apare în lista principală.

### Structura Codului

#### A. Frontend: AddPostScreen.tsx (Selectare Imagine)

```typescript
// Funcție apelată când utilizatorul apasă "Choose Image"
const handlePickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,  // Doar imagini
    allowsEditing: true,                              // Permite crop
    aspect: [4, 3],                                   // Aspect ratio
    quality: 0.9,                                     // Compresiunie
    base64: true,                                     // Convertește la base64
  });

  // Dacă utilizatorul nu a anulat
  if (!result.canceled) {
    const selectedAsset = result.assets[0];
    
    // Salvează URI-ul pentru preview local
    setImageUri(selectedAsset.uri);
    
    // Convertește la data URI pentru upload
    setImageUploadUri(buildUploadImageUri(selectedAsset));
  }
};

// Helper: Convertește imaginea la data URI
const buildUploadImageUri = (asset: ImagePicker.ImagePickerAsset): string => {
  if (asset.base64) {
    const mimeType = asset.mimeType || "image/jpeg";
    // "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD/2wBDAAAA..."
    return `data:${mimeType};base64,${asset.base64}`;
  }
  return asset.uri;
};
```

**Ce face:**
- ✅ Deschide galeria de imagini
- ✅ Permite editare (crop/resize)
- ✅ Convertește la base64 (text)
- ✅ Salvează pentru upload

#### B. Frontend: AddPostScreen.tsx (Selectare Locație pe Hartă)

```typescript
// Utilizatorul apasă pe hartă
const handleMapPress = (event: MapPressEvent) => {
  // Extrage coordonatele din eveniment
  const { latitude: selectedLatitude, longitude: selectedLongitude } 
    = event.nativeEvent.coordinate;
  
  // Salvează în state
  setLatitude(selectedLatitude);
  setLongitude(selectedLongitude);
};

// Harta în JSX
<MapView
  style={styles.map}
  initialRegion={{
    latitude: latitude ?? 44.4268,    // Default Bucureștiul
    longitude: longitude ?? 26.1025,
    latitudeDelta: 0.08,              // Zoom level
    longitudeDelta: 0.08,
  }}
  onPress={handleMapPress}            // Apelează la tap
>
  {/* Afișează marker dacă au selectat locație */}
  {latitude !== null && longitude !== null && Marker ? (
    <Marker 
      coordinate={{ latitude, longitude }} 
      title="Selected location" 
    />
  ) : null}
</MapView>
```

**Ce face:**
- ✅ Renderizează hartă interactivă
- ✅ Captează tap-ul utilizatorului
- ✅ Salvează coordonate (lat/long)
- ✅ Afișează marker la locație

#### C. Frontend: AddPostScreen.tsx (Validare & Submit)

```typescript
// Verifică dacă TOATE câmpurile sunt completate
const canSubmit = useMemo(
  () =>
    Boolean(
      title.trim() &&
      category.trim() &&
      location.trim() &&
      latitude !== null &&          // Trebuie marcat pe hartă
      longitude !== null &&
      date.trim() &&
      description.trim() &&
      ownerName.trim() &&
      phoneNumber.trim() &&
      imageUri &&                   // Trebuie selectată imagine
      imageUploadUri
    ),
  [category, date, description, imageUri, imageUploadUri, latitude, location, longitude, ownerName, phoneNumber, title],
);

// Apelat când utilizatorul apasă "Create Post"
const handleCreatePost = async () => {
  // 1. Cheamă funcția din ItemsContext
  await addItem({
    title: title.trim(),
    status,
    category: category.trim(),
    location: location.trim(),
    latitude,
    longitude,
    date: date.trim(),
    description: description.trim(),
    ownerName: ownerName.trim(),
    phoneNumber: phoneNumber.trim(),
    imageUri: imageUploadUri,  // Data URI cu base64
  });

  // 2. Dacă s-a reușit, navighează înapoi
  Alert.alert("Success", "Post created successfully!");
  navigation.goBack();
};
```

**Ce face:**
- ✅ Verifică că TOATE câmpurile sunt completate
- ✅ Dezactivează butonul "Create" dacă lipsesc detalii
- ✅ Trimite datele la `addItem()` din ItemsContext
- ✅ Afișează mesaj și navighează înapoi

#### D. Frontend: ItemsContext.tsx (addItem function)

```typescript
const addItem = async (newPost: Omit<Item, "id" | "userId" | "createdAt">): Promise<void> => {
  try {
    // Apelează API service
    const createdPost = await apiService.createPost(newPost);
    
    // Adaugă la lista locală (imediată)
    setLostItems((prev) => [createdPost, ...prev]);
    setFoundItems((prev) => [createdPost, ...prev]);
  } catch (error) {
    throw error;
  }
};
```

**Ce face:**
- ✅ Apelează API pentru a salva în backend
- ✅ Adaugă postul local imediat (optimistic update)
- ✅ Tratează erori

#### E. Backend: posts.ts (POST /api/posts endpoint)

```typescript
// POST /api/posts (protejat cu verifyToken)
router.post("/posts", verifyToken, async (req: Request, res: Response) => {
  const { title, description, category, location, latitude, longitude, status, date, ownerName, phoneNumber, imageUri } = req.body;

  // 1. Validare
  if (!title || !description || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // 2. Creează postul (userId vine din JWT token)
  const post = new Post({
    userId: req.userId,        // Din JWT middleware
    title,
    description,
    category,
    location,
    latitude,
    longitude,
    status,
    date,
    ownerName,
    phoneNumber,
    imageUri,                  // Data URI salvat direct
  });

  // 3. Salvează în MongoDB
  await post.save();

  // 4. Returnează postul creat
  return res.status(201).json({
    message: "Post created successfully",
    post,
  });
});
```

**Ce face:**
- ✅ Primește datele formularului
- ✅ Validează câmpurile obligatorii
- ✅ Creează obiect Post (userId din JWT)
- ✅ Salvează în MongoDB
- ✅ Returnează postul cu ID generat

#### F. Backend: Post.ts (Mongoose Model)

```typescript
const PostSchema = new Schema<IPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    category: String,
    location: String,
    latitude: Number,
    longitude: Number,
    status: {
      type: String,
      enum: ["Lost", "Found"],
    },
    date: String,
    ownerName: String,
    phoneNumber: String,
    imageUri: {
      type: String,  // Stochează data URI sau URL
      default: "",
    },
  },
  { timestamps: true }  // Adaugă automat createdAt, updatedAt
);
```

**Ce face:**
- ✅ Definește structura documentului Post
- ✅ userId este Foreign Key la User
- ✅ imageUri stochează imaginea ca text (base64)

### Diagrama Flux Add Post

```
User completează formular + selectează imagine + hartă
         ↓
Frontend validează TOATE câmpurile
         ↓
ImagePicker convertește imagine la base64
         ↓
User apasă "Create Post"
         ↓
ItemsContext.addItem() apelează apiService
         ↓
POST /api/posts (cu JWT token în header)
{
  title: "Lost Wallet",
  description: "...",
  imageUri: "data:image/jpeg;base64,..."
  latitude: 44.4268,
  longitude: 26.1025,
  ...
}
         ↓
Backend middleware verifyToken() extrage userId din JWT
         ↓
Backend creează Post document cu userId
         ↓
Backend salvează în MongoDB collection "posts"
         ↓
Response: { post: {...} }
         ↓
Frontend adaugă local la lostItems array
         ↓
HomeScreen se re-renderizează cu noul post
         ↓
User vede postul în lista (optimistic update)
```

### Unde să Citești

- **Frontend Form**: `src/screens/main/AddPostScreen.tsx` (imagini + hartă + validare)
- **Frontend State**: `src/context/ItemsContext.tsx` (addItem function)
- **API Call**: `src/services/apiService.ts` (createPost function)
- **Backend Route**: `backend/src/routes/posts.ts` (POST /posts)
- **Backend Model**: `backend/src/models/Post.ts` (schema)

---

## 3️⃣ CĂUTARE & FILTRARE (Search Screen)

### Ce se întâmplă?
Utilizatorul tastează în search box → Aplicația așteaptă 300ms (debounce) → Trimite query-uri la backend → Backend caută în MongoDB cu regex → Returnează rezultatele filtrate.

### Structura Codului

#### A. Frontend: LostItemsScreen.tsx (Inputs & Debounce)

```typescript
const [titleQuery, setTitleQuery] = useState("");
const [categoryQuery, setCategoryQuery] = useState("");
const [locationQuery, setLocationQuery] = useState("");
const [dateQuery, setDateQuery] = useState("");

// Se execută după fiecare schimbare de text
useEffect(() => {
  // Debounce: așteptă 300ms înainte de a apela API
  const timeoutId = setTimeout(async () => {
    try {
      // Apelează API cu filtre
      const results = await apiService.getAllPosts({
        status: "Lost",  // Doar obiecte pierdute
        title: titleQuery.trim() || undefined,
        date: dateQuery.trim() || undefined,
        category: categoryQuery.trim() || undefined,
        location: locationQuery.trim() || undefined,
      });
      setSearchItems(results);
    } catch (error) {
      console.error("Search error:", error);
    }
  }, 300);  // 300ms debounce

  return () => clearTimeout(timeoutId);
}, [titleQuery, categoryQuery, locationQuery, dateQuery]);

// Afișează input-uri
<TextInput
  placeholder="Search by title..."
  value={titleQuery}
  onChangeText={setTitleQuery}  // Declanșează useEffect
/>
```

**Ce face:**
- ✅ Salvează query-uri în state
- ✅ Așteaptă 300ms după fiecare tastă (evita 100+ requests)
- ✅ Apelează API cu parametri filtrati
- ✅ Afișează rezultate

#### B. Frontend: apiService.ts (Construirea Query)

```typescript
export const getAllPosts = async (filters?: {
  status?: string;
  title?: string;
  category?: string;
  location?: string;
  date?: string;
}): Promise<Item[]> => {
  let endpoint = "/posts";
  const params = new URLSearchParams();

  // 1. Construiește query string din filtre
  if (filters?.status) params.append("status", filters.status);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.title) params.append("title", filters.title);
  if (filters?.date) params.append("date", filters.date);
  if (filters?.location) params.append("location", filters.location);

  // 2. Construiește URL complet
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }
  // Exemple: /posts?status=Lost&title=wallet&location=downtown

  // 3. Apelează backend
  const data = await apiCall(endpoint, {
    method: "GET",
  });

  return data.posts || [];
};
```

**Ce face:**
- ✅ Ia filtrele din parametri
- ✅ Construiește query string (URL parameters)
- ✅ Apelează GET /posts?status=Lost&title=...
- ✅ Returnează array de posts

#### C. Backend: posts.ts (Filtrare în MongoDB)

```typescript
// GET /api/posts?status=Lost&title=wallet&category=...
router.get("/posts", async (req: Request, res: Response) => {
  try {
    // 1. Extrage parametri din query string
    const { status, title, category, location, date } = req.query;

    // 2. Construiește MongoDB query object
    const query: any = {};

    if (status) {
      query.status = String(status);
    }

    // $regex: case-insensitive search
    // $options: "i" = ignoreCase
    if (category) {
      query.category = { $regex: String(category), $options: "i" };
    }
    if (title) {
      query.title = { $regex: String(title), $options: "i" };
    }
    if (date) {
      query.date = { $regex: String(date), $options: "i" };
    }
    if (location) {
      query.location = { $regex: String(location), $options: "i" };
    }

    // 3. Execută query în MongoDB
    // .populate() = JOIN cu User collection
    const posts = await Post.find(query)
      .populate("userId", "displayName phone profileImage")
      .sort({ createdAt: -1 });  // Newest first

    // 4. Returnează rezultatele
    return res.status(200).json({
      posts,
      count: posts.length,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
});
```

**Ce face:**
- ✅ Extrage filtrele din URL
- ✅ Construiește MongoDB query cu $regex (fuzzy search)
- ✅ Caută în colecția "posts"
- ✅ Populates userData (displayName, phone)
- ✅ Sortează descrescător (newest first)
- ✅ Returnează array de rezultate

### Diagrama Flux Search

```
User tastează în Search box
         ↓
State se actualizează (setTitleQuery)
         ↓
useEffect se activează dar AȘTEPTĂ 300ms
         ↓
User continuă să tasteze
         ↓
Timeout se resetează (din cleanup)
         ↓
User se oprește din tastat
         ↓
300ms trec fără input nou
         ↓
apiService.getAllPosts() se apelează
{
  status: "Lost",
  title: "wallet",
  category: "accessories"
}
         ↓
GET /api/posts?status=Lost&title=wallet&category=accessories
         ↓
Backend construiește MongoDB query
         ↓
MongoDB caută cu $regex (fuzzy)
         ↓
Returnează: [post1, post2, post3]
         ↓
Frontend setSearchItems(results)
         ↓
SearchScreen se re-renderizează
         ↓
User vede rezultatele filtrate
```

### Unde să Citești

- **Frontend Search Screen**: `src/screens/main/LostItemsScreen.tsx` (input + debounce)
- **Frontend API Call**: `src/services/apiService.ts` (getAllPosts)
- **Backend Filtering**: `backend/src/routes/posts.ts` (GET /posts)

---

## 4️⃣ SISTEM DE CHAT (Messaging)

### Ce se întâmplă?
Utilizatorul apasă "Contact owner" pe un post → Se crează conversație → Se deschide chat thread → Utilizatorul scrie mesaje → Backend salvează în MongoDB → Frontend reîncarcă mesaje la 5 secunde (polling).

### Structura Codului

#### A. Frontend: DetailsScreen.tsx (Inițiere Chat)

```typescript
// Utilizatorul apasă "Contact owner"
const handleContactOwner = async () => {
  if (!user) return;
  
  setIsContacting(true);
  try {
    // 1. Apelează backend pentru a iniția conversație
    const conversation = await apiService.startConversation(
      item.id,           // postId
      item.userId        // otherUserId (proprietarul postului)
    );

    // 2. Navighează la ChatThreadScreen cu conversationId
    navigation.navigate("ChatThread", {
      conversationId: conversation.id,
      otherUserName: item.ownerName,
      postTitle: item.title,
    });
  } catch (error) {
    Alert.alert("Error", "Failed to start conversation");
  } finally {
    setIsContacting(false);
  }
};

// Buton în UI
{!isOwner && (
  <AppButton
    title="Contact owner"
    onPress={handleContactOwner}
  />
)}
```

**Ce face:**
- ✅ Apelează backend pentru a crea/obține conversație
- ✅ Primește conversationId
- ✅ Navighează la ChatThreadScreen

#### B. Backend: chats.ts (Start Conversation)

```typescript
// POST /api/chats/start-conversation
router.post("/start-conversation", verifyToken, async (req: Request, res: Response) => {
  const { postId, otherUserId } = req.body;

  // 1. Verifică că postul există
  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  // 2. Construiește participantKey (evita duplicate conversații)
  const participantKey = buildParticipantKey(
    req.userId as string, 
    otherUserId, 
    toStringId(post._id)
  );

  // 3. Caută conversația existentă
  let conversation = await Conversation.findOne({ participantKey });

  // Dacă NU există, o creează
  if (!conversation) {
    conversation = await Conversation.create({
      postId: post._id,
      participants: [
        new mongoose.Types.ObjectId(req.userId),
        new mongoose.Types.ObjectId(otherUserId),
      ],
      participantKey,
    });
  }

  return res.status(200).json({
    conversation,
    id: conversation._id,
  });
});

// Helper: Construiește key unic
const buildParticipantKey = (user1: string, user2: string, postId: string): string => {
  return [user1, user2].sort().join("_") + "_" + postId;
};
```

**Ce face:**
- ✅ Verifică postul
- ✅ Construiește key unic (evita duplicate)
- ✅ Caută conversație existentă
- ✅ Dacă nu există, o creează
- ✅ Returnează conversationId

#### C. Frontend: ChatThreadScreen.tsx (Afișare Mesaje)

```typescript
// Se execută la focus + setează polling
useEffect(() => {
  // 1. Inițial, încarcă mesajele
  loadThread().catch(() => undefined);

  // 2. Polling la 5 secunde
  const interval = setInterval(() => {
    loadThread().catch(() => undefined);
  }, 5000);

  return () => clearInterval(interval);
}, []);

const loadThread = useCallback(async () => {
  // 1. Apelează API
  const data = await apiService.getConversationMessages(conversationId);
  
  // 2. Salvează mesajele în state
  setMessages(data.messages);
  setRemoteTitle(data.conversation.postId?.title || postTitle || "Chat");
  setIsLoading(false);
}, [conversationId, postTitle]);

// Afișare mesaje în JSX
{messages.map((msg) => (
  <ChatBubble
    key={msg.id}
    message={msg.text}
    isSender={msg.senderId === user?.id}
  />
))}
```

**Ce face:**
- ✅ Apelează backend pentru a obține mesajele
- ✅ Setează polling la 5 secunde
- ✅ Reîncarcă mesajele periodic
- ✅ Afișează mesajele cu ChatBubble component

#### D. Frontend: ChatThreadScreen.tsx (Trimitere Mesaj)

```typescript
const [messageText, setMessageText] = useState("");

// Utilizatorul apasă "Send"
const handleSendMessage = async () => {
  const trimmed = messageText.trim();
  if (!trimmed) return;

  try {
    // 1. Apelează API
    const result = await apiService.sendMessage(conversationId, trimmed);
    
    // 2. Adaugă imediat în UI (optimistic update)
    setMessages((current) => [...current, result.message]);
    
    // 3. Șterge input
    setMessageText("");
  } catch (error) {
    Alert.alert("Error", "Failed to send message");
  }
};

// UI
<TextInput
  value={messageText}
  onChangeText={setMessageText}
  placeholder="Type a message..."
/>
<TouchableOpacity onPress={handleSendMessage}>
  <Text>Send</Text>
</TouchableOpacity>
```

**Ce face:**
- ✅ Trimite mesajul la backend
- ✅ Adaugă imediat în UI (nu așteptă polling)
- ✅ Șterge input-ul
- ✅ Tratează erori

#### E. Backend: chats.ts (Send Message)

```typescript
// POST /api/chats/conversations/:conversationId/messages
router.post("/conversations/:conversationId/messages", verifyToken, async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { text } = req.body;

  // 1. Validare
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Message text is required" });
  }

  // 2. Creează Message document
  const message = await Message.create({
    conversationId,
    senderId: req.userId,
    text: text.trim(),
  });

  // 3. Actualizează ultima interacțiune pe Conversation
  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    conversation.lastMessageSenderId = new mongoose.Types.ObjectId(req.userId);
    await conversation.save();
  }

  // 4. Returnează mesajul creat
  return res.status(201).json({
    message: {
      id: message._id,
      text: message.text,
      senderId: message.senderId,
      createdAt: message.createdAt,
    },
  });
});
```

**Ce face:**
- ✅ Creează Message document în MongoDB
- ✅ Actualizează lastMessage pe Conversation (pentru inbox)
- ✅ Returnează mesajul creat (ca confirmare)

### Diagrama Flux Chat

```
User pe DetailsScreen apasă "Contact owner"
         ↓
POST /api/chats/start-conversation
{
  postId: "...",
  otherUserId: "..."
}
         ↓
Backend creeaza/gaseste Conversation
         ↓
Response: { id: conversationId }
         ↓
Frontend navigează la ChatThreadScreen
         ↓
useEffect apelează loadThread()
         ↓
GET /api/chats/conversations/:conversationId
         ↓
Backend returnează mesajele din colecția messages
         ↓
Frontend: setMessages(data.messages)
         ↓
ChatThreadScreen se renderizează cu mesaje
         ↓
useEffect setează polling la 5 secunde
         ↓
---
         ↓
User scrie mesaj + apasă "Send"
         ↓
POST /api/chats/conversations/:conversationId/messages
{
  text: "Hello, is this available?"
}
         ↓
Backend creează Message document
         ↓
Backend actualizează Conversation.lastMessage
         ↓
Response: { message: {...} }
         ↓
Frontend: setMessages([...current, newMessage])  (optimistic)
         ↓
ChatThreadScreen se re-renderizează
         ↓
După 5 secunde, polling reîncarcă mesajele (sincronizare)
         ↓
Alte mesaje de la recipient apar pe ecran
```

### Unde să Citești

- **Frontend Details Screen**: `src/screens/main/DetailsScreen.tsx` (contact owner)
- **Frontend Chat Thread**: `src/screens/main/ChatThreadScreen.tsx` (mesaje + polling)
- **Frontend Chat Inbox**: `src/screens/main/ChatScreen.tsx` (lista conversații)
- **Backend Chat Routes**: `backend/src/routes/chats.ts` (conversații + mesaje)
- **Backend Models**: `backend/src/models/Conversation.ts`, `Message.ts`

---

## 📊 Tabel Comparativ: Frontend vs Backend

| Proces | Frontend | Backend |
|--------|----------|---------|
| **Login** | Preia email/parola, apelează API | Verifică credențiale, generează JWT |
| **Add Post** | Umple formular, validează, trimite date | Primește date, salvează în MongoDB |
| **Search** | Debounce, construiește query, afișează rezultate | Caută cu regex, returnează filtrele |
| **Chat** | Afișează mesaje (polling), apelează send | Salvează mesaje, actualizează inbox |
| **Autentificare** | Salvează token în AsyncStorage | Verifică JWT la fiecare request |

---

## 🎯 Concepte Cheie de Explicat

### 1. JWT Token
```
Ce e? Token text care conține informații codificate
De ce? Pentru a dovedi că utilizatorul e autentificat
Unde se salvează? În AsyncStorage (memorie locală)
Cum se trimite? În header: Authorization: Bearer <token>
Cât durează? 7 zile (apoi trebuie să se logheze din nou)
```

### 2. Debounce
```
Ce e? Așteptare înainte de a executa o funcție
De ce? Să nu trimiți 100+ cereri API la fiecare tastă
Cum? setTimeout + cleanup la fiecare input nou
Exemplu: Aștept 300ms de la ultima tastă → apoi apez API
```

### 3. Optimistic Update
```
Ce e? Adaugi datele în UI înainte ca backend să confirme
De ce? Experiență utilizator mai rapidă (nu aștepți response)
Cum? 
  1. User apasă Send
  2. Frontend adaugă mesajul în array
  3. Backend confirmă (sau rollback dacă eșuează)
Exemplu: Chat - mesajul apare imediat, nu aștepți polling
```

### 4. Regex Search
```
Ce e? Pattern matching pentru text
$regex: "wallet" = caută "wallet" oriunde în text
$options: "i" = case-insensitive (wallet, Wallet, WALLET = la fel)
Exemplu: Post cu titlu "Lost Red Wallet" se găsește dacă caut "wallet"
```

### 5. Populate (MongoDB)
```
Ce e? JOIN dintr-o colecție în alta
De ce? Ca să ai datele utilizatorului fără query separat
Exemplu:
  Post { userId: "123", title: "Lost Wallet" }
  + populate("userId", "displayName phone")
  = Post { userId: { id: "123", displayName: "John", phone: "+40..." }, title: "..." }
```

---

## 💡 Sfaturi pentru Prezentare

### 1. Explică Fluxul Complet (Login → Post → Chat)

```
1. "Utilizatorul se logheaza cu email/parola"
2. "Frontend validează și trimite la backend"
3. "Backend verifică parola și generează JWT"
4. "JWT se salvează local și se trimite la fiecare cerere"
5. "Utilizatorul poate crea post-uri"
6. "Datele se salvează în MongoDB"
7. "Alte utilizatori pot căuta și contacta"
8. "Mesajele se sincronizează via polling"
```

### 2. Arată Codul Mic & Specific

Nu arăta 100 linii de cod. Arată doar:
- 5-10 linii pentru fiecare concept
- Cu comentarii în limba română
- Explică ce face fiecare linie

### 3. Diferențiază Frontend vs Backend

```
Frontend = Ceea ce vede utilizatorul
  - Interfață frumoasă
  - Validări
  - Navigare

Backend = Serverul
  - Verifică datele
  - Salvează în DB
  - Gestionează permisiuni
```

### 4. Folosește Diagrame

Arată fluxul cu săgeți:
```
User Action → Frontend → API Call → Backend → Database
```

---

## 📚 Lecturi Recomandate (pentru aprofundare)

| Concept | Unde să Citești |
|---------|-----------------|
| JWT | `backend/src/middleware/auth.ts` + `backend/src/routes/auth.ts` |
| React Context | `src/context/AuthContext.tsx` + `src/context/ItemsContext.tsx` |
| API Calls | `src/services/apiService.ts` |
| React Navigation | `src/navigation/RootNavigator.tsx` + `MainNavigator.tsx` |
| MongoDB | `backend/src/models/` (User.ts, Post.ts, Message.ts) |
| Express Routes | `backend/src/routes/` (auth.ts, posts.ts, chats.ts) |

---

## ✅ Checklist: Ce Să Înțelegi Înainte de Prezentare

- [ ] Cum se loghează utilizatorul (email + parola → JWT token)
- [ ] Cum se salvează token în AsyncStorage
- [ ] Cum se trimite token la fiecare request (header Authorization)
- [ ] Cum se validează formularele (frontend + backend)
- [ ] Cum se salvează datele în MongoDB (schema + save)
- [ ] Cum funcționează căutarea cu regex
- [ ] Cum funcționează chat-ul (polling la 5 secunde)
- [ ] Cum se protejează endpoint-urile (verifyToken middleware)
- [ ] De ce se folosește bcryptjs pentru parolă (hashing)
- [ ] Ce e debounce și de ce se folosește

---

**Succes la prezentare! 🎓**

