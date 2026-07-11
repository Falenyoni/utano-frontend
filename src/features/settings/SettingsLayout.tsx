import { NavLink, Outlet } from 'react-router'

const settingsNav = [
  { to: '/settings/staff', label: 'Staff & Doctors' },
  { to: '/settings/medical-aids', label: 'Medical Aid Schemes' },
  { to: '/settings/practice', label: 'Practice' },
]

export function SettingsLayout() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 min-h-full">
      <nav className="sm:w-48 sm:shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 px-2 hidden sm:block">
          Settings
        </p>
        <ul className="flex sm:block gap-1 overflow-x-auto pb-1 sm:pb-0 sm:space-y-1">
          {settingsNav.map((item) => (
            <li key={item.to} className="shrink-0 sm:shrink">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap sm:w-full block rounded-md px-3 py-2 text-sm font-medium ${
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
