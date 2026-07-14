import { useState } from 'react'
import { Modal } from './ui'
import { useFinance } from '../context/FinanceContext'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants'
import { todayISO } from '../utils/format'

export default function TransactionForm({ initial, onClose }) {
  const { addTransaction, updateTransaction } = useFinance()
  const editing = Boolean(initial?.id)

  const [type, setType] = useState(initial?.type || 'expense')
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [category, setCategory] = useState(initial?.category || '')
  const [date, setDate] = useState(initial?.date || todayISO())
  const [notes, setNotes] = useState(initial?.notes || '')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const switchType = (t) => {
    setType(t)
    setCategory('')
  }

  const validate = () => {
    const e = {}
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) e.amount = 'Enter an amount greater than zero.'
    else if (amt > 10_000_000) e.amount = 'Amount is too large.'
    if (!category) e.category = 'Choose a category.'
    if (!date) e.date = 'Pick a date.'
    else if (date > todayISO()) e.date = 'Date cannot be in the future.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (ev) => {
    ev.preventDefault()
    if (!validate() || saving) return
    setSaving(true)
    const record = { type, amount: Math.round(parseFloat(amount) * 100) / 100, category, date, notes: notes.trim() }
    if (editing) updateTransaction(initial.id, record)
    else addTransaction(record)
    onClose()
  }

  return (
    <Modal title={editing ? 'Edit Transaction' : 'New Transaction'} onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div className="segmented" role="tablist" aria-label="Transaction type">
          <button type="button" className={type === 'expense' ? 'active-expense' : ''} onClick={() => switchType('expense')}>
            Expense
          </button>
          <button type="button" className={type === 'income' ? 'active-income' : ''} onClick={() => switchType('income')}>
            Income
          </button>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="tx-amount">Amount</label>
          <div className="currency-wrap">
            <span className="currency-symbol">$</span>
            <input
              id="tx-amount"
              className={`input ${errors.amount ? 'input-error' : ''}`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="tx-category">Category</label>
          <select
            id="tx-category"
            className={`select ${errors.category ? 'input-error' : ''}`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="" disabled>Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="tx-date">Date</label>
          <input
            id="tx-date"
            className={`input ${errors.date ? 'input-error' : ''}`}
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="tx-notes">Notes <span style={{ opacity: 0.6, textTransform: 'none' }}>(optional)</span></label>
          <input
            id="tx-notes"
            className="input"
            type="text"
            maxLength={80}
            placeholder="e.g. Dinner at Le Bernardin"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {editing ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
