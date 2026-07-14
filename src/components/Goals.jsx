import { useState } from 'react'
import { Target, Plus, Trash2, TrendingUp, Trophy } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { fmtMoney, todayISO } from '../utils/format'
import { Modal, ProgressBar, EmptyState } from './ui'

function GoalForm({ onClose }) {
  const { addGoal } = useFinance()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [saved, setSaved] = useState('')
  const [deadline, setDeadline] = useState('')
  const [errors, setErrors] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = 'Give your goal a name.'
    const t = parseFloat(target)
    if (!target || isNaN(t) || t <= 0) errs.target = 'Enter a target above zero.'
    const s = saved === '' ? 0 : parseFloat(saved)
    if (isNaN(s) || s < 0) errs.saved = 'Enter zero or more.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    addGoal({ name: name.trim(), target: t, saved: s, deadline: deadline || null })
    onClose()
  }

  return (
    <Modal title="New Goal" onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div className="field">
          <label className="field-label" htmlFor="goal-name">Goal name</label>
          <input id="goal-name" className={`input ${errors.name ? 'input-error' : ''}`} type="text" maxLength={50}
            placeholder="e.g. Kyoto in Spring" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="goal-target">Target amount</label>
          <div className="currency-wrap">
            <span className="currency-symbol">$</span>
            <input id="goal-target" className={`input ${errors.target ? 'input-error' : ''}`} type="number" inputMode="decimal"
              min="0" step="100" placeholder="10,000" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          {errors.target && <span className="field-error">{errors.target}</span>}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="goal-saved">Already saved <span style={{ opacity: 0.6, textTransform: 'none' }}>(optional)</span></label>
          <div className="currency-wrap">
            <span className="currency-symbol">$</span>
            <input id="goal-saved" className={`input ${errors.saved ? 'input-error' : ''}`} type="number" inputMode="decimal"
              min="0" step="100" placeholder="0" value={saved} onChange={(e) => setSaved(e.target.value)} />
          </div>
          {errors.saved && <span className="field-error">{errors.saved}</span>}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="goal-deadline">Target date <span style={{ opacity: 0.6, textTransform: 'none' }}>(optional)</span></label>
          <input id="goal-deadline" className="input" type="date" min={todayISO()} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Create Goal</button>
        </div>
      </form>
    </Modal>
  )
}

function GoalCard({ goal }) {
  const { updateGoal, deleteGoal, pushToast } = useFinance()
  const [contribution, setContribution] = useState('')
  const [confirming, setConfirming] = useState(false)
  const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100))
  const done = goal.saved >= goal.target

  const contribute = () => {
    const amt = parseFloat(contribution)
    if (isNaN(amt) || amt <= 0) return
    const next = Math.round((goal.saved + amt) * 100) / 100
    updateGoal(goal.id, { saved: next })
    setContribution('')
    if (next >= goal.target) pushToast(`Goal reached — ${goal.name}!`)
    else pushToast(`${fmtMoney(amt)} added to ${goal.name}`)
  }

  return (
    <div className="card card-hover">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 16.5 }}>{goal.name}</div>
          {goal.deadline && (
            <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Target: {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
        {done
          ? <span className="goal-badge"><Trophy size={13} /> Achieved</span>
          : <span className="goal-badge">{pct}%</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 10px' }}>
        <span className="stat-value" style={{ fontSize: 22 }}>{fmtMoney(goal.saved)}</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>of {fmtMoney(goal.target)}</span>
      </div>

      <ProgressBar value={goal.saved} max={goal.target} tone={done ? 'gold' : ''} />

      <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
        {!done && (
          <>
            <div className="currency-wrap" style={{ flex: 1 }}>
              <span className="currency-symbol">$</span>
              <input
                className="input"
                type="number"
                min="0"
                step="50"
                placeholder="Add funds"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && contribute()}
                aria-label={`Contribution to ${goal.name}`}
                style={{ minHeight: 42, padding: '9px 12px 9px 30px' }}
              />
            </div>
            <button className="btn btn-secondary" onClick={contribute} disabled={!contribution} style={{ minHeight: 42, padding: '9px 16px' }}>
              <TrendingUp size={15} /> Add
            </button>
          </>
        )}
        <button className="btn-icon" onClick={() => setConfirming(true)} aria-label={`Delete goal ${goal.name}`} style={{ marginLeft: done ? 'auto' : 0 }}>
          <Trash2 size={16} />
        </button>
      </div>

      {confirming && (
        <Modal
          title="Remove goal?"
          onClose={() => setConfirming(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteGoal(goal.id)}>Remove</button>
            </>
          }
        >
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14.5 }}>
            <strong style={{ color: 'var(--color-text)' }}>{goal.name}</strong> and its progress ({fmtMoney(goal.saved)} saved) will be removed.
          </p>
        </Modal>
      )}
    </div>
  )
}

export default function Goals() {
  const { goals } = useFinance()
  const [creating, setCreating] = useState(false)

  return (
    <div className="section-gap">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="page-sub">Milestones worth saving for.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Plus size={17} /> New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="No goals yet"
            sub="An emergency fund, a trip, a timepiece — define what you're saving toward."
            action={
              <button className="btn btn-primary" onClick={() => setCreating(true)}>
                <Plus size={17} /> Create a Goal
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-2">
          {goals.map((g) => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}

      {creating && <GoalForm onClose={() => setCreating(false)} />}
    </div>
  )
}
