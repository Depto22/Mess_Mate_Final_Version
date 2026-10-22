# Firebase Setup Guide

## 1. Firebase Console Setup
1. Go to https://console.firebase.google.com
2. Create new project: "sust-mess-mate"
3. Enable Authentication (Email/Password)
4. Create Firestore Database (Start in test mode)

## 2. Get Firebase Config
1. Project Settings > General
2. Add Web App
3. Copy config values
4. Replace in index.html:
   - YOUR_API_KEY
   - YOUR_PROJECT_ID
   - YOUR_MESSAGING_SENDER_ID
   - YOUR_APP_ID

## 3. Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 4. Firestore Rules (Security)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /items/{item} {
      allow read, write: if request.auth != null;
    }
  }
}
```