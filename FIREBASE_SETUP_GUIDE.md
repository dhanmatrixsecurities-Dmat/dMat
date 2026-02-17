# Firebase Setup Guide for Stock Market Advisory App

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"** or **"Create a Project"**
3. Enter project name: `stock-advisory-app` (or any name you prefer)
4. Click **Continue**
5. Disable Google Analytics (optional, can enable if needed)
6. Click **Create Project**
7. Wait for project creation, then click **Continue**

## Step 2: Register Your App

### For Android App:
1. In Firebase Console, click the **Android icon** to add an Android app
2. **Android package name**: `com.stockadvisory.app` (you can change this)
3. **App nickname**: Stock Advisory App
4. **Debug signing certificate SHA-1**: Leave empty for now (not required for phone auth in development)
5. Click **Register App**
6. **Download `google-services.json`** - Save this file, we'll need it later
7. Click **Next** → **Next** → **Continue to Console**

### For iOS App (if you plan to support iOS):
1. Click the **iOS icon** to add an iOS app
2. **iOS bundle ID**: `com.stockadvisory.app`
3. **App nickname**: Stock Advisory App
4. Click **Register App**
5. **Download `GoogleService-Info.plist`** - Save this file
6. Click **Next** → **Next** → **Continue to Console**

## Step 3: Get Web Configuration (For Expo)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** `</>` to add a web app
4. **App nickname**: Stock Advisory Web
5. Click **Register App**
6. **Copy the Firebase configuration object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

7. **SAVE THIS CONFIGURATION** - You'll need to provide this to me

## Step 4: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** from the left sidebar
2. Click **Get Started** (if first time)
3. Go to **Sign-in method** tab
4. Click on **Phone** in the providers list
5. Toggle the **Enable** switch
6. Click **Save**

**Important for Phone Auth:**
- For testing, you can add test phone numbers in Authentication → Sign-in method → Phone → Test phone numbers
- Add test numbers like: +91 1234567890 with verification code: 123456

## Step 5: Setup Firestore Database

1. In Firebase Console, go to **Firestore Database** from the left sidebar
2. Click **Create Database**
3. Select **Start in Test Mode** (we'll add security rules later)
4. Choose location: `asia-south1` (Mumbai, India) - closest to your users
5. Click **Enable**

## Step 6: Setup Cloud Messaging (Push Notifications)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to **Cloud Messaging** tab
3. Under **Cloud Messaging API (Legacy)**, if you see "Enable", click it
4. **Copy the Server Key** - Save this for later use

## Step 7: Configure Firestore Security Rules (After Testing)

Once testing is complete, update Firestore rules:

1. Go to **Firestore Database** → **Rules** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only admin can write
    }
    
    // Active trades - only ACTIVE users can read
    match /activeTrades/{tradeId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'ACTIVE';
      allow write: if false; // Only admin can write
    }
    
    // Closed trades - all authenticated users can read
    match /closedTrades/{tradeId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write
    }
  }
}
```

3. Click **Publish**

## Step 8: Provide Configuration to Developer

**Please provide me with:**

1. ✅ Firebase Web Configuration (from Step 3):
```javascript
{
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

2. ✅ Cloud Messaging Server Key (from Step 6)

3. ✅ Android Package Name you used (from Step 2)

## Testing Phone Authentication

For testing purposes, add these test phone numbers:
- Go to Authentication → Sign-in method → Phone
- Scroll down to "Phone numbers for testing"
- Add: **+91 9999999999** with code **123456**
- Add: **+91 8888888888** with code **123456**

---

## Optional: Admin Setup

For the admin panel, you'll need to create an admin user:
1. After I build the app, I'll provide instructions on how to manually add an admin user to Firestore
2. Or we can create a simple script to create the first admin user

---

**Once you complete these steps and provide the configuration, I'll integrate everything into the mobile app!** 🚀
