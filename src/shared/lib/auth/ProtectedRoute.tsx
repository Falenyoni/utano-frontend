import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthContext'
import { PaywallScreen } from './PaywallScreen'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <PaywallScreen>
      <Outlet />
    </PaywallScreen>
  )
}