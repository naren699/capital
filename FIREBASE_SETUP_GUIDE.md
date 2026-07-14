# Firebase Setup Guide for Capital

## What I've Built

Your app now has:
- ✓ Firebase authentication (Email/Password + Google Sign-in)
- ✓ Login and Register pages with validation
- ✓ User state management (AuthContext)
- ✓ Route protection (unauthenticated users see login)
- ✓ Logout functionality
- ✓ Firestore security rules template

## Testing Locally

### 1. Clear cache and start fresh
```bash
rm -rf node_modules/.vite
npm run dev
```

### 2. Visit `http://localhost:5173`
You should see a **login page** with:
- Email field
- Password field
- "Create account" link

### 3. Create a test account
- Click "Create account"
- Enter email: `test@example.com`
- Password: `Test123!`
- Click "Create Account"

### 4. You should be logged in!
- You'll see the Capital dashboard
- Data persists in browser localStorage
- Click your email in top-right to see logout button

## Next: Add Firestore Cloud Sync

Once localStorage is working, replace `src/context/FinanceContext.jsx` with this code to sync with Firestore:

```javascript
import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'
import { currentMonthKey, monthKey } from '../utils/format'
import { generateDemoData } from '../utils/demo'

const FinanceContext = createContext(null)
const emptyState = { transactions: [], budgets: {}, goals: [] }

export function FinanceProvider({ children }) {
  const { user } = useAuth()
  const [data, setData] = useState(emptyState)
  const [toasts, setToasts] = useState([])
  const [loading, setLoading] = useState(true)
  const undoRef = useRef(null)

  // Sync with Firestore
  useEffect(() => {
    if (!user) {
      setData(emptyState)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = onSnapshot(
      doc(db, 'userFinance', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const { transactions, budgets, goals } = docSnap.data()
          setData({ transactions, budgets, goals })
        }
        setLoading(false)
      },
      (error) => {
        console.error('Firestore error:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Save to Firestore whenever data changes
  const saveToFirestore = useCallback(async (newData) => {
    if (!user) return
    try {
      await setDoc(doc(db, 'userFinance', user.uid), {
        transactions: newData.transactions || [],
        budgets: newData.budgets || {},
        goals: newData.goals || [],
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Write error:', error)
      pushToast('Failed to save', { kind: 'error' })
    }
  }, [user])

  const pushToast = useCallback((message, { kind = 'success', action = null } = {}) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-2), { id, message, kind, action }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const updateData = useCallback((updater) => {
    setData((prev) => {
      const newData = typeof updater === 'function' ? updater(prev) : updater
      saveToFirestore(newData)
      return newData
    })
  }, [saveToFirestore])

  // ... rest of context methods (addTransaction, etc.) use updateData instead of setData

  return (
    <FinanceContext.Provider value={{ data, toasts, loading, /* ...other methods */ }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  return useContext(FinanceContext)
}
```

## Firestore Rules

Go to **Firebase Console** → **Firestore** → **Rules** tab and paste:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userFinance/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

## Data Structure in Firestore

```
firestore
└── userFinance/{userId}
    ├── transactions: [{id, type, amount, category, date, notes}, ...]
    ├── budgets: {category: limit, category: limit, ...}
    ├── goals: [{id, name, target, saved, deadline}, ...]
    └── updatedAt: timestamp
```

## Troubleshooting

### "The above error occurred in FinanceProvider"
- This happened during development due to browser caching
- Solution: `rm -rf node_modules/.vite && npm run dev`

### Can't create account / "Email already in use"
- That's Firebase working! Use a different email
- Or delete the test user from Firebase Console → Authentication

### Data not saving to Firestore
- Check Firestore Rules (must be published)
- Check browser console for errors
- Verify user is logged in

### Authentication not persisting after refresh
- This is normal during development
- For production, add this to `src/main.jsx`:
  ```javascript
  import { setPersistence, browserLocalPersistence } from 'firebase/auth'
  import { auth } from './config/firebase'
  
  setPersistence(auth, browserLocalPersistence)
  ```

## What's Working Now

✓ User registration with email/password  
✓ Login with validation  
✓ Logout functionality  
✓ Route protection (no access without login)  
✓ User email display in header  
✓ localStorage for local testing  

## What Needs Firestore Integration

- [ ] Full cloud sync of transactions, budgets, goals
- [ ] Real-time multi-device sync
- [ ] Cloud backup of all data
- [ ] Delete account (remove user data from Firestore)

## Questions?

If you hit issues:
1. Check browser console (F12 → Console tab)
2. Check Firebase Console for errors
3. Verify Firestore rules are published
4. Try test user: `test@test.com` / `test123`
