import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'
import { currentMonthKey, monthKey, todayISO } from '../utils/format'
import { generateDemoData } from '../utils/demo'
import { computeHealthScore, computeInsights } from '../utils/insights'

const FinanceContext = createContext(null)

const emptyState = { transactions: [], budgets: {}, goals: [], recurring: [] }

// ---- Recurring helpers ----
function advanceDate(iso, frequency) {
  const d = new Date(iso + 'T00:00:00')
  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7)
  } else if (frequency === 'biweekly') {
    d.setDate(d.getDate() + 14)
  } else if (frequency === 'yearly') {
    d.setFullYear(d.getFullYear() + 1)
  } else {
    // monthly (default): keep the same day-of-month where possible
    const day = d.getDate()
    d.setMonth(d.getMonth() + 1)
    if (d.getDate() < day) d.setDate(0) // clamp to last day of shorter months
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Walks each rule forward from nextDate, emitting a transaction for every
// occurrence that is now due (<= today). Returns updated rules + new txns.
function runRecurring(recurring, today) {
  const generated = []
  let changed = false
  const nextRules = (recurring || []).map((rule) => {
    if (!rule.active || !rule.nextDate) return rule
    let cursor = rule.nextDate
    let guard = 0
    while (cursor <= today && guard < 400) {
      generated.push({
        id: `tx-${Date.now()}-${Math.round(Math.random() * 1e6)}-${guard}`,
        type: rule.type,
        amount: Number(rule.amount),
        category: rule.category,
        date: cursor,
        notes: rule.notes || '',
        recurringId: rule.id,
      })
      cursor = advanceDate(cursor, rule.frequency)
      guard += 1
      changed = true
    }
    return cursor === rule.nextDate ? rule : { ...rule, nextDate: cursor }
  })
  return { changed, generated, nextRules }
}

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
            recurring: Array.isArray(d.recurring) ? d.recurring : [],
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

  // ---- Recurring transactions ----
  const addRecurring = useCallback((rule) => {
    const record = {
      ...rule,
      amount: Number(rule.amount),
      id: `rec-${Date.now()}-${Math.round(Math.random() * 1e5)}`,
      active: true,
      nextDate: rule.startDate || todayISO(),
    }
    updateData((d) => ({ ...d, recurring: [...(d.recurring || []), record] }))
    pushToast('Recurring rule added')
    return record
  }, [updateData, pushToast])

  const updateRecurring = useCallback((id, patch) => {
    updateData((d) => ({
      ...d,
      recurring: (d.recurring || []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }, [updateData])

  const deleteRecurring = useCallback((id) => {
    updateData((d) => ({ ...d, recurring: (d.recurring || []).filter((r) => r.id !== id) }))
    pushToast('Recurring rule removed', { kind: 'warning' })
  }, [updateData, pushToast])

  // Auto-generate due occurrences whenever data syncs. The guard ref ensures we
  // only process once per snapshot, and updateData's re-render finds nothing due.
  const processingRef = useRef(false)
  useEffect(() => {
    if (!syncedRef.current || processingRef.current) return
    const { changed, generated, nextRules } = runRecurring(data.recurring, todayISO())
    if (!changed) return
    processingRef.current = true
    updateData((d) => ({
      ...d,
      recurring: nextRules,
      transactions: [...generated, ...d.transactions].sort((a, b) => b.date.localeCompare(a.date)),
    }))
    pushToast(`${generated.length} recurring transaction${generated.length > 1 ? 's' : ''} posted`)
    setTimeout(() => { processingRef.current = false }, 0)
  }, [data.recurring, updateData, pushToast])

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
  const { transactions, budgets, goals, recurring } = data

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

  const healthScore = useMemo(
    () => computeHealthScore({ transactions, budgets, savingsRate, thisMonth, prevMonth, monthCategorySpend }),
    [transactions, budgets, savingsRate, thisMonth, prevMonth, monthCategorySpend],
  )

  const smartInsights = useMemo(
    () => computeInsights({ transactions, budgets, thisMonth, prevMonth, savingsRate, projectedExpense, monthCategorySpend }),
    [transactions, budgets, thisMonth, prevMonth, savingsRate, projectedExpense, monthCategorySpend],
  )

  const value = {
    transactions,
    budgets,
    goals,
    recurring,
    toasts,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    addRecurring,
    updateRecurring,
    deleteRecurring,
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
    healthScore,
    smartInsights,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  return useContext(FinanceContext)
}
