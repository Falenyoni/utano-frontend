import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router'
import { useAuth } from '@/shared/lib/auth/AuthContext'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/waiting-room', label: 'Waiting Room', icon: '🪑' },
  { to: '/patients', label: 'Patients', icon: '👤' },
  { to: '/appointments', label: 'Appointments', icon: '📅' },
  { to: '/consultations', label: 'Consultations', icon: '📋' },
  { to: '/billing', label: 'Billing', icon: '💳' },
  { to: '/dispensary', label: 'Dispensary', icon: '🧪' },
  { to: '/inventory', label: 'Inventory', icon: '💊' },
  { to: '/claims', label: 'Med Aid Claims', icon: '🏥' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/financial', label: 'Financial', icon: '📈' },
  { to: '/admin/audit-log', label: 'Audit Log', icon: '📜' },
]

// Active link uses var(--color-primary) so it reacts to applyBrandingVars immediately
// without requiring a React re-render cycle.
const activeLinkStyle: React.CSSProperties = { background: 'var(--color-primary)' }

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'text-white'
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`

const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties | undefined =>
  isActive ? activeLinkStyle : undefined

function NavContent({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
  return (
    <>
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col items-center gap-2 py-2">
          {user?.logoBase64 ? (
            <img
              src={user.logoBase64}
              alt="Practice logo"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={activeLinkStyle}
            >
              {user?.practiceName?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate w-full">
            {user?.practiceName ?? 'Utano'}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
            style={linkStyle}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-800 px-2 py-3">
        <NavLink to="/settings" className={linkClass} style={linkStyle}>
          <span className="text-base leading-none">⚙️</span>
          Settings
        </NavLink>
      </div>
    </>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()

  // Apply primary color CSS variable whenever user branding changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--color-primary',
      user?.primaryColor || '#3b82f6',
    )
  }, [user?.primaryColor])

  useEffect(() => {
    onClose()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-screen sticky top-0 flex-col">
        <NavContent user={user} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
          <aside className="relative w-64 flex flex-col bg-white dark:bg-gray-900 h-screen shadow-xl overflow-hidden">
            <NavContent user={user} />
          </aside>
        </div>
      )}
    </>
  )
}
