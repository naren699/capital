# Capital — Premium Finance Tracker

*Financial clarity, refined.*

A luxury-grade personal finance tracker built with React. Track income and expenses, set category budgets, save toward goals, and understand your money through rich analytics — all synced to Firebase for seamless multi-device access.

Designed with a premium aesthetic: navy + gold palette, Space Grotesk / Inter / IBM Plex Mono typography, 8px spacing rhythm, WCAG-conscious contrast, and smooth 200–300ms micro-interactions in both light and dark mode.

## Features

- **Dashboard** — total balance hero card, monthly income/spending, savings rate, 12-month cash-flow chart, category donut, recent activity
- **Financial Health Score** — a 0–100 score with an animated gauge, graded across savings rate, budget adherence, spending trend, and tracking habit, with a personalized tip
- **Smart Insights & Alerts** — auto-detected budget overspend, category spikes, month-over-month swings, and pace projections
- **Recurring transactions** — automate rent, salary, or subscriptions (weekly → yearly); missed occurrences backfill automatically
- **Command Palette (⌘K / Ctrl+K)** — jump to any page, add a transaction, toggle theme, or load demo data from anywhere
- **Activity** — full transaction CRUD with search, type/category filters, pagination, CSV export, delete confirmation with undo
- **Analytics** — expense breakdown donut, income vs spending area chart, net cash-flow bars, average spend by weekday, 6-month category trends
- **Budgets** — per-category monthly limits with elegant progress bars and approaching/over-budget states
- **Goals** — savings milestones with progress tracking, contributions, and achievement states
- **Dark / light mode** — persisted, flash-free, designed as a pair (not inverted)
- **Demo portfolio** — one click seeds 8 months of realistic data to explore
- **Cloud sync** — all data synced to Firebase; access from any device after login

## Tech Stack

- **Frontend:** React 18 + Vite 6
- **Styling:** Tailwind CSS + custom CSS design system
- **Charts:** Recharts for data visualization
- **Icons:** Lucide (SVG)
- **Backend:** Firebase (Authentication + Firestore)
- **Real-time Sync:** Firestore listeners for multi-device updates

## Run Locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx        # Hero card, monthly overview, insights
│   ├── Activity.jsx         # Transaction list with filters & export
│   ├── Analytics.jsx        # 5-chart analytics dashboard
│   ├── Budgets.jsx          # Category budget manager
│   ├── Goals.jsx            # Savings goals tracker
│   ├── Login.jsx            # Email & Google sign-in
│   ├── Register.jsx         # Account registration
│   └── Layout.jsx           # Main navigation & header
├── context/
│   ├── AuthContext.jsx      # Firebase authentication state
│   ├── FinanceContext.jsx   # Firestore sync & data operations
│   └── ToastContext.jsx     # Toast notifications
├── config/
│   └── firebase.js          # Firebase initialization
├── utils/
│   ├── format.js            # Currency, date, time formatters
│   ├── categories.js        # Transaction categories
│   └── demo.js              # Demo data generator
└── styles.css               # Design system & components
```

## Setup

### Prerequisites
- Node.js 16+
- A Firebase project (create one at [firebase.google.com](https://firebase.google.com))

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication (Email/Password + Google Sign-in)
3. Create a Firestore database (Start in production mode)
4. Replace the config in `src/config/firebase.js` with your credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
   }
   ```
5. Publish Firestore security rules:
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

## Design System

- **Navy (#2D3E50) + Gold (#D4AF37)** for premium aesthetic
- **Tailwind CSS** for utility-first styling
- **CSS Variables** for theming (light/dark mode)
- **Tabular monospace numerals** for financial figures
- **Smooth transitions** (200–300ms) for micro-interactions

## Roadmap

- [x] Recurring transactions
- [x] Financial health score
- [x] Command palette
- [ ] Receipt attachments
- [ ] Multi-currency support
- [ ] Transaction tags
- [ ] Mobile app (React Native)
