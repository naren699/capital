import { useEffect, useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import { Header, BottomNav } from './components/Layout'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Analytics from './components/Analytics'
import Budgets from './components/Budgets'
import Goals from './components/Goals'
import Recurring from './components/Recurring'
import Login from './components/Login'
import Register from './components/Register'
import CommandPalette from './components/CommandPalette'
import TransactionForm from './components/TransactionForm'
import { ToastStack } from './components/ui'

function AppContent() {
  const { user, loading } = useAuth()
  const [view, setView] = useState('dashboard')
  const [authView, setAuthView] = useState('login')

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {authView === 'login' ? (
          <Login onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <Register onSwitchToLogin={() => setAuthView('login')} />
        )}
      </>
    )
  }

  return (
    <FinanceProvider>
      <Shell view={view} setView={setView} user={user} />
    </FinanceProvider>
  )
}

function Shell({ view, setView, user }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [quickAdd, setQuickAdd] = useState(false)

  // Global Cmd/Ctrl+K to toggle the command palette.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app-shell">
      <Header view={view} setView={setView} user={user} onOpenPalette={() => setPaletteOpen(true)} />
      <main className="main-content" key={view}>
        {view === 'dashboard' && <Dashboard setView={setView} />}
        {view === 'transactions' && <Transactions />}
        {view === 'analytics' && <Analytics />}
        {view === 'budgets' && <Budgets />}
        {view === 'goals' && <Goals />}
        {view === 'recurring' && <Recurring />}
      </main>
      <BottomNav view={view} setView={setView} user={user} />
      <ToastStack />
      <CommandPalette
        open={paletteOpen}
        setOpen={setPaletteOpen}
        setView={setView}
        onAddTransaction={() => setQuickAdd(true)}
      />
      {quickAdd && <TransactionForm initial={null} onClose={() => setQuickAdd(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
