import { LayoutDashboard, ArrowLeftRight, ChartPie, Wallet, Target, Moon, Sun, Landmark, LogOut } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'transactions', label: 'Activity', icon: ArrowLeftRight },
  { id: 'analytics', label: 'Analytics', icon: ChartPie },
  { id: 'budgets', label: 'Budgets', icon: Wallet },
  { id: 'goals', label: 'Goals', icon: Target },
]

export function Header({ view, setView }) {
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <span className="brand-mark"><Landmark size={17} /></span>
          Capital<span className="brand-gold">.</span>
        </div>
        <nav className="desktop-nav" aria-label="Primary">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-link ${view === id ? 'active' : ''}`}
              onClick={() => setView(id)}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          {user && <span className="user-email">{user.email}</span>}
          <button className="btn-icon" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          {user && (
            <button className="btn-icon" onClick={handleLogout} aria-label="Sign out">
              <LogOut size={19} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export function BottomNav({ view, setView, user }) {
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`bottom-nav-item ${view === id ? 'active' : ''}`}
          onClick={() => setView(id)}
          aria-current={view === id ? 'page' : undefined}
        >
          <Icon size={21} strokeWidth={view === id ? 2.2 : 1.8} />
          {label}
        </button>
      ))}
      {user && (
        <button
          className="bottom-nav-item"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          <LogOut size={21} strokeWidth={1.8} />
          Sign Out
        </button>
      )}
    </nav>
  )
}
