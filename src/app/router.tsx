import { createBrowserRouter } from 'react-router'
import { lazy, Suspense } from 'react'
import App from '@/App'
import { ProtectedRoute } from '@/shared/lib/auth/ProtectedRoute'

const DashboardPage = lazy(() =>
  import('@/app/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const PatientsPage = lazy(() =>
  import('@/features/patients/PatientsPage').then((m) => ({ default: m.PatientsPage })),
)
const AppointmentsPage = lazy(() =>
  import('@/features/appointments/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })),
)
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<div>Loading...</div>}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: withSuspense(<DashboardPage />) },
          { path: 'patients', element: withSuspense(<PatientsPage />) },
          { path: 'appointments', element: withSuspense(<AppointmentsPage />) },
        ],
      },
    ],
  },
])