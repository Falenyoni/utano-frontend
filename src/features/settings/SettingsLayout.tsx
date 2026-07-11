import { NavLink, Outlet } from 'react-router'

const settingsNav = [
  { to: '/settings/staff', label: 'Staff & Doctors' },
  { to: '/settings/medical-aids', label: 'Medical Aid Schemes' },
  { to: '/settings/practice', label: 'Practice' },
]

export function SettingsLayout() {
  return (
    <div className="flex gap-6 min-h-full">
      <nav className="w-48 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 px-2">
          Settings
        </p>
        <ul className="space-y-1">
          {settingsNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
