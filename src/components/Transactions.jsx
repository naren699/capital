import { useMemo, useState } from 'react'
import { Search, Plus, Pencil, Trash2, Download, ReceiptText } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { categoryById, ALL_CATEGORIES } from '../utils/constants'
import { fmtSigned, fmtDate } from '../utils/format'
import { Modal, EmptyState } from './ui'
import TransactionForm from './TransactionForm'

const PAGE = 30

export function TransactionRow({ tx, onEdit, onDelete }) {
  const cat = categoryById(tx.category)
  const Icon = cat.icon
  return (
    <div className="tx-row" onClick={() => onEdit(tx)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onEdit(tx)}>
      <div className="tx-icon" style={{ background: `color-mix(in srgb, ${cat.color} 14%, transparent)`, color: cat.color }}>
        <Icon size={19} strokeWidth={1.9} />
      </div>
      <div className="tx-info">
        <div className="tx-name">{tx.notes || cat.label}</div>
        <div className="tx-sub">{cat.label} · {fmtDate(tx.date)}</div>
      </div>
      <span className={`tx-amount ${tx.type === 'income' ? 'income' : ''}`}>
        {fmtSigned(tx.amount, tx.type)}
      </span>
      {onDelete && (
        <div className="tx-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn-icon" onClick={() => onEdit(tx)} aria-label="Edit transaction"><Pencil size={16} /></button>
          <button className="btn-icon" onClick={() => onDelete(tx)} aria-label="Delete transaction"><Trash2 size={16} /></button>
        </div>
      )}
    </div>
  )
}

export default function Transactions() {
  const { transactions, deleteTransaction, pushToast } = useFinance()
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState(null) // tx object or 'new'
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (catFilter !== 'all' && t.category !== catFilter) return false
      if (q && !(t.notes || '').toLowerCase().includes(q) && !categoryById(t.category).label.toLowerCase().includes(q)) return false
      return true
    })
  }, [transactions, query, catFilter, typeFilter])

  const exportCSV = () => {
    const head = 'date,type,category,amount,notes'
    const rows = filtered.map((t) =>
      [t.date, t.type, categoryById(t.category).label, t.amount.toFixed(2), `"${(t.notes || '').replace(/"/g, '""')}"`].join(',')
    )
    const blob = new Blob([[head, ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `capital-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    pushToast(`Exported ${filtered.length} transactions`)
  }

  return (
    <div className="section-gap">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Activity</h1>
          <p className="page-sub">{transactions.length} transactions on record</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportCSV} disabled={!filtered.length}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={17} /> Add
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar" style={{ marginBottom: 'var(--space-sm)' }}>
          <div className="search-wrap">
            <Search size={16} />
            <input
              className="input"
              type="search"
              placeholder="Search notes or category…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setLimit(PAGE) }}
              aria-label="Search transactions"
            />
          </div>
          <select className="select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setLimit(PAGE) }} aria-label="Filter by type">
            <option value="all">All types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          <select className="select" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setLimit(PAGE) }} aria-label="Filter by category">
            <option value="all">All categories</option>
            {ALL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={transactions.length ? 'No matches' : 'No transactions yet'}
            sub={transactions.length
              ? 'Try adjusting your search or filters.'
              : 'Add your first transaction to begin building your financial picture.'}
            action={!transactions.length && (
              <button className="btn btn-primary" onClick={() => setEditing('new')}>
                <Plus size={17} /> Add Transaction
              </button>
            )}
          />
        ) : (
          <>
            {filtered.slice(0, limit).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onEdit={setEditing} onDelete={setConfirmDelete} />
            ))}
            {filtered.length > limit && (
              <div style={{ textAlign: 'center', paddingTop: 'var(--space-md)' }}>
                <button className="btn btn-secondary" onClick={() => setLimit((l) => l + PAGE)}>
                  Show more ({filtered.length - limit} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editing && (
        <TransactionForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete transaction?"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { deleteTransaction(confirmDelete.id); setConfirmDelete(null) }}>
                Delete
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14.5 }}>
            <strong style={{ color: 'var(--color-text)' }}>{confirmDelete.notes || categoryById(confirmDelete.category).label}</strong>
            {' '}— {fmtSigned(confirmDelete.amount, confirmDelete.type)} on {fmtDate(confirmDelete.date)}.
            You'll have a few seconds to undo.
          </p>
        </Modal>
      )}
    </div>
  )
}
