# Pornire Aplicatie LostAndFound

Ghid rapid pentru rulare in development.

## 1) Instalare dependinte (o singura data sau dupa update-uri)

```bash
cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound
npm install

cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound/backend
npm install
```

## 2) Start backend (Terminal 1)

```bash
cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound/backend
npm run dev
```

Backend-ul ruleaza pe portul `3000` (conform `backend/.env`).

## 3) Start Metro + setup IP (Terminal 2)

```bash
cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound
npm run setup
npm start -- --reset-cache
```

`npm run setup` actualizeaza:
- `.env.local`
- `src/config/generatedLocalHost.ts`

cu IP-ul local detectat automat.

## 4) Ruleaza aplicatia

### iOS

```bash
cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound
npm run ios
```

### Android

```bash
cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound
npm run android
```

## Troubleshooting rapid

### Eroare: `EADDRINUSE: 8081`

Portul Metro este ocupat.

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN
kill <PID>
```

Apoi reporneste Metro:

```bash
cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound
npm start -- --reset-cache
```

### Eroare: `Network request failed`

1. Verifica backend:

```bash
curl http://localhost:3000/health
```

2. Verifica LAN IP din `.env.local` (`EXPO_PUBLIC_API_HOST`).
3. Ruleaza din nou setup + restart Metro:

```bash
cd /Users/budarazvancristian/Documents/Licenta/App/LostAndFound
npm run setup
npm start -- --reset-cache
```

4. Reinstaleaza app-ul pe device (`npm run ios` sau `npm run android`).

## Oprire procese (optional)

```bash
pkill -f 'react-native start' || true
pkill -f 'backend/node_modules/.bin/nodemon src/server.ts' || true
pkill -f 'backend/node_modules/.bin/ts-node src/server.ts' || true
```

