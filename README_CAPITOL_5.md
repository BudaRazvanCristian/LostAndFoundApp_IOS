# Capitolul 5 - Implementare (Aplicatia mobila "Lost & Found")

Acest capitol documenteaza implementarea reala a aplicatiei mobile "Lost & Found", pe baza codului sursa existent in proiectul React Native (frontend) si Node.js/Express (backend). Arhitectura urmeaza modelul client-server, cu persistenta in MongoDB si autentificare bazata pe JWT.

## 5.1 Pornirea aplicatiei, logare si inregistrare

La nivel de bootstrap, componenta principala `App.tsx` initializeaza contextul de autentificare si contextul de iteme, apoi incarca navigatorul radacina. Acest design permite separarea clara dintre logica de sesiune si logica de prezentare.

**Fisiere principale:**
- `App.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/AuthNavigator.tsx`
- `src/screens/auth/LoginScreen.tsx`
- `src/screens/auth/RegisterScreen.tsx`
- `src/context/AuthContext.tsx`
- `src/services/apiService.ts`
- `backend/src/routes/auth.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/models/User.ts`

### 5.1.1 Ecranul de pornire

In implementarea actuala, aplicatia nu defineste un splash custom separat pentru onboarding functional. Ecranul de start al fluxului neautentificat este ecranul de login, incarcat de `AuthNavigator`, iar alegerea intre zona Auth si zona Main este facuta in `RootNavigator` pe baza starii `isAuthenticated` din `AuthContext`.

#### Fragment de cod 1 - Comutare intre fluxul Auth si fluxul Main
**Sursa:** `src/navigation/RootNavigator.tsx`

