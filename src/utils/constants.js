import {
  UtensilsCrossed, Car, Film, ShoppingBag, HeartPulse, Home,
  GraduationCap, Plane, Wifi, Sparkles, Briefcase, Laptop,
  TrendingUp, Gift, PiggyBank,
} from 'lucide-react'

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: UtensilsCrossed, color: 'var(--chart-5)' },
  { id: 'transport', label: 'Transport', icon: Car, color: 'var(--chart-6)' },
  { id: 'entertainment', label: 'Entertainment', icon: Film, color: 'var(--chart-4)' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'var(--chart-2)' },
  { id: 'health', label: 'Health', icon: HeartPulse, color: 'var(--chart-7)' },
  { id: 'housing', label: 'Housing', icon: Home, color: 'var(--chart-1)' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'var(--chart-3)' },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'var(--chart-6)' },
  { id: 'utilities', label: 'Utilities', icon: Wifi, color: 'var(--chart-8)' },
  { id: 'other', label: 'Other', icon: Sparkles, color: 'var(--chart-8)' },
]

export const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: Briefcase, color: 'var(--chart-3)' },
  { id: 'freelance', label: 'Freelance', icon: Laptop, color: 'var(--chart-1)' },
  { id: 'investment', label: 'Investments', icon: TrendingUp, color: 'var(--chart-2)' },
  { id: 'gift', label: 'Gifts', icon: Gift, color: 'var(--chart-4)' },
  { id: 'other-income', label: 'Other', icon: PiggyBank, color: 'var(--chart-8)' },
]

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

export const categoryById = (id) =>
  ALL_CATEGORIES.find((c) => c.id === id) || ALL_CATEGORIES[ALL_CATEGORIES.length - 1]
