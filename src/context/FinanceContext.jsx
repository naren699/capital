import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'
import { currentMonthKey, monthKey, todayISO } from '../utils/format'
import { generateDemoData } from '../utils/demo'

const FinanceContext = createContext(null)

const emptyState = { transactions: [], budgets: {}, goals: [] }

function validateTransaction(tx) {
  const amount = Number(tx.amount)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    return 'Amount must be a positive number.'
  }
  if (tx.type !== 'income' && tx.type !== 'expense') {
    return 'Transaction type must be income or expense.'
  }
  if (!tx.category) {
    return 'Category is required.'
  }
  if (!tx.date || Number.isNaN(Date.parse(tx.date))) {
    return 'A valid date is required.'
  }
  if (tx.date > todayISO()) {
    return 'Date cannot be in the future.'
  }
  return null
}

export function FinanceProvider({ children }) {
  const { user } = useAuth()
  const [data, setData] = useState(emptyState)
  const [toasts, setToasts] = useState([])
  const undoRef = useRef(null)
  const syncedRef = useRef(false)

  const pushToast = useCallback((message, { kind = 'success', action = null } = {}) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-2), { id, message, kind, action }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  // ---- Firestore sync: load on login, listen for remote changes ----
  useEffect(() => {
    if (!user) {
      setData(emptyState)
      syncedRef.current = false
      return
    }
    const unsubscribe = onSnapshot(
      doc(db, 'userFinance', user.uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data()
          setData({
            transactions: Array.isArray(d.transactions) ? d.transactions : [],
            budgets: d.budgets && typeof d.budgets === 'object' ? d.budgets : {},
            goals: Array.isArray(d.goals) ? d.goals : [],
          })
        }
        syncedRef.current = true
      },
      (error) => {
        console.error('Firestore read error:', error)
        pushToast('Cloud sync unavailable — check Firestore rules', { kind: 'error' })
      },
    )
    return () => unsubscribe()
  }, [user, pushToast])

  const persist = useCallback((next) => {
    if (!user) return
    setDoc(doc(db, 'userFinance', user.uid), { ...next, updatedAt: serverTimestamp() })
      .catch((error) => {
        console.error('Firestore write error:', error)
        pushToast('Failed to save to cloud', { kind: 'error' })
      })
  }, [user, pushToast])

  const updateData = useCallback((updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      persist(next)
      return next
    })
  }, [persist])

  // ---- Transactions ----
  const addTransaction = useCallback((tx) => {
    const error = validateTransaction(tx)
    if (error) {
      pushToast(error, { kind: 'error' })
      return null
    }
    const record = { ...tx, amount: Number(tx.amount), id: `tx-${Date.now()}-${Math.round(Math.random() * 1e5)}` }
    updateData((d) => ({
      ...d,
      transactions: [record, ...d.transactions].sort((a, b) => b.date.localeCompare(a.date)),
    }))
    pushToast('Transaction added')
    return record
  }, [updateData, pushToast])

  const updateTransaction = useCallback((id, patch) => {
    const error = validateTransaction(patch)
    if (error) {
      pushToast(error, { kind: 'error' })
      return
    }
    updateData((d) => ({
      ...d,
      transactions: d.transactions
        .map((t) => (t.id === id ? { ...t, ...patch, amount: Number(patch.amount) } : t))
        .sort((a, b) => b.date.localeCompare(a.date)),
    }))
    pushToast('Transaction updated')
  }, [updateData, pushToast])

  const deleteTransaction = useCallback((id) => {
    updateData((d) => {
      const victim = d.transactions.find((t) => t.id === id)
      undoRef.current = victim
      return { ...d, transactions: d.transactions.filter((t) => t.id !== id) }
    })
    pushToast('Transaction deleted', {
      kind: 'warning',
      action: {
        label: 'Undo',
        run: () => {
          const victim = undoRef.current
          if (!victim) return
          undoRef.current = null
          updateData((d) => ({
            ...d,
            transactions: [...d.transactions, victim].sort((a, b) => b.date.localeCompare(a.date)),
          }))
        },
      },
    })
  }, [updateData, pushToast])

  // ---- Budgets ----
  const setBudget = useCallback((categoryId, amount) => {
    updateData((d) => {
      const budgets = { ...d.budgets }
      if (amount > 0) budgets[categoryId] = amount
      else delete budgets[categoryId]
      return { ...d, budgets }
    })
  }, [updateData])

  // ---- Goals ----
  const addGoal = useCallback((goal) => {
    updateData((d) => ({ ...d, goals: [...d.goals, { ...goal, id: `goal-${Date.now()}` }] }))
    pushToast('Goal created')
  }, [updateData, pushToast])

  const updateGoal = useCallback((id, patch) => {
    updateData((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))
  }, [updateData])

  const deleteGoal = useCallback((id) => {
    updateData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }))
    pushToast('Goal deleted', { kind: 'warning' })
  }, [updateData, pushToast])

  // ---- Demo & clear ----
  const loadDemo = useCallback(() => {
    updateData(generateDemoData())
    pushToast('Demo portfolio loaded')
  }, [updateData, pushToast])

  const clearAll = useCallback(() => {
    updateData(emptyState)
    pushToast('All data cleared', { kind: 'warning' })
  }, [updateData, pushToast])

  // ---- Derived metrics ----
  const { transactions, budgets, goals } = data

  const balance = useMemo(
    () => transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
    [transactions],
  )

  const sumMonth = useCallback((ym) => {
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (monthKey(t.date) !== ym) continue
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    }
    return { income, expense }
  }, [transactions])

  const thisMonth = useMemo(() => sumMonth(currentMonthKey()), [sumMonth])

  const prevMonth = useMemo(() => {
    const now = new Date()
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return sumMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`)
  }, [sumMonth])

  const monthCategorySpend = useMemo(() => {
    const key = currentMonthKey()
    const map = new Map()
    for (const t of transactions) {
      if (t.type === 'expense' && monthKey(t.date) === key) {
        map.set(t.category, (map.get(t.category) || 0) + t.amount)
      }
    }
    return map
  }, [transactions])

  const trend = useMemo(() => {
    const months = new Map()
    for (const t of transactions) {
      const ym = monthKey(t.date)
      if (!months.has(ym)) months.set(ym, { ym, income: 0, expense: 0 })
      const m = months.get(ym)
      if (t.type === 'income') m.income += t.amount
      else m.expense += t.amount
    }
    return [...months.values()].sort((a, b) => a.ym.localeCompare(b.ym)).slice(-12)
  }, [transactions])

  const projectedExpense = useMemo(() => {
    const today = new Date()
    const day = today.getDate()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    if (day === 0 || thisMonth.expense === 0) return 0
    return (thisMonth.expense / day) * daysInMonth
  }, [thisMonth])

  const savingsRate = useMemo(() => {
    if (thisMonth.income <= 0) return 0
    return Math.round(((thisMonth.income - thisMonth.expense) / thisMonth.income) * 100)
  }, [thisMonth])

  const value = {
    transactions,
    budgets,
    goals,
    toasts,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    pushToast,
    dismissToast,
    loadDemo,
    clearAll,
    balance,
    thisMonth,
    prevMonth,
    monthCategorySpend,
    trend,
    projectedExpense,
    savingsRate,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  return useContext(FinanceContext)
}
