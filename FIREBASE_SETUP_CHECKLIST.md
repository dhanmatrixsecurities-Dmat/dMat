# 🔥 Firebase Setup - Step-by-Step Checklist

## Your Firebase Project: dmat-b0ce6

Follow these steps **in order** and check them off as you complete:

---

## ✅ Step 1: Enable Phone Authentication (5 minutes)

### Direct Link:
👉 https://console.firebase.google.com/project/dmat-b0ce6/authentication/providers

### Instructions:
1. Click the link above
2. If you see "Get Started", click it
3. Click on the **"Sign-in method"** tab at the top
4. Find **"Phone"** in the list of providers
5. Click on "Phone"
6. Toggle the **"Enable"** switch to ON
7. Click **"Save"**

### ✨ Add Test Phone Numbers (for testing without SMS):
1. Scroll down to **"Phone numbers for testing"**
2. Click **"Add phone number"**
3. Add these test numbers:

| Phone Number | Verification Code |
|--------------|------------------|
| +91 9999999999 | 123456 |
| +91 8888888888 | 123456 |

4. Click **"Add"** for each
5. Click **"Save"**

**✓ Mark as complete when done**

---

## ✅ Step 2: Create Firestore Database (3 minutes)

### Direct Link:
👉 https://console.firebase.google.com/project/dmat-b0ce6/firestore

### Instructions:
1. Click the link above
2. Click **"Create database"** button
3. **Select mode**: Choose **"Start in test mode"**
   - ⚠️ Note: This allows read/write access for 30 days - we'll add security rules later
4. **Select location**: Choose **"asia-south1 (Mumbai)"**
   - This is closest to Indian users for better performance
5. Click **"Enable"**
6. Wait for database to be created (takes 30-60 seconds)

**✓ Mark as complete when done**

---

## ✅ Step 3: Enable Cloud Messaging (2 minutes)

### Direct Link:
👉 https://console.firebase.google.com/project/dmat-b0ce6/settings/cloudmessaging

### Instructions:
1. Click the link above
2. If you see **"Cloud Messaging API (Legacy)"**, check if it says "Enabled"
3. If it says "Disabled", click **"Enable"**
4. Note: This might already be enabled automatically

**Optional**: Copy the Server Key (you'll need this for advanced push notifications later)

**✓ Mark as complete when done**

---

## ✅ Step 4: Create Admin User (2 minutes)

### Direct Link:
👉 https://console.firebase.google.com/project/dmat-b0ce6/authentication/users

### Instructions:
1. Click the link above
2. Click **"Add user"** button
3. Enter admin credentials:
   - **Email**: `admin@stockadvisory.com` (or use your own email)
   - **Password**: Create a strong password (save it securely!)
4. Click **"Add user"**
5. **IMPORTANT**: Save your admin email and password somewhere safe!

**Your Admin Credentials:**
```
Email: ___________________________
Password: ___________________________
```

**✓ Mark as complete when done**

---

## ✅ Step 5: Verify Setup (1 minute)

### Check these in Firebase Console:

1. **Authentication**:
   - ✅ Phone provider is enabled
   - ✅ Test phone numbers are added
   - ✅ Admin user is created

2. **Firestore Database**:
   - ✅ Database is created
   - ✅ Mode is "test mode"
   - ✅ Location is "asia-south1"

3. **Cloud Messaging**:
   - ✅ API is enabled

---

## 🎉 Setup Complete!

Once all steps are checked, your Firebase is ready!

### Test Your Setup:

1. **Test Mobile App:**
   ```bash
   cd /app/frontend
   yarn start
   ```
   - Try logging in with test phone: +91 9999999999, code: 123456
   - Should successfully login!

2. **Test Admin Panel:**
   - Open: http://localhost:3003
   - Login with admin email and password
   - Should see the dashboard!

3. **Test Integration:**
   - In admin panel, add a test trade
   - Check if it appears in mobile app (for ACTIVE users)

---

## 🔒 Security Rules (After Testing)

Once you've tested everything, update Firestore security rules:

### Link:
👉 https://console.firebase.google.com/project/dmat-b0ce6/firestore/rules

### Replace with these rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only admin can write via admin panel
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

Click **"Publish"** to save.

---

## ❓ Need Help?

If you encounter any issues:
1. Check the error message in browser console
2. Verify all steps were completed
3. Make sure Firebase config in `/app/frontend/firebaseConfig.ts` is correct
4. Let me know the specific error!

---

**Ready to test? Let me know once you've completed these steps!** 🚀
