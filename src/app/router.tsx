import { createBrowserRouter, Navigate } from 'react-router'
import { lazy, Suspense } from 'react'
import App from '@/App'
import { ProtectedRoute } from '@/shared/lib/auth/ProtectedRoute'

const DashboardPage = lazy(() =>
  import('@/app/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const PatientsPage = lazy(() =>
  import('@/features/patients/PatientsPage').then((m) => ({ default: m.PatientsPage })),
)
const NewPatientPage = lazy(() =>
  import('@/features/patients/NewPatientPage').then((m) => ({ default: m.NewPatientPage })),
)
const PatientDetailPage = lazy(() =>
  import('@/features/patients/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage })),
)
const AppointmentsPage = lazy(() =>
  import('@/features/appointments/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })),
)
const NewAppointmentPage = lazy(() =>
  import('@/features/appointments/NewAppointmentPage').then((m) => ({ default: m.NewAppointmentPage })),
)
const ConsultationsPage = lazy(() =>
  import('@/features/consultations/ConsultationsPage').then((m) => ({ default: m.ConsultationsPage })),
)
const BillingPage = lazy(() =>
  import('@/features/billing/BillingPage').then((m) => ({ default: m.BillingPage })),
)
const InventoryPage = lazy(() =>
  import('@/features/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })),
)
const ClaimsPage = lazy(() =>
  import('@/features/claims/ClaimsPage').then((m) => ({ default: m.ClaimsPage })),
)
const SettingsLayout = lazy(() =>
  import('@/features/settings/SettingsLayout').then((m) => ({ default: m.SettingsLayout })),
)
const DoctorsPage = lazy(() =>
  import('@/features/doctors/DoctorsPage').then((m) => ({ default: m.DoctorsPage })),
)
const MedicalAidsPage = lazy(() =>
  import('@/features/medicalAids/MedicalAidsPage').then((m) => ({ default: m.MedicalAidsPage })),
)
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const SetupPage = lazy(() =>
  import('@/features/setup/SetupPage').then((m) => ({ default: m.SetupPage })),
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
    path: '/setup',
    element: withSuspense(<SetupPage />),
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
          { path: 'patients/new', element: withSuspense(<NewPatientPage />) },
          { path: 'patients/:id', element: withSuspense(<PatientDetailPage />) },
          { path: 'appointments', element: withSuspense(<AppointmentsPage />) },
          { path: 'appointments/new', element: withSuspense(<NewAppointmentPage />) },
          { path: 'consultations', element: withSuspense(<ConsultationsPage />) },
          { path: 'billing', element: withSuspense(<BillingPage />) },
          { path: 'inventory', element: withSuspense(<InventoryPage />) },
          { path: 'claims', element: withSuspense(<ClaimsPage />) },
          {
            path: 'settings',
            element: withSuspense(<SettingsLayout />),
            children: [
              { index: true, element: <Navigate to="staff" replace /> },
              { path: 'staff', element: withSuspense(<DoctorsPage />) },
              { path: 'medical-aids', element: withSuspense(<MedicalAidsPage />) },
            ],
          },
        ],
      },
    ],
  },
])