```tsx
const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

**Rol:** decide in mod centralizat ce zona poate accesa utilizatorul. Daca exista sesiune activa, utilizatorul intra direct in fluxul principal; altfel, intra in fluxul de autentificare.

#### Fragment de cod 2 - Definirea ecranelor de autentificare
**Sursa:** `src/navigation/AuthNavigator.tsx`

```tsx
const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};
```

**Rol:** configureaza explicit traseul initial de acces al utilizatorilor neautentificati.

**Captura recomandata:**
- Ecranul de login (`LoginScreen`) ca punct de intrare in aplicatie.

---

### 5.1.2 Ecranul de autentificare

Autentificarea este implementata printr-un formular React Native care valideaza local campurile obligatorii si apoi foloseste metoda `login` din `AuthContext`. In backend, ruta `/auth/login` valideaza credentialele si genereaza JWT.

#### Fragment de cod 1 - Validare locala + apel login
**Sursa:** `src/screens/auth/LoginScreen.tsx`

```tsx
const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert("Error", "Please enter email and password.");
    return;
  }

  setIsLoading(true);
  try {
    await login(email.trim(), password);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    Alert.alert("Login Failed", message);
  } finally {
    setIsLoading(false);
  }
};
```

**Rol:** realizeaza validarea minima in client (campuri necompletate), apoi declanseaza autentificarea in contextul global.

#### Fragment de cod 2 - Apel HTTP de login + stocarea tokenului
**Sursa:** `src/services/apiService.ts`

```ts
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
    false
  );

  if (data.user.token) {
    await AsyncStorage.setItem("authToken", data.user.token);
  }

  return { user: data.user, token: data.user.token };
};
```

**Rol:** transmite credentialele catre backend si persista JWT in `AsyncStorage` pentru request-urile ulterioare.

#### Fragment de cod 3 - Validare credentiale si generare JWT
**Sursa:** `backend/src/routes/auth.ts`

```ts
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user._id.toString());
  return res.status(200).json({
    message: "Login successful",
    user: { id: user._id, email: user.email, displayName: user.displayName, phone: user.phone, token },
  });
});
```

**Rol:** implementeaza autentificarea propriu-zisa in server: cautare user, verificare parola hash-uita, emitere JWT.

**Capturi recomandate:**
- Formular login completat.
- Mesaj de eroare pentru date invalide.
- Tranzitia reusita in zona `Main` dupa autentificare.

---

### 5.1.3 Ecranul de inregistrare

Inregistrarea urmeaza acelasi tipar: validari in frontend, request la backend, creare document utilizator in MongoDB si emitere token.

#### Fragment de cod 1 - Validari in frontend
**Sursa:** `src/screens/auth/RegisterScreen.tsx`

```tsx
const handleRegister = async () => {
  if (!displayName.trim() || !email.trim() || !password.trim()) {
    Alert.alert("Error", "Please fill in all fields.");
    return;
  }

  if (password.length < 6) {
    Alert.alert("Error", "Password must be at least 6 characters.");
    return;
  }

  setIsLoading(true);
  try {
    await register(email.trim(), password, displayName.trim());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    Alert.alert("Registration Failed", message);
  } finally {
    setIsLoading(false);
  }
};
```

**Rol:** garanteaza corectitudinea minima a datelor inainte de trimiterea catre backend.

#### Fragment de cod 2 - Endpoint register + salvare in MongoDB
**Sursa:** `backend/src/routes/auth.ts`

```ts
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, displayName, phone } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "Email, password, and display name are required" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const user = new User({ email, password, displayName, phone });
  await user.save();

  const token = generateToken(user._id.toString());
  return res.status(201).json({
    message: "User registered successfully",
    user: { id: user._id, email: user.email, displayName: user.displayName, phone: user.phone, token },
  });
});
```

**Rol:** creeaza un nou utilizator in colectia `users` si returneaza tokenul de sesiune.

#### Fragment de cod 3 - Hash-ul parolei in model
**Sursa:** `backend/src/models/User.ts`

```ts
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});
```

**Rol:** securizeaza stocarea parolei in baza de date; parola nu este persistata in clar.

**Capturi recomandate:**
- Formular register completat.
- Mesaj de confirmare inregistrare.

---

### 5.1.4 Gestionarea sesiunii utilizatorului

Sesiunea este gestionata in `AuthContext` prin doua niveluri de persistenta:
- `authToken` (pentru autorizare API),
- `currentUser` (pentru datele utilizatorului in UI).

#### Fragment de cod 1 - Restaurarea sesiunii la pornire
**Sursa:** `src/context/AuthContext.tsx`

```tsx
useEffect(() => {
  const restoreSession = async () => {
    try {
      const stored = await AsyncStorage.getItem("currentUser");
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  restoreSession();
}, []);
```

**Rol:** mentine autentificarea intre relansari prin rehidratatea starii din stocarea locala.

#### Fragment de cod 2 - Login/Register/Logout in context
**Sursa:** `src/context/AuthContext.tsx`

```tsx
const login = async (email: string, password: string): Promise<void> => {
  const { user: apiUser, token } = await apiService.loginUser(email, password);
  const authUser: AuthUser = { id: apiUser.id, email: apiUser.email, displayName: apiUser.displayName, phone: apiUser.phone, token };
  await AsyncStorage.setItem("currentUser", JSON.stringify(authUser));
  setUser(authUser);
};

const logout = async (): Promise<void> => {
  await apiService.logoutUser();
  await AsyncStorage.removeItem("currentUser");
  setUser(null);
};
```

**Rol:** realizeaza schimbarea starii globale a sesiunii si persistenta asociata.

#### Fragment de cod 3 - Verificare JWT in backend
**Sursa:** `backend/src/middleware/auth.ts`

```ts
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
  req.userId = (decoded as any).userId;
  req.user = decoded;
  next();
};
```

**Rol:** protejeaza endpoint-urile private prin validarea tokenului si injectarea `userId` in request.

**Capturi recomandate:**
- Ecran `Profile` cu datele utilizatorului logat.
- Confirmare de logout si revenire la login.

## 5.2 Implementarea gestionarii obiectelor

Modulul de gestionare a obiectelor este implementat printr-un context (`ItemsContext`), ecrane dedicate (`AddPost`, `EditPost`, `Home`, `Details`) si rute REST (`/api/posts`).

**Fisiere principale:**
- `src/context/ItemsContext.tsx`
- `src/screens/main/AddPostScreen.tsx`
- `src/screens/main/EditPostScreen.tsx`
- `src/screens/main/HomeScreen.tsx`
- `src/screens/main/DetailsScreen.tsx`
- `src/services/apiService.ts`
- `backend/src/routes/posts.ts`
- `backend/src/models/Post.ts`

### 5.2.1 Adaugarea unui obiect

Formularul de adaugare este unul extins si impune validarea campurilor esentiale (inclusiv selectie pe harta si imagine).

#### Fragment de cod 1 - Conditia de submit in Add Post
**Sursa:** `src/screens/main/AddPostScreen.tsx`

```tsx
const canSubmit = useMemo(
  () =>
    Boolean(
      title.trim() &&
        category.trim() &&
        location.trim() &&
        latitude !== null &&
        longitude !== null &&
        date.trim() &&
        description.trim() &&
        ownerName.trim() &&
        phoneNumber.trim() &&
        imageUri &&
        imageUploadUri,
    ),
  [category, date, description, imageUri, imageUploadUri, latitude, location, longitude, ownerName, phoneNumber, title],
);
```

**Rol:** impune completarea tuturor campurilor obligatorii inainte de trimiterea formularului.

#### Fragment de cod 2 - Trimiterea datelor catre backend
**Sursa:** `src/screens/main/AddPostScreen.tsx`

```tsx
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
  imageUri: imageUploadUri,
});
```

**Rol:** construieste payload-ul complet al postarii, inclusiv date geografice si imagine.

#### Fragment de cod 3 - Persistenta in MongoDB
**Sursa:** `backend/src/routes/posts.ts`

```ts
const post = new Post({
  userId: req.userId,
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
  imageUri,
});

