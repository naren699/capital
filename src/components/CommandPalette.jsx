import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Search, LayoutDashboard, ArrowLeftRight, ChartPie, Wallet, Target,
  Repeat, Plus, Moon, Sun, Sparkles, CornerDownLeft,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useFinance } from '../context/FinanceContext'

// Global command palette. Opens on Cmd/Ctrl+K, closes on Escape.
export default function CommandPalette({ open, setOpen, setView, onAddTransaction }) {
  const { theme, toggle } = useTheme()
  const { loadDemo } = useFinance()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  const commands = useMemo(() => [
    { id: 'go-dashboard', label: 'Go to Home', hint: 'Dashboard', icon: LayoutDashboard, run: () => setView('dashboard') },
    { id: 'go-activity', label: 'Go to Activity', hint: 'Transactions', icon: ArrowLeftRight, run: () => setView('transactions') },
    { id: 'go-analytics', label: 'Go to Analytics', hint: 'Charts', icon: ChartPie, run: () => setView('analytics') },
    { id: 'go-budgets', label: 'Go to Budgets', hint: 'Limits', icon: Wallet, run: () => setView('budgets') },
    { id: 'go-goals', label: 'Go to Goals', hint: 'Savings', icon: Target, run: () => setView('goals') },
    { id: 'go-recurring', label: 'Go to Recurring', hint: 'Automations', icon: Repeat, run: () => setView('recurring') },
    { id: 'add-tx', label: 'Add transaction', hint: 'New entry', icon: Plus, run: () => onAddTransaction() },
    { id: 'toggle-theme', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`, hint: 'Appearance', icon: theme === 'dark' ? Sun : Moon, run: () => toggle() },
    { id: 'load-demo', label: 'Load demo portfolio', hint: 'Sample data', icon: Sparkles, run: () => loadDemo() },
  ], [theme, setView, onAddTransaction, toggle, loadDemo])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => { setActive(0) }, [query, open])

  useEffect(() => {
    if (open) {
      setQuery('')
      // focus after the portal mounts
      const t = setTimeout(() => inputRef.current?.focus(), 20)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!open) return null

  const choose = (cmd) => {
    if (!cmd) return
    setOpen(false)
    cmd.run()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return createPortal(
    <div className="cmdk-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cmdk-search">
          <Search size={18} />
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Type a command or search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Command search"
          />
          <kbd className="cmdk-esc">ESC</kbd>
        </div>
        <div className="cmdk-list">
          {results.length === 0 ? (
            <div className="cmdk-empty">No matching commands</div>
          ) : results.map((cmd, i) => {
            const Icon = cmd.icon
            return (
              <button
                key={cmd.id}
                className={`cmdk-item ${i === active ? 'active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(cmd)}
              >
                <span className="cmdk-item-icon"><Icon size={17} /></span>
                <span className="cmdk-item-label">{cmd.label}</span>
                <span className="cmdk-item-hint">{cmd.hint}</span>
                {i === active && <CornerDownLeft size={14} className="cmdk-item-enter" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
