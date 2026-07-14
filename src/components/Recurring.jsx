import { useState } from 'react'
import { Plus, Repeat, Trash2, Pencil, Play, Pause } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, categoryById } from '../utils/constants'
import { fmtSigned, fmtDate, todayISO } from '../utils/format'
import { Modal, EmptyState } from './ui'

const FREQUENCIES = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
]

const freqLabel = (id) => FREQUENCIES.find((f) => f.id === id)?.label || 'Monthly'

function RecurringForm({ initial, onClose }) {
  const { addRecurring, updateRecurring } = useFinance()
  const editing = Boolean(initial?.id)

  const [type, setType] = useState(initial?.type || 'expense')
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [category, setCategory] = useState(initial?.category || '')
  const [frequency, setFrequency] = useState(initial?.frequency || 'monthly')
  const [startDate, setStartDate] = useState(initial?.nextDate || initial?.startDate || todayISO())
  const [notes, setNotes] = useState(initial?.notes || '')
  const [errors, setErrors] = useState({})

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const switchType = (t) => { setType(t); setCategory('') }

  const validate = () => {
    const e = {}
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) e.amount = 'Enter an amount greater than zero.'
    else if (amt > 10_000_000) e.amount = 'Amount is too large.'
    if (!category) e.category = 'Choose a category.'
    if (!startDate) e.startDate = 'Pick a start date.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    const rule = { type, amount: Math.round(parseFloat(amount) * 100) / 100, category, frequency, notes: notes.trim() }
    if (editing) updateRecurring(initial.id, rule)
    else addRecurring({ ...rule, startDate })
    onClose()
  }

  return (
    <Modal title={editing ? 'Edit Recurring Rule' : 'New Recurring Rule'} onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div className="segmented" role="tablist" aria-label="Transaction type">
          <button type="button" className={type === 'expense' ? 'active-expense' : ''} onClick={() => switchType('expense')}>Expense</button>
          <button type="button" className={type === 'income' ? 'active-income' : ''} onClick={() => switchType('income')}>Income</button>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="rec-amount">Amount</label>
          <div className="currency-wrap">
            <span className="currency-symbol">$</span>
            <input id="rec-amount" className={`input ${errors.amount ? 'input-error' : ''}`} type="number"
              inputMode="decimal" step="0.01" min="0" placeholder="0.00" value={amount}
              onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="rec-category">Category</label>
          <select id="rec-category" className={`select ${errors.category ? 'input-error' : ''}`} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="" disabled>Select a category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="rec-freq">Frequency</label>
          <select id="rec-freq" className="select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>

        {!editing && (
          <div className="field">
            <label className="field-label" htmlFor="rec-date">Starts on</label>
            <input id="rec-date" className={`input ${errors.startDate ? 'input-error' : ''}`} type="date"
              value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            {errors.startDate && <span className="field-error">{errors.startDate}</span>}
            <span className="field-hint">Past dates will backfill missed occurrences.</span>
          </div>
        )}

        <div className="field">
          <label className="field-label" htmlFor="rec-notes">Notes <span style={{ opacity: 0.6, textTransform: 'none' }}>(optional)</span></label>
          <input id="rec-notes" className="input" type="text" maxLength={80} placeholder="e.g. Netflix subscription"
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Rule'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Recurring() {
  const { recurring, updateRecurring, deleteRecurring } = useFinance()
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const rules = recurring || []

  return (
    <div className="section-gap">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Recurring</h1>
          <p className="page-sub">{rules.length} automation{rules.length === 1 ? '' : 's'} · posts entries for you</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={17} /> Add</button>
      </div>

      <div className="card">
        {rules.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No recurring rules yet"
            sub="Automate rent, salary, or subscriptions — they'll post automatically each period."
            action={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={17} /> Add Rule</button>}
          />
        ) : rules.map((r) => {
          const cat = categoryById(r.category)
          const Icon = cat.icon
          return (
            <div className={`tx-row ${r.active ? '' : 'is-paused'}`} key={r.id}>
              <div className="tx-icon" style={{ background: `color-mix(in srgb, ${cat.color} 14%, transparent)`, color: cat.color }}>
                <Icon size={19} strokeWidth={1.9} />
              </div>
              <div className="tx-info">
                <div className="tx-name">{r.notes || cat.label}</div>
                <div className="tx-sub">
                  {freqLabel(r.frequency)} · {r.active ? `next ${fmtDate(r.nextDate)}` : 'paused'}
                </div>
              </div>
              <span className={`tx-amount ${r.type === 'income' ? 'income' : ''}`}>{fmtSigned(r.amount, r.type)}</span>
              <div className="tx-actions">
                <button className="btn-icon" onClick={() => updateRecurring(r.id, { active: !r.active })}
                  aria-label={r.active ? 'Pause rule' : 'Resume rule'} title={r.active ? 'Pause' : 'Resume'}>
                  {r.active ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button className="btn-icon" onClick={() => setEditing(r)} aria-label="Edit rule"><Pencil size={16} /></button>
                <button className="btn-icon" onClick={() => setConfirmDelete(r)} aria-label="Delete rule"><Trash2 size={16} /></button>
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <RecurringForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}

      {confirmDelete && (
        <Modal
          title="Delete recurring rule?"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { deleteRecurring(confirmDelete.id); setConfirmDelete(null) }}>Delete</button>
            </>
          }
        >
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14.5 }}>
            This stops future auto-posting. Transactions already created will remain.
          </p>
        </Modal>
      )}
    </div>
  )
}
