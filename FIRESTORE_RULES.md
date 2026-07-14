# Firestore Security Rules

To secure your Firestore database, go to **Firebase Console** → **Firestore Database** → **Rules** tab and replace the default rules with this:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own financial data
    match /userFinance/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## How it works

- `request.auth.uid == userId` — ensures users can only access documents with their own Firebase UID as the document ID
- All other access is denied by default
- Real-time listeners (`onSnapshot`) work seamlessly with these rules

## Data Structure

Your database will have this structure:

```
firestore
└── userFinance/{userId}
    ├── transactions: [ {...}, {...} ]
    ├── budgets: { category: amount, ... }
    ├── goals: [ {...}, {...} ]
    └── updatedAt: timestamp
```

Each user's `userId` is their Firebase Authentication UID, which is automatically set when they sign up/log in.

## Deploying Rules

1. Go to Firebase Console
2. Click **Firestore Database**
3. Click **Rules** tab
4. Paste the rules above
5. Click **Publish**

Done! Your data is now secure.
