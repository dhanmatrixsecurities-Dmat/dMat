# Stock Market Advisory App - Mobile App

## Overview
This is an Indian stock market advisory mobile application built with Expo and Firebase. The app allows users to view stock trading signals and receive push notifications for new trades.

## User Access Levels
- **FREE**: Can only view closed trades
- **ACTIVE**: Can view live/active trades and receive push notifications
- **BLOCKED**: Cannot access live trades or receive notifications

## Features

### For All Users
- Phone authentication (OTP-based login)
- View closed trades with profit/loss tracking
- Modern trading UI with Navy Blue, White, and Dark Green theme
- Educational disclaimer screen

### For ACTIVE Users
- View live/active trades with entry, target, and stop-loss prices
- Real-time push notifications when new trades are added
- Automatic profit/loss percentage calculations

### Admin Features (Web Panel)
- View all registered users
- Change user status (FREE/ACTIVE/BLOCKED)
- Add, edit, close, or delete trades
- Manual user activation after payment verification

## Setup Instructions

### Prerequisites
1. Node.js (v16 or higher)
2. Yarn package manager
3. Expo CLI
4. Firebase project (see FIREBASE_SETUP_GUIDE.md)

### Firebase Configuration

**IMPORTANT**: Before running the app, you MUST configure Firebase:

1. Follow the complete setup guide in `/app/FIREBASE_SETUP_GUIDE.md`
2. After creating your Firebase project, update the configuration in `/app/frontend/firebaseConfig.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Installation

```bash
cd /app/frontend
yarn install
```

### Running the App

```bash
# Start the development server
yarn start

# For Android
yarn android

# For iOS
yarn ios

# For Web
yarn web
```

## App Structure

```
frontend/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Main tab navigation
│   │   ├── active-trades.tsx
│   │   ├── closed-trades.tsx
│   │   └── profile.tsx
│   ├── auth/              # Authentication screens
│   │   ├── disclaimer.tsx
│   │   └── phone-login.tsx
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── constants/             # App constants
│   └── Colors.ts          # Theme colors
├── firebaseConfig.ts      # Firebase configuration
└── package.json
```

## Firebase Collections

### users
```typescript
{
  phone: string;
  status: 'FREE' | 'ACTIVE' | 'BLOCKED';
  fcmToken: string;
  createdAt: string;
}
```

### activeTrades
```typescript
{
  stockName: string;          // e.g., "RELIANCE"
  type: 'BUY' | 'SELL';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  status: string;             // e.g., "Active"
  createdAt: string;
}
```

### closedTrades
```typescript
{
  stockName: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  profitLossPercent: number;  // Auto-calculated
  closedAt: string;
}
```

## Push Notifications

Push notifications are automatically sent to ACTIVE users when:
- A new trade is added
- A trade is closed

Notifications are handled using Expo's push notification service.

## Testing

For testing phone authentication, you can add test phone numbers in Firebase Console:
- Go to Authentication → Sign-in method → Phone
- Scroll to "Phone numbers for testing"
- Add test numbers with fixed verification codes

Example:
- Phone: +91 9999999999
- Code: 123456

## Color Theme

- Primary: Navy Blue (`#001F3F`)
- Secondary: White (`#FFFFFF`)
- Accent: Dark Green (`#006400`)
- Success: Green (`#00C853`)
- Error: Red (`#D32F2F`)

## Important Notes

1. **Firebase Configuration**: The app will NOT work until you configure Firebase properly
2. **Phone Authentication**: Requires Firebase Phone Authentication to be enabled
3. **Notifications**: Requires FCM (Firebase Cloud Messaging) to be configured
4. **Payment**: Payment is handled externally; admin manually activates users

## Troubleshooting

### App won't start
- Ensure all dependencies are installed: `yarn install`
- Clear Metro bundler cache: `yarn start --clear`

### Phone auth not working
- Check Firebase configuration in `firebaseConfig.ts`
- Ensure Phone Authentication is enabled in Firebase Console
- Verify reCAPTCHA settings

### Notifications not working
- Check FCM configuration
- Ensure notification permissions are granted
- Verify user status is 'ACTIVE'

## Support

For issues or questions, contact the admin or refer to the Firebase setup guide.

## Legal Disclaimer

This app is for educational purposes only and does not provide investment advice. Users are shown a disclaimer screen before accessing the app.
