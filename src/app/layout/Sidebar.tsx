import {NavLink} from 'react-router'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/patients', label: 'Patients' },
  { to: '/appointments', label: 'Appointments' },
]

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-200">
        <span className="text-xl font-bold text-blue-600">Utano</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )

}