import { NavLink } from 'react-router'
import { useAuth } from '@/shared/lib/auth/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/patients', label: 'Patients', icon: '👤' },
  { to: '/appointments', label: 'Appointments', icon: '📅' },
  { to: '/consultations', label: 'Consultations', icon: '📋' },
  { to: '/billing', label: 'Billing', icon: '💳' },
  { to: '/inventory', label: 'Inventory', icon: '💊' },
  { to: '/claims', label: 'Med Aid Claims', icon: '🏥' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
    isActive
      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`

export function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-screen sticky top-0 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">Utano</span>
        {user && (
          <div className="space-y-1">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Practice</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {user.practiceName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Practice ID</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all leading-snug">
                {user.practiceId}
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-800 px-2 py-3">
        <NavLink to="/settings" className={linkClass}>
          <span className="text-base leading-none">⚙️</span>
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
