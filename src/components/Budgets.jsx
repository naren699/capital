import { useState } from 'react'
import { Wallet, Pencil, Check, X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { EXPENSE_CATEGORIES } from '../utils/constants'
import { fmtMoney } from '../utils/format'
import { ProgressBar, EmptyState } from './ui'

function BudgetRow({ cat, budget, spent }) {
  const { setBudget, pushToast } = useFinance()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(budget ? String(budget) : '')
  const Icon = cat.icon

  const save = () => {
    const amt = parseFloat(value)
    setBudget(cat.id, isNaN(amt) || amt <= 0 ? 0 : Math.round(amt * 100) / 100)
    setEditing(false)
    if (!isNaN(amt) && amt > 0) pushToast(`${cat.label} budget set to ${fmtMoney(amt)}`)
  }

  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0

  return (
    <div className="card card-hover">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: budget || editing ? 14 : 0 }}>
        <div className="tx-icon" style={{ background: `color-mix(in srgb, ${cat.color} 14%, transparent)`, color: cat.color }}>
          <Icon size={19} strokeWidth={1.9} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{cat.label}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {budget > 0 ? `${fmtMoney(spent)} of ${fmtMoney(budget)}` : 'No budget set'}
          </div>
        </div>
        {editing ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div className="currency-wrap" style={{ width: 120 }}>
              <span className="currency-symbol">$</span>
              <input
                className="input"
                type="number"
                min="0"
                step="10"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                autoFocus
                aria-label={`${cat.label} budget amount`}
                style={{ minHeight: 40, padding: '8px 12px 8px 30px' }}
              />
            </div>
            <button className="btn-icon" onClick={save} aria-label="Save budget"><Check size={17} /></button>
            <button className="btn-icon" onClick={() => setEditing(false)} aria-label="Cancel"><X size={17} /></button>
          </div>
        ) : (
          <button className="btn-icon" onClick={() => { setValue(budget ? String(budget) : ''); setEditing(true) }} aria-label={`Edit ${cat.label} budget`}>
            <Pencil size={16} />
          </button>
        )}
      </div>
      {budget > 0 && (
        <>
          <ProgressBar value={spent} max={budget} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12.5, color: 'var(--color-text-muted)' }}>
            <span style={pct >= 100 ? { color: 'var(--color-danger)', fontWeight: 600 } : pct >= 80 ? { color: 'var(--color-warning)', fontWeight: 600 } : undefined}>
              {pct}% used{pct >= 100 ? ' — over budget' : pct >= 80 ? ' — approaching limit' : ''}
            </span>
            <span>{budget - spent >= 0 ? `${fmtMoney(budget - spent)} left` : `${fmtMoney(spent - budget)} over`}</span>
          </div>
        </>
      )}
    </div>
  )
}

export default function Budgets() {
  const { budgets, monthCategorySpend } = useFinance()
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0)
  const totalSpent = EXPENSE_CATEGORIES.reduce(
    (s, c) => s + (budgets[c.id] ? monthCategorySpend.get(c.id) || 0 : 0), 0)

  return (
    <div className="section-gap">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-sub">{monthName} — set a monthly limit per category.</p>
        </div>
      </div>

      {totalBudget > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}><Wallet size={17} /> Overall</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {fmtMoney(totalSpent)} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>of {fmtMoney(totalBudget)}</span>
            </span>
          </div>
          <ProgressBar value={totalSpent} max={totalBudget} tone="gold" />
        </div>
      )}

      {Object.keys(budgets).length === 0 && (
        <div className="card">
          <EmptyState
            icon={Wallet}
            title="No budgets yet"
            sub="Set a limit on any category below — Capital tracks your progress through the month."
          />
        </div>
      )}

      <div className="grid grid-2">
        {EXPENSE_CATEGORIES.map((cat) => (
          <BudgetRow
            key={cat.id}
            cat={cat}
            budget={budgets[cat.id] || 0}
            spent={monthCategorySpend.get(cat.id) || 0}
          />
        ))}
      </div>
    </div>
  )
}