await post.save();
```

**Rol:** salveaza anuntul in colectia `posts` folosind schema Mongoose.

**Capturi recomandate:**
- Formularul complet `Add Post`.
- Confirmarea de succes dupa creare.

---

### 5.2.2 Editarea si stergerea obiectelor

Aplicatia include explicit functionalitati de editare si stergere, disponibile proprietarului postarii.

#### Fragment de cod 1 - Editare in frontend
**Sursa:** `src/screens/main/EditPostScreen.tsx`

```tsx
if (!isOwner) {
  Alert.alert("Not authorized", "You can edit only your own post.");
  return;
}

await apiService.updatePost(item.id, {
  title: title.trim(),
  imageUri,
  status,
  category: category.trim(),
  location: location.trim(),
  latitude: item.latitude,
  longitude: item.longitude,
  date: date.trim(),
  description: description.trim(),
  ownerName: ownerName.trim(),
  phoneNumber: phoneNumber.trim(),
});
```

**Rol:** aplica modificarile doar daca utilizatorul curent este proprietarul anuntului.

#### Fragment de cod 2 - Verificare ownership in backend (update)
**Sursa:** `backend/src/routes/posts.ts`

```ts
const post = await Post.findById(id);
if (!post) {
  return res.status(404).json({ error: "Post not found" });
}

if (post.userId.toString() !== req.userId) {
  return res.status(403).json({ error: "Not authorized to update this post" });
}
```

**Rol:** previne modificarea anunturilor de catre utilizatori neautorizati.

#### Fragment de cod 3 - Stergere din ecranul de detalii
**Sursa:** `src/screens/main/DetailsScreen.tsx`

```tsx
await apiService.deletePost(item.id);
await refreshItems();
Alert.alert("Post deleted", "Your post was deleted successfully.");
navigation.goBack();
```

**Rol:** sterge anuntul din backend si sincronizeaza imediat lista din frontend.

**Capturi recomandate:**
- Ecranul `Edit Post` cu campuri precompletate.
- Dialogul de confirmare pentru stergere.

---

### 5.2.3 Vizualizarea anunturilor

Afisarea anunturilor este structurata pe doua niveluri:
- listare in `HomeScreen` / `LostItemsScreen` / `FoundItemsScreen`;
- detalii complete in `DetailsScreen`.

#### Fragment de cod 1 - Incarcare date in Home
**Sursa:** `src/screens/main/HomeScreen.tsx`

```tsx
const { lostItems, foundItems, refreshItems } = useItems();

useFocusEffect(
  useCallback(() => {
    refreshItems().catch(() => undefined);
  }, [refreshItems]),
);
```

**Rol:** reimprospateaza datele la revenirea pe ecran, mentinand consistenta cu backend-ul.

#### Fragment de cod 2 - Navigare catre detalii
**Sursa:** `src/screens/main/HomeScreen.tsx`

```tsx
const openDetails = (item: Item) => {
  navigation.navigate("Details", { item });
};
```

**Rol:** transmite obiectul selectat catre ecranul de detalii.

#### Fragment de cod 3 - Afisare detalii si actiuni contextuale
**Sursa:** `src/screens/main/DetailsScreen.tsx`

```tsx
const isOwner = useMemo(() => {
  return Boolean(user?.id && item.userId && user.id === item.userId);
}, [item.userId, user?.id]);

{!isOwner && (
  <AppButton
    title={isContacting ? "Opening chat..." : "Contact owner"}
    onPress={handleContactOwner}
  />
)}

