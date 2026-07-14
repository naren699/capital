# Capital — Premium Finance Tracker

*Financial clarity, refined.*

A luxury-grade personal finance tracker built with React. Track income and expenses, set category budgets, save toward goals, and understand your money through rich analytics — all stored locally in your browser.

Designed with the **UI/UX Pro Max** skill: navy + gold palette, Space Grotesk / Inter / IBM Plex Mono typography, 8px spacing rhythm, WCAG-conscious contrast, and smooth 200–300ms micro-interactions in both light and dark mode.

## Features

- **Dashboard** — total balance hero card, monthly income/spending, savings rate, 12-month cash-flow chart, category donut, data-driven insights, recent activity
- **Activity** — full transaction CRUD with search, type/category filters, pagination, CSV export, delete confirmation with undo
- **Analytics** — expense breakdown donut, income vs spending area chart, net cash-flow bars, average spend by weekday, 6-month category trends
- **Budgets** — per-category monthly limits with elegant progress bars and approaching/over-budget states
- **Goals** — savings milestones with progress tracking, contributions, and achievement states
- **Dark / light mode** — persisted, flash-free, designed as a pair (not inverted)
- **Demo portfolio** — one click seeds 8 months of realistic data to explore
- **localStorage persistence** — everything survives refresh; no backend, no account

## Tech Stack

- [React 18](https://react.dev) + [Vite 6](https://vitejs.dev)
- [Recharts](https://recharts.org) for data visualization
- [Lucide](https://lucide.dev) icons (SVG, no emoji)
- Hand-crafted CSS design system with semantic tokens (no framework bloat)

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
│   ├── Dashboard.jsx        # hero card, insights, overview charts
│   ├── Transactions.jsx     # list, filters, CSV export, delete/undo
│   ├── TransactionForm.jsx  # add/edit modal with validation
│   ├── Analytics.jsx        # five-chart analytics suite
│   ├── Budgets.jsx          # per-category budget manager
│   ├── Goals.jsx            # savings goals with contributions
│   ├── Layout.jsx           # header, desktop nav, mobile bottom nav
│   └── ui.jsx               # Modal (portal), Toast, ProgressBar, EmptyState
├── context/
│   ├── FinanceContext.jsx   # state, localStorage, derived metrics
│   └── ThemeContext.jsx     # dark/light mode
├── utils/                   # categories, formatters, demo data
└── styles.css               # design-system tokens + components

design-system/capital/       # persisted UI/UX Pro Max design system
```

## Design Decisions

- **Navy (#2D3E50) + gold (#D4AF37)** — trust and sophistication with a touch of exclusivity; muted burgundy/sage for semantic states instead of harsh red/green
- **Tabular monospace numerals** for every amount, so figures never shift layout
- **Warm off-whites and off-blacks** (#FAFAF8 / #0F0F0D) instead of pure white/black
- **Undo over friction** — deletes confirm once, then offer a 4-second undo toast

## Future Improvements

- Recurring transactions with calendar view
- Receipt photo attachments
- Multi-currency support
- PWA offline install
