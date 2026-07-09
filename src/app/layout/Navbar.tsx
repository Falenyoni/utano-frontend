import { useNavigate } from 'react-router'
import { useAuth } from '@/shared/lib/auth/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()
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
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="text-sm font-medium text-gray-500">
        Practice: {user?.practiceId}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-700">{user?.fullName}</div>
        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-900 ml-2"
        >
          Log out
        </button>
      </div>
    </header>
  )
}