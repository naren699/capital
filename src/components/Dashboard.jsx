import { useMemo, useState } from 'react'
import {
  Plus, ArrowUpRight, ArrowDownRight, Sparkles, TrendingUp, TrendingDown,
  Landmark, PieChart as PieIcon, ListPlus, Trash2,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { fmtMoney, fmtMoneyCompact, fmtMonth } from '../utils/format'
import { EXPENSE_CATEGORIES, categoryById } from '../utils/constants'
import { ChartTooltip, EmptyState, Modal } from './ui'
import { TransactionRow } from './Transactions'
import TransactionForm from './TransactionForm'

function useInsights() {
  const { thisMonth, prevMonth, savingsRate, projectedExpense, monthCategorySpend, budgets } = useFinance()
  return useMemo(() => {
    const list = []
    if (prevMonth.expense > 0 && thisMonth.expense > 0) {
      const diff = Math.round(((thisMonth.expense - prevMonth.expense) / prevMonth.expense) * 100)
      if (Math.abs(diff) >= 5) {
        list.push(diff < 0
          ? `Spending is down ${Math.abs(diff)}% versus last month. Keep the momentum.`
          : `Spending is running ${diff}% above last month's pace.`)
      }
    }
    if (savingsRate != null && savingsRate > 0) {
      list.push(`You're saving ${savingsRate}% of this month's income.`)
    }
    if (projectedExpense > 0) {
      list.push(`At the current pace, this month closes at roughly ${fmtMoney(projectedExpense)} in spending.`)
    }
    let topCat = null
    for (const [id, amt] of monthCategorySpend) {
      if (!topCat || amt > topCat.amt) topCat = { id, amt }
    }
    if (topCat) {
      list.push(`${categoryById(topCat.id).label} is your largest category this month at ${fmtMoney(topCat.amt)}.`)
    }
    for (const [catId, budget] of Object.entries(budgets)) {
      const spent = monthCategorySpend.get(catId) || 0
      if (budget > 0 && spent / budget >= 0.8 && spent / budget < 1) {
        list.push(`${categoryById(catId).label} budget is at ${Math.round((spent / budget) * 100)}% — worth a glance.`)
        break
      }
    }
    return list.slice(0, 4)
  }, [thisMonth, prevMonth, savingsRate, projectedExpense, monthCategorySpend, budgets])
}

export default function Dashboard({ setView }) {
  const {
    transactions, balance, thisMonth, prevMonth, trend, monthCategorySpend,
    savingsRate, loadDemo, clearAll,
  } = useFinance()
  const [adding, setAdding] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const insights = useInsights()

  const donutData = useMemo(() =>
    EXPENSE_CATEGORIES
      .map((c) => ({ name: c.label, value: Math.round((monthCategorySpend.get(c.id) || 0) * 100) / 100, color: c.color }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value),
    [monthCategorySpend])

  const trendData = useMemo(() => trend.map((t) => ({ ...t, label: fmtMonth(t.ym) })), [trend])
  const hasData = transactions.length > 0

  const expenseDelta = prevMonth.expense > 0
    ? Math.round(((thisMonth.expense - prevMonth.expense) / prevMonth.expense) * 100)
    : null

  if (!hasData) {
    return (
      <div className="card">
        <EmptyState
          icon={Landmark}
          title="Welcome to Capital"
          sub="Financial clarity, refined. Add your first transaction — or explore with a demo portfolio."
          action={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setAdding(true)}>
                <Plus size={17} /> Add Transaction
              </button>
              <button className="btn btn-secondary" onClick={loadDemo}>
                <Sparkles size={16} /> Load Demo Data
              </button>
            </div>
          }
        />
        {adding && <TransactionForm onClose={() => setAdding(false)} />}
      </div>
    )
  }

  return (
    <div className="section-gap">
      {/* Hero */}
      <section className="hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
          <div>
            <div className="hero-label">Total Balance</div>
            <div className="hero-amount">{fmtMoney(balance)}</div>
          </div>
          <button
            className="btn"
            style={{ background: '#D4AF37', color: '#1A1A1A', flexShrink: 0 }}
            onClick={() => setAdding(true)}
          >
            <Plus size={17} /> Add
          </button>
        </div>
        <div className="hero-meta">
          <div className="hero-stat">
            <div className="hero-stat-label">Income · this month</div>
            <div className="hero-stat-value" style={{ color: '#A9C9AD' }}>
              <ArrowUpRight size={15} style={{ verticalAlign: -2 }} /> {fmtMoney(thisMonth.income)}
            </div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Spending · this month</div>
            <div className="hero-stat-value" style={{ color: '#E0B4B4' }}>
              <ArrowDownRight size={15} style={{ verticalAlign: -2 }} /> {fmtMoney(thisMonth.expense)}
            </div>
          </div>
          {savingsRate != null && (
            <div className="hero-stat">
              <div className="hero-stat-label">Savings rate</div>
              <div className="hero-stat-value" style={{ color: '#D4AF37' }}>{savingsRate}%</div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-2">
        {/* Trend */}
        <div className="card card-hover">
          <h2 className="card-title"><TrendingUp size={17} /> Cash Flow · 12 months</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-7)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-7)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={fmtMoneyCompact} width={58} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="income" name="Income" stroke="var(--chart-3)" strokeWidth={2} fill="url(#gIncome)" />
              <Area type="monotone" dataKey="expense" name="Spending" stroke="var(--chart-7)" strokeWidth={2} fill="url(#gExpense)" />
            </AreaChart>
          </ResponsiveContainer>
          {expenseDelta != null && (
            <div className={`delta ${expenseDelta <= 0 ? 'up' : 'down'}`} style={{ marginTop: 8 }}>
              {expenseDelta <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {Math.abs(expenseDelta)}% {expenseDelta <= 0 ? 'less' : 'more'} spending than last month
            </div>
          )}
        </div>

        {/* Category donut */}
        <div className="card card-hover">
          <h2 className="card-title"><PieIcon size={17} /> This Month by Category</h2>
          {donutData.length === 0 ? (
            <EmptyState icon={PieIcon} title="Nothing spent yet" sub="Expenses this month will appear here by category." />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <ResponsiveContainer width={170} height={170}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                    {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {donutData.slice(0, 5).map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--color-text-muted)' }}>{d.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{fmtMoney(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        {/* Insights */}
        <div className="card card-hover">
          <h2 className="card-title"><Sparkles size={17} /> Insights</h2>
          {insights.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Add more activity and insights will surface here.</p>
          ) : (
            insights.map((text, i) => (
              <div className="insight-row" key={i}>
                <Sparkles size={15} />
                <span>{text}</span>
              </div>
            ))
          )}
        </div>

        {/* Recent activity */}
        <div className="card card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}><ListPlus size={17} /> Recent Activity</h2>
            <button className="btn btn-ghost" style={{ fontSize: 13.5 }} onClick={() => setView('transactions')}>
              View all
            </button>
          </div>
          {transactions.slice(0, 5).map((tx) => (
            <TransactionRow key={tx.id} tx={tx} onEdit={() => setView('transactions')} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn btn-ghost" style={{ color: 'var(--color-danger)', fontSize: 13 }} onClick={() => setConfirmClear(true)}>
          <Trash2 size={14} /> Clear all data
        </button>
      </div>

      {adding && <TransactionForm onClose={() => setAdding(false)} />}

      {confirmClear && (
        <Modal
          title="Clear all data?"
          onClose={() => setConfirmClear(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirmClear(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { clearAll(); setConfirmClear(false) }}>Clear everything</button>
            </>
          }
        >
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14.5 }}>
            This removes all {transactions.length} transactions, budgets, and goals from this browser. This cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}
