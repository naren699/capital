import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import { Header, BottomNav } from './components/Layout'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Analytics from './components/Analytics'
import Budgets from './components/Budgets'
import Goals from './components/Goals'
import Login from './components/Login'
import Register from './components/Register'
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
      <div className="app-shell">
        <Header view={view} setView={setView} user={user} />
        <main className="main-content" key={view}>
          {view === 'dashboard' && <Dashboard setView={setView} />}
          {view === 'transactions' && <Transactions />}
          {view === 'analytics' && <Analytics />}
          {view === 'budgets' && <Budgets />}
          {view === 'goals' && <Goals />}
        </main>
        <BottomNav view={view} setView={setView} user={user} />
        <ToastStack />
      </div>
    </FinanceProvider>
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
