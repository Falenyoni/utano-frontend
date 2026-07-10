import { useNavigate } from 'react-router'
import { useAuth } from '@/shared/lib/auth/AuthContext'
import { useTheme } from '@/shared/lib/theme/ThemeContext'

export function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user?.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {user?.practiceName}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <div className="text-sm text-gray-700 dark:text-gray-300">{user?.fullName}</div>
        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 ml-2"
        >
          Log out
        </button>
      </div>
    </header>
  )
}