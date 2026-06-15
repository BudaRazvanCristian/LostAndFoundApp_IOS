# Push Notifications Setup

This project uses Expo Notifications for push delivery.

## What is implemented

- Client registers for Expo push notifications after login/register.
- Client sends the Expo push token to backend (`PUT /api/auth/push-token`).
- Backend stores `expoPushToken` on user.
- Backend sends notifications:
  - when a new lost/found post is created (to other users)
  - when a new chat message is received (to the other conversation participant)

## Required install/build steps

### App

```bash
cd "/Users/budarazvancristian/Documents/Licenta/App/LostAndFound"
npm install
```

### iOS native update

```bash
cd "/Users/budarazvancristian/Documents/Licenta/App/LostAndFound/ios"
pod install
```

### Backend

```bash
cd "/Users/budarazvancristian/Documents/Licenta/App/LostAndFound/backend"
npm install
npm run build
```

## Notes

- Push tokens work on physical devices. Simulators often do not receive remote push notifications.
- The app currently requests permission and syncs token automatically on authenticated sessions.
- Notification handler shows banners/lists while app is foregrounded.

