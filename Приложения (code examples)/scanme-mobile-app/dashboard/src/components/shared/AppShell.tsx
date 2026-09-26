import {
  BarChart3,
  ClipboardList,
  FlaskConical,
  PackageSearch,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import { clearAdminToken } from '../../features/auth/session'

type NavItem = {
  id: string
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { id: '/substances', label: 'Справочник', icon: <FlaskConical size={18} /> },
  { id: '/products', label: 'Товары', icon: <PackageSearch size={18} /> },
  { id: '/moderation', label: 'Модерация', icon: <ShieldCheck size={18} /> },
  { id: '/users', label: 'Пользователи', icon: <Users size={18} /> },
  { id: '/analytics', label: 'Аналитика', icon: <BarChart3 size={18} /> },
  { id: '/audit', label: 'Аудит', icon: <ClipboardList size={18} /> },
]

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()

  function handleLogout() {
    clearAdminToken()
    void navigate({ to: '/login' })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SM</div>
          <div>
            <strong>ScanMe</strong>
            <span>Admin Dashboard</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Основная навигация">
          {navItems.map((item) => (
            <Link
              activeProps={{ className: 'nav-item nav-item-active' }}
              className="nav-item"
              key={item.id}
              to={item.id}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <button className="logout-button" onClick={handleLogout} type="button">
          Выйти
        </button>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  )
}
