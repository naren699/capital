// Generates 8 months of realistic demo data so charts and insights have depth.
import { todayISO } from './format'

const rand = (min, max) => Math.round((min + Math.random() * (max - min)) * 100) / 100
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const EXPENSE_POOL = [
  { category: 'food', notes: ['Whole Foods', 'Le Bernardin', 'Blue Bottle Coffee', 'Sweetgreen', 'Omakase dinner'], range: [12, 220] },
  { category: 'transport', notes: ['Uber', 'Metro card', 'Fuel', 'Parking'], range: [8, 90] },
  { category: 'entertainment', notes: ['Cinema', 'Spotify', 'Concert tickets', 'Theatre'], range: [10, 180] },
  { category: 'shopping', notes: ['Aesop', 'COS', 'Apple Store', 'Bookstore', 'Mr Porter'], range: [25, 420] },
  { category: 'health', notes: ['Equinox membership', 'Pharmacy', 'Dental'], range: [20, 260] },
  { category: 'housing', notes: ['Rent', 'Home insurance'], range: [1400, 1400] },
  { category: 'utilities', notes: ['Electricity', 'Internet', 'Phone plan'], range: [40, 160] },
  { category: 'travel', notes: ['Flight to Lisbon', 'Hotel weekend', 'Airbnb'], range: [180, 900] },
]

export function generateDemoData() {
  const txs = []
  const now = new Date()
  let id = 1

  for (let m = 7; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const y = d.getFullYear()
    const mo = d.getMonth()
    const daysInMonth = new Date(y, mo + 1, 0).getDate()
    const lastDay = m === 0 ? now.getDate() : daysInMonth
    const iso = (day) => `${y}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Income
    txs.push({ id: `demo-${id++}`, type: 'income', category: 'salary', amount: 6800, date: iso(1), notes: 'Monthly salary' })
    if (Math.random() > 0.4 && lastDay >= 15)
      txs.push({ id: `demo-${id++}`, type: 'income', category: 'freelance', amount: rand(400, 1600), date: iso(15), notes: 'Design consulting' })
    if (Math.random() > 0.6 && lastDay >= 20)
      txs.push({ id: `demo-${id++}`, type: 'income', category: 'investment', amount: rand(120, 550), date: iso(20), notes: 'Dividends' })

    // Rent on the 2nd
    if (lastDay >= 2)
      txs.push({ id: `demo-${id++}`, type: 'expense', category: 'housing', amount: 1400, date: iso(2), notes: 'Rent' })

    // 18–28 varied expenses
    const count = 18 + Math.floor(Math.random() * 10)
    for (let i = 0; i < count; i++) {
      const pool = pick(EXPENSE_POOL.filter((p) => p.category !== 'housing'))
      txs.push({
        id: `demo-${id++}`,
        type: 'expense',
        category: pool.category,
        amount: rand(pool.range[0], pool.range[1]),
        date: iso(1 + Math.floor(Math.random() * lastDay)),
        notes: pick(pool.notes),
      })
    }
  }

  txs.sort((a, b) => b.date.localeCompare(a.date))

  const budgets = {
    food: 900, transport: 300, entertainment: 350,
    shopping: 600, health: 400, travel: 800, utilities: 250,
  }

  const goals = [
    { id: 'goal-1', name: 'Emergency Fund', target: 20000, saved: 13500, deadline: null },
    { id: 'goal-2', name: 'Kyoto in Spring', target: 6000, saved: 2450, deadline: `${now.getFullYear() + 1}-04-01` },
    { id: 'goal-3', name: 'Watch Collection', target: 12000, saved: 4100, deadline: null },
  ]

  return { transactions: txs, budgets, goals, seededOn: todayISO() }
}