{isOwner && (
  <>
    <AppButton title="Edit post" onPress={handleEdit} variant="secondary" />
    <AppButton title={isDeleting ? "Deleting..." : "Delete post"} onPress={handleDelete} variant="danger" />
  </>
)}
```

**Rol:** personalizeaza interfata in functie de proprietate: proprietarul poate edita/sterge, ceilalti utilizatori pot initia chat.

**Capturi recomandate:**
- `HomeScreen` cu sectiunile "Recent Lost Items" si "Recent Found Items".
- `DetailsScreen` pentru un item care nu apartine utilizatorului.
- `DetailsScreen` pentru un item propriu (cu butoane edit/delete).

## 5.3 Implementarea uploadului de imagini

Uploadul de imagini este implementat in frontend prin `expo-image-picker`, iar in backend imaginea este stocata ca sir (`imageUri`) in documentul `Post`.

**Biblioteci folosite (confirmate in `package.json`):**
- `expo-image-picker`
- `react-native` (componente `Image`)
- `mongoose` (persistenta campului `imageUri`)

#### Fragment de cod 1 - Selectarea imaginii din galerie/camera
**Sursa:** `src/screens/main/AddPostScreen.tsx`

```tsx
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.9,
  base64: true,
});

if (!result.canceled) {
  const selectedAsset = result.assets[0];
  setImageUri(selectedAsset.uri);
  setImageUploadUri(buildUploadImageUri(selectedAsset));
}
```

**Rol:** permite selectia imaginii si pregateste doua forme: URI local pentru preview si URI pentru upload (inclusiv base64).

#### Fragment de cod 2 - Conversie la data URI
**Sursa:** `src/screens/main/AddPostScreen.tsx`

```tsx
const buildUploadImageUri = (asset: ImagePicker.ImagePickerAsset): string => {
  if (asset.base64) {
    const mimeType = asset.mimeType || "image/jpeg";
    return `data:${mimeType};base64,${asset.base64}`;
  }
  return asset.uri;
};
```

**Rol:** standardizeaza formatul imaginii trimise catre backend.

#### Fragment de cod 3 - Persistenta URL-ului imaginii in model
**Sursa:** `backend/src/models/Post.ts`

```ts
imageUri: {
  type: String,
  default: "",
},
```

**Rol:** defineste la nivel de schema campul in care este pastrata referinta imaginii pentru fiecare anunt.

**Capturi recomandate:**
- Dialog de selectie imagine.
- Preview imagine in `AddPostScreen`.
- Imagine afisata in card (`ItemCard`) si in `DetailsScreen`.

## 5.4 Implementarea geolocatiei si a hartii

Aplicatia foloseste `react-native-maps` pentru selectarea locatiei in `AddPostScreen` si afisarea markerului in `DetailsScreen`.

**Biblioteca folosita (confirmata):**
- `react-native-maps`

#### Fragment de cod 1 - Selectie locatie pe harta la creare postare
**Sursa:** `src/screens/main/AddPostScreen.tsx`

```tsx
const handleMapPress = (event: MapPressEvent) => {
  const { latitude: selectedLatitude, longitude: selectedLongitude } = event.nativeEvent.coordinate;
  setLatitude(selectedLatitude);
  setLongitude(selectedLongitude);
};

<MapView
  style={styles.map}
  initialRegion={{
    latitude: latitude ?? 44.4268,
    longitude: longitude ?? 26.1025,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  }}
  onPress={handleMapPress}
>
  {latitude !== null && longitude !== null && Marker ? (
    <Marker coordinate={{ latitude, longitude }} title="Selected location" />
  ) : null}
</MapView>
```

**Rol:** permite alegerea interactiva a coordonatelor geografice care vor fi salvate in anunt.

#### Fragment de cod 2 - Afisare marker in ecranul de detalii
**Sursa:** `src/screens/main/DetailsScreen.tsx`

```tsx
{typeof item.latitude === "number" && typeof item.longitude === "number" && (
  <MapView
    style={styles.map}
    initialRegion={{
      latitude: item.latitude,
      longitude: item.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }}
    onPress={openExternalMap}
    scrollEnabled={false}
    zoomEnabled={false}
  >
    {Marker ? (
      <Marker
        coordinate={{ latitude: item.latitude, longitude: item.longitude }}
        title={item.title}
        description={item.location}
      />
    ) : null}
  </MapView>
)}
```

**Rol:** prezinta vizual locul asociat anuntului, fara editare, pentru context geografic rapid.

#### Fragment de cod 3 - Deschidere in aplicatia nativa Maps
**Sursa:** `src/screens/main/DetailsScreen.tsx`

```tsx
const mapUrl =
  Platform.OS === "ios"
    ? `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`
    : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;

