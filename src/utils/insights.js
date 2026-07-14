import { categoryById } from './constants'
import { monthKey, currentMonthKey, fmtMoney } from './format'

// ---- Financial Health Score -------------------------------------------------
// Produces a 0–100 score from four weighted pillars, each returning 0..1:
//   Savings (40) · Budget adherence (25) · Spending trend (20) · Consistency (15)
// Each pillar also yields a short label so the UI can explain the grade.

function scoreSavings(savingsRate) {
  // 20%+ saved = perfect. Negative savings (overspending) = 0.
  if (savingsRate >= 20) return 1
  if (savingsRate <= 0) return 0
  return savingsRate / 20
}

function scoreBudgets(budgets, monthCategorySpend) {
  const entries = Object.entries(budgets || {}).filter(([, b]) => b > 0)
  if (!entries.length) return 0.6 // neutral — no budgets set yet
  let withinCount = 0
  for (const [catId, budget] of entries) {
    const spent = monthCategorySpend.get(catId) || 0
    if (spent <= budget) withinCount += 1
  }
  return withinCount / entries.length
}

function scoreTrend(thisMonth, prevMonth) {
  if (prevMonth.expense <= 0) return 0.6 // not enough history
  const change = (thisMonth.expense - prevMonth.expense) / prevMonth.expense
  if (change <= -0.1) return 1 // spending down 10%+
  if (change >= 0.25) return 0 // spending up 25%+
  // Map [-0.1 .. 0.25] linearly onto [1 .. 0]
  return 1 - (change + 0.1) / 0.35
}

function scoreConsistency(transactions) {
  // Rewards recent, regular activity — a tracked budget is a used budget.
  if (!transactions.length) return 0
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())
  const recent = transactions.filter((t) => new Date(t.date + 'T00:00:00') >= cutoff)
  const months = new Set(recent.map((t) => monthKey(t.date)))
  const activityScore = Math.min(1, recent.length / 15) // ~15 tx over the window = full
  const spreadScore = Math.min(1, months.size / 3) // active across 3 months = full
  return activityScore * 0.6 + spreadScore * 0.4
}

const PILLARS = [
  { key: 'savings', label: 'Savings rate', weight: 40 },
  { key: 'budgets', label: 'Budget adherence', weight: 25 },
  { key: 'trend', label: 'Spending trend', weight: 20 },
  { key: 'consistency', label: 'Tracking habit', weight: 15 },
]

export function computeHealthScore({
  transactions,
  budgets,
  savingsRate,
  thisMonth,
  prevMonth,
  monthCategorySpend,
}) {
  const parts = {
    savings: scoreSavings(savingsRate),
    budgets: scoreBudgets(budgets, monthCategorySpend),
    trend: scoreTrend(thisMonth, prevMonth),
    consistency: scoreConsistency(transactions),
  }

  const score = Math.round(
    PILLARS.reduce((sum, p) => sum + parts[p.key] * p.weight, 0),
  )

  const breakdown = PILLARS.map((p) => ({
    label: p.label,
    pct: Math.round(parts[p.key] * 100),
    earned: Math.round(parts[p.key] * p.weight),
    weight: p.weight,
  }))

  let grade, tone, summary
  if (score >= 80) {
    grade = 'Excellent'; tone = 'good'
    summary = 'Your finances are in great shape. Keep it up.'
  } else if (score >= 60) {
    grade = 'Good'; tone = 'good'
    summary = 'Solid habits with a little room to optimize.'
  } else if (score >= 40) {
    grade = 'Fair'; tone = 'warn'
    summary = 'A few areas need attention to build stability.'
  } else {
    grade = 'Needs work'; tone = 'bad'
    summary = 'Focus on saving more and reining in spending.'
  }

  // Surface the weakest pillar as the headline tip.
  const weakest = [...breakdown].sort((a, b) => a.pct - b.pct)[0]

  return { score, grade, tone, summary, breakdown, weakest, hasData: transactions.length > 0 }
}

// ---- Smart insights & alerts ------------------------------------------------
// Returns a prioritized list of { text, kind } where kind ∈ alert|warn|good|info.

export function computeInsights({
  transactions,
  budgets,
  thisMonth,
  prevMonth,
  savingsRate,
  projectedExpense,
  monthCategorySpend,
}) {
  const out = []
  const ym = currentMonthKey()

  // Budget overspend / approaching — highest priority.
  for (const [catId, budget] of Object.entries(budgets || {})) {
    if (budget <= 0) continue
    const spent = monthCategorySpend.get(catId) || 0
    const ratio = spent / budget
    if (ratio >= 1) {
      out.push({ kind: 'alert', text: `${categoryById(catId).label} is over budget — ${fmtMoney(spent)} of ${fmtMoney(budget)}.` })
    } else if (ratio >= 0.8) {
      out.push({ kind: 'warn', text: `${categoryById(catId).label} budget is at ${Math.round(ratio * 100)}% with time left this month.` })
    }
  }

  // Month-over-month spending swing.
  if (prevMonth.expense > 0 && thisMonth.expense > 0) {
    const diff = Math.round(((thisMonth.expense - prevMonth.expense) / prevMonth.expense) * 100)
    if (diff >= 15) out.push({ kind: 'warn', text: `Spending is up ${diff}% versus last month.` })
    else if (diff <= -10) out.push({ kind: 'good', text: `Spending is down ${Math.abs(diff)}% versus last month. Nice.` })
  }

  // Savings rate.
  if (thisMonth.income > 0) {
    if (savingsRate >= 20) out.push({ kind: 'good', text: `You're saving ${savingsRate}% of income this month.` })
    else if (savingsRate < 0) out.push({ kind: 'alert', text: `You're spending more than you earned this month.` })
    else if (savingsRate < 10) out.push({ kind: 'warn', text: `Savings rate is just ${savingsRate}% this month.` })
  }

  // Category spike detection — this month vs. a typical prior month.
  const priorByCat = new Map()
  const priorMonths = new Set()
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    const k = monthKey(t.date)
    if (k === ym) continue
    priorMonths.add(k)
    priorByCat.set(t.category, (priorByCat.get(t.category) || 0) + t.amount)
  }
  const priorCount = priorMonths.size || 1
  for (const [catId, spent] of monthCategorySpend) {
    const avg = (priorByCat.get(catId) || 0) / priorCount
    if (avg > 20 && spent > avg * 1.4) {
      const pct = Math.round((spent / avg - 1) * 100)
      out.push({ kind: 'warn', text: `${categoryById(catId).label} spending is ${pct}% above your usual month.` })
    }
  }

  // Projected month-end pace.
  if (projectedExpense > 0 && thisMonth.expense > 0) {
    out.push({ kind: 'info', text: `At this pace, spending closes near ${fmtMoney(projectedExpense)} this month.` })
  }

  // Largest category context.
  let topCat = null
  for (const [id, amt] of monthCategorySpend) {
    if (!topCat || amt > topCat.amt) topCat = { id, amt }
  }
  if (topCat) {
    out.push({ kind: 'info', text: `${categoryById(topCat.id).label} is your top category at ${fmtMoney(topCat.amt)}.` })
  }

  const priority = { alert: 0, warn: 1, good: 2, info: 3 }
  return out.sort((a, b) => priority[a.kind] - priority[b.kind]).slice(0, 6)
}
