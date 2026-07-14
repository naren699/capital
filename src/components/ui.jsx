import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, AlertTriangle, Vault } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { fmtMoney } from '../utils/format'

export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ToastStack() {
  const { toasts, dismissToast } = useFinance()
  if (!toasts.length) return null
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === 'success' ? <CheckCircle2 size={18} color="var(--color-success)" /> : <AlertTriangle size={18} color="var(--color-warning)" />}
          <span>{t.message}</span>
          {t.action && (
            <button onClick={() => { t.action.run(); dismissToast(t.id) }}>{t.action.label}</button>
          )}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon = Vault, title, sub, action }) {
  return (
    <div className="empty-state">
      <Icon size={40} strokeWidth={1.5} />
      <h3>{title}</h3>
      <p>{sub}</p>
      {action}
    </div>
  )
}

export function ProgressBar({ value, max, tone }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const cls = tone || (pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '')
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ChartTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="tt-label">{labelFormatter ? labelFormatter(label) : label}</div>
      {payload.map((p) => (
        <div className="tt-row" key={p.dataKey || p.name}>
          <span className="tt-dot" style={{ background: p.color || p.payload?.fill }} />
          <span>{p.name}:&nbsp;<strong>{fmtMoney(p.value)}</strong></span>
        </div>
      ))}
    </div>
  )
}