await Linking.openURL(mapUrl);
```

**Rol:** permite transferul utilizatorului catre aplicatia nativa de navigatie pentru orientare.

**Capturi recomandate:**
- Selectie marker pe harta in `AddPostScreen`.
- Harta in `DetailsScreen` cu coordonate.
- Butonul "Open in Maps".

## 5.5 Implementarea sistemului de cautare si filtrare

Cautarea este implementata in ecranele `LostItemsScreen` si `FoundItemsScreen`, prin filtre multiple si interogare API cu parametri query.

**Fisiere principale:**
- `src/screens/main/LostItemsScreen.tsx`
- `src/screens/main/FoundItemsScreen.tsx`
- `src/services/apiService.ts`
- `backend/src/routes/posts.ts`

### Search Screen in proiect
In `MainNavigator`, tab-ul "Search" este mapat catre `LostItemsScreen`:

```tsx
<Tab.Screen name="Search" component={LostItemsScreen} options={{ title: "Search" }} />
```

**Rol:** ecranul de cautare implicit deschide fluxul de Lost Items, iar Found Items este accesibil separat.

#### Fragment de cod 1 - Filtre active + debounce
**Sursa:** `src/screens/main/LostItemsScreen.tsx`

```tsx
const hasActiveFilters = useMemo(
  () => Boolean(titleQuery.trim() || dateQuery.trim() || categoryQuery.trim() || locationQuery.trim()),
  [categoryQuery, dateQuery, locationQuery, titleQuery],
);

const timeoutId = setTimeout(async () => {
  const results = await apiService.getAllPosts({
    status: "Lost",
    title: titleQuery.trim() || undefined,
    date: dateQuery.trim() || undefined,
    category: categoryQuery.trim() || undefined,
    location: locationQuery.trim() || undefined,
  });
  setSearchItems(results);
}, 300);
```

**Rol:** evita request-urile excesive si trimite query-uri doar dupa stabilizarea inputului.

#### Fragment de cod 2 - Construirea query-ului in API service
**Sursa:** `src/services/apiService.ts`

```ts
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
```

**Rol:** converteste criteriile de filtrare intr-un request REST standardizat.

#### Fragment de cod 3 - Aplicarea filtrelor in backend
**Sursa:** `backend/src/routes/posts.ts`

```ts
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

const posts = await Post.find(query)
  .populate("userId", "displayName phone profileImage")
  .sort({ createdAt: -1 });
```

**Rol:** implementeaza filtrare server-side, insensibila la majuscule/minuscule, si returneaza rezultate ordonate cronologic.

**Capturi recomandate:**
- Ecran Search cu filtre completate.
- Rezultate filtrate vs fara filtre.
- Mesaj "No items match your search".

## 5.6 Implementarea chatului

Sistemul de chat este implementat pe doua ecrane: inbox (`ChatScreen`) si thread (`ChatThreadScreen`), cu persistenta in colectiile MongoDB `conversations` si `messages`.

**Fisiere principale:**
- `src/screens/main/ChatScreen.tsx`
- `src/screens/main/ChatThreadScreen.tsx`
- `src/services/apiService.ts`
- `backend/src/routes/chats.ts`
- `backend/src/models/Conversation.ts`
- `backend/src/models/Message.ts`

### Inbox Screen

#### Fragment de cod 1 - Incarcare conversatii la focus
**Sursa:** `src/screens/main/ChatScreen.tsx`

```tsx
const loadConversations = useCallback(async () => {
  setIsLoading(true);
  const data = await apiService.getConversations();
  setConversations(data);
  setIsLoading(false);
}, []);

useFocusEffect(
  useCallback(() => {
    loadConversations().catch(() => undefined);
  }, [loadConversations]),
);
```

**Rol:** asigura actualizarea inbox-ului la revenirea pe ecran.

### Chat Screen (thread)

#### Fragment de cod 2 - Incarcare mesaje + sincronizare periodica
**Sursa:** `src/screens/main/ChatThreadScreen.tsx`

```tsx
const loadThread = useCallback(async () => {
  const data = await apiService.getConversationMessages(conversationId);
  setMessages(data.messages);
  setRemoteTitle(data.conversation.postId?.title || postTitle || "Chat");
  setIsLoading(false);
}, [conversationId, postTitle]);

