# Production Deployment Guide

## Prerequisites
```bash
npm install -g firebase-tools
```

## Step 1: Firebase Console Setup
1. Go to https://console.firebase.google.com/project/messmate-278f6
2. Enable Authentication:
   - Authentication > Sign-in method
   - Enable Email/Password
3. Create Firestore Database:
   - Firestore Database > Create database
   - Start in production mode
   - Deploy rules: `firebase deploy --only firestore:rules`

## Step 2: Deploy to Firebase Hosting
```bash
cd /Users/depto/Downloads/NULL
firebase login
firebase deploy
```

## Step 3: Access Your App
Your app will be live at: https://messmate-278f6.web.app

## Features Ready:
✅ Authentication (Email/Password with OTP)
✅ Mess Management (Create/Join)
✅ Member Management
✅ Task Scheduler
✅ Meal Planning & Budget Calculator
✅ Expense Tracker
✅ Deposit Management
✅ Debt Tracking
✅ Notice Board
✅ Reviews System

## Local Testing:
```bash
python3 -m http.server 8000
# Visit: http://localhost:8000
```

## EmailJS Configuration:
- Service ID: service_64jyzq6
- Template ID: template_clgx4oc
- Public Key: 8dyObXNkH9b_b0pxk
- OTP verification enabled for signup/password reset