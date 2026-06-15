# Auto-detect IP Configuration Guide

## Problemă

Aplicația necesita IP-ul manual setat la fiecare rețea (acasă, laborator, etc.). Pentru o prezentare pe orice netw, e imposibil.

## Soluție

Creat un script Node.js care detectează automat IP-ul mașinii și îl seează în `.env.local`.

## Utilizare

### Opțiunea 1: Auto-detect (Recomandată)

La fiecare start, rulează:

\`\`\`bash
cd LostAndFound
npm run setup      # Detectează IP-ul și actualizează .env.local
npm start          # Pornește Metro cu IP-ul detectat
npm run ios        # Sau npm run android
\`\`\`

Sau mai simplu:

\`\`\`bash
npm start          # Automat rulează `setup` și `start`
npm run ios
\`\`\`

### Opțiunea 2: Manual (dacă auto-detect nu merge)

1. Găsește IP-ul mașinii (macOS):
\`\`\`bash
ipconfig getifaddr en0
\`\`\`

2. Edițiază `.env.local`:
\`\`\`
EXPO_PUBLIC_API_HOST=192.168.1.100
\`\`\`

### Opțiunea 3: Cloud (Pentru prezentări Oficiale)

1. Deploy backend pe Render.com (gratuit):
   - Repo GitHub → Render → Web Service
   - Build: `npm install`
   - Start: `npm run build && npm start`

2. Actualizează `src/config/api.ts`:
\`\`\`typescript
const PROD_API_URL = 'https://your-backend.onrender.com/api';
\`\`\`

3. Build app și deploy:
\`\`\`bash
npm run build       # Compilează cu PROD_API_URL
eas build --platform ios --non-interactive
\`\`\`

## Flow Automat

1. **`npm start`**
   - Rulează `npm run setup`
   - Script-ul: detectează IP local → scrie în `.env.local`
   - Metro citește din environment variabile
   - App se conectează cu IP-ul corect

2. **App pe orice rețea**
   - Android Emulator: IP-ul mașinii → detectat automat
   - iOS Simulator: `localhost` (fallback)
   - Device fizic: IP-ul mașinii → detectat automat

## Cum Funcționează

\`\`\`
User rulează: npm start
  │
  ├─ npm run setup
  │   └─ node scripts/get-local-ip.js
  │       └─ Detectează IP (ex: 172.20.10.4)
  │       └─ Scrie în .env.local: EXPO_PUBLIC_API_HOST=172.20.10.4
  │
  ├─ react-native start
  │   └─ Metro citește EXPO_PUBLIC_API_HOST
  │   └─ App construiește API_URL cu IP detectat
  │
  └─ npm run ios
      └─ App se conectează la http://172.20.10.4:5001/api
\`\`\`

## Troubleshooting

### Script-ul nu detectează IP

\`\`\`bash
# 1. Verifica manual
ipconfig getifaddr en0

# 2. Edițiază .env.local manual cu IP-ul
EXPO_PUBLIC_API_HOST=192.168.1.100

# 3. Restart Metro
npm start
\`\`\`

### App-ul nu conectează la backend

1. Verifica că backend rulează:
\`\`\`bash
cd backend
PORT=5001 npm run dev
\`\`\`

2. Verifica IP în .env.local:
\`\`\`bash
cat .env.local | grep EXPO_PUBLIC_API_HOST
\`\`\`

3. Verifica conexiunea:
\`\`\`bash
curl http://172.20.10.4:5001/health
\`\`\`

## Pentru Prezentare Licență

**Soluția 1 (Laptop Personal - Recomandată):**
- Rulează backend local pe laptop
- La start, `npm start` detectează automat IP
- Conectează din orice netw (WiFi, hotspot)
- Nu ai dependență pe IP hardcodat

**Soluția 2 (Cloud - Backup):**
- Deploy backend pe Render.com
- App se conectează la URL stabil
- Merge pe orice netw fără setup
- Ideal dacă laptop nu e disponibil