useEffect(() => {
  const interval = setInterval(() => {
    loadThread().catch(() => undefined);
  }, 5000);

  return () => clearInterval(interval);
}, [loadThread]);
```

**Rol:** implementeaza sincronizare prin polling la 5 secunde, mentinand thread-ul actualizat.

#### Fragment de cod 3 - Trimiterea mesajelor
**Sursa:** `src/screens/main/ChatThreadScreen.tsx`

```tsx
const result = await apiService.sendMessage(conversationId, trimmed);
setMessages((current) => [...current, result.message]);
setMessageText("");
```

**Rol:** adauga instant mesajul nou in UI dupa confirmarea serverului.

### Backend chat

#### Fragment de cod 4 - Creare/recuperare conversatie
**Sursa:** `backend/src/routes/chats.ts`

```ts
const participantKey = buildParticipantKey(req.userId as string, otherUserId, toStringId(post._id));

let conversation = await Conversation.findOne({ participantKey });
if (!conversation) {
  conversation = await Conversation.create({
    postId: post._id,
    participants: [new mongoose.Types.ObjectId(req.userId), new mongoose.Types.ObjectId(otherUserId)],
    participantKey,
  });
}
```

**Rol:** previne dublarea conversatiilor intre aceeasi doi utilizatori pentru acelasi anunt.

#### Fragment de cod 5 - Persistenta mesajului + actualizare metadata conversatie
**Sursa:** `backend/src/routes/chats.ts`

```ts
const message = await Message.create({
  conversationId,
  senderId: req.userId,
  text: text.trim(),
});

conversation.lastMessage = text.trim();
conversation.lastMessageAt = new Date();
conversation.lastMessageSenderId = new mongoose.Types.ObjectId(req.userId);
await conversation.save();
```

**Rol:** salveaza mesajul si actualizeaza sumarul conversatiei pentru inbox.

**Capturi recomandate:**
- Ecran Inbox cu lista de conversatii.
- Ecran thread cu mesaje trimise/primite.
- Fluxul "Contact owner" din `DetailsScreen` catre `ChatThreadScreen`.

## Elemente transversale relevante pentru implementare

### Arhitectura API si configurare mediu

- `src/config/api.ts` construieste dinamic URL-ul backend-ului in functie de platforma (iOS/Android, emulator/dispozitiv fizic), cu fallback-uri.
- `backend/src/server.ts` expune endpoint-urile sub prefixul `/api`.

#### Fragment de cod - Montare rute server
**Sursa:** `backend/src/server.ts`

```ts
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chats", chatRoutes);
```

**Rol:** defineste contractul API folosit de frontend.

### Persistenta MongoDB

Conectarea la MongoDB este realizata in `backend/src/config/database.ts` pe baza variabilei de mediu `MONGODB_URI`.

```ts
const mongoURI = process.env.MONGODB_URI;
await mongoose.connect(mongoURI);
```

### Biblioteci cheie folosite in implementare

Conform `package.json`-urilor proiectului:
- Frontend: `react-native`, `@react-navigation/*`, `@react-native-async-storage/async-storage`, `react-native-maps`, `expo-image-picker`, `expo-notifications`.
- Backend: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `cors`.

## Concluzie tehnica a capitolului

Implementarea aplicatiei "Lost & Found" demonstreaza un flux complet pentru scenariile principale ale domeniului: autentificare securizata, publicare si administrare de anunturi, localizare geografica, filtrare avansata si comunicare intre utilizatori prin chat. Solutia este construita modular (contexturi, servicii, ecrane, rute, modele), ceea ce permite extindere ulterioara fara modificari structurale majore.

Din perspectiva robustetii, proiectul include validari pe ambele niveluri (client/server), control de acces pe baza JWT si verificarea ownership-ului pentru operatii destructive. Din perspectiva experientei utilizatorului, aplicatia ofera feedback vizual (stari de incarcare, alerte), navigare coerenta si sincronizare periodica in chat.

---

## Lista centralizata de capturi recomandate pentru lucrare

1. Ecran login (start flow Auth).
2. Ecran register.
3. Ecran Profile cu sesiune activa.
4. Home cu sectiunile Lost/Found.
5. Add Post (formular complet + selectie imagine + harta).
6. Details (map + buton Contact owner).
7. Details pentru item propriu (Edit/Delete).
8. Search Lost cu filtre active.
9. Search Found cu filtre active.
10. Inbox (lista conversatii).
11. Chat thread (mesaje).
12. Confirmare logout si revenire in Auth flow.

