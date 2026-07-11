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
const PatientVisitsPage = lazy(() =>
  import('@/features/patients/PatientVisitsPage').then((m) => ({ default: m.PatientVisitsPage })),
)
const AppointmentsPage = lazy(() =>
  import('@/features/appointments/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })),
)
const NewAppointmentPage = lazy(() =>
  import('@/features/appointments/NewAppointmentPage').then((m) => ({ default: m.NewAppointmentPage })),
)
const WalkInPage = lazy(() =>
  import('@/features/appointments/WalkInPage').then((m) => ({ default: m.WalkInPage })),
)
const WaitingRoomPage = lazy(() =>
  import('@/features/appointments/WaitingRoomPage').then((m) => ({ default: m.WaitingRoomPage })),
)
const ConsultationsPage = lazy(() =>
  import('@/features/consultations/ConsultationsPage').then((m) => ({ default: m.ConsultationsPage })),
)
const NewVisitPage = lazy(() =>
  import('@/features/consultations/NewVisitPage').then((m) => ({ default: m.NewVisitPage })),
)
const VisitDetailPage = lazy(() =>
  import('@/features/consultations/VisitDetailPage').then((m) => ({ default: m.VisitDetailPage })),
)
const BillingPage = lazy(() =>
  import('@/features/billing/BillingPage').then((m) => ({ default: m.BillingPage })),
)
const InvoiceDetailPage = lazy(() =>
  import('@/features/billing/InvoiceDetailPage'),
)
const InventoryPage = lazy(() =>
  import('@/features/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })),
)
const StockItemDetailPage = lazy(() =>
  import('@/features/inventory/StockItemDetailPage'),
)
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
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
const PracticePage = lazy(() =>
  import('@/features/settings/PracticePage').then((m) => ({ default: m.PracticePage })),
)
const ServicePricingPage = lazy(() =>
  import('@/features/settings/ServicePricingPage').then((m) => ({ default: m.ServicePricingPage })),
)
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const DispensaryPage = lazy(() =>
  import('@/features/dispensary/DispensaryPage').then((m) => ({ default: m.DispensaryPage })),
)
const AuditLogPage = lazy(() =>
  import('@/features/audit/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
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
          { path: 'patients/:id/visits', element: withSuspense(<PatientVisitsPage />) },
          { path: 'waiting-room', element: withSuspense(<WaitingRoomPage />) },
          { path: 'appointments', element: withSuspense(<AppointmentsPage />) },
          { path: 'appointments/new', element: withSuspense(<NewAppointmentPage />) },
          { path: 'appointments/walk-in', element: withSuspense(<WalkInPage />) },
          { path: 'consultations', element: withSuspense(<ConsultationsPage />) },
          { path: 'consultations/new', element: withSuspense(<NewVisitPage />) },
          { path: 'consultations/:id', element: withSuspense(<VisitDetailPage />) },
          { path: 'billing', element: withSuspense(<BillingPage />) },
          { path: 'billing/:id', element: withSuspense(<InvoiceDetailPage />) },
          { path: 'inventory', element: withSuspense(<InventoryPage />) },
          { path: 'inventory/:id', element: withSuspense(<StockItemDetailPage />) },
          { path: 'dispensary', element: withSuspense(<DispensaryPage />) },
          { path: 'reports', element: withSuspense(<ReportsPage />) },
          { path: 'claims', element: withSuspense(<ClaimsPage />) },
          { path: 'admin/audit-log', element: withSuspense(<AuditLogPage />) },
          {
            path: 'settings',
            element: withSuspense(<SettingsLayout />),
            children: [
              { index: true, element: <Navigate to="staff" replace /> },
              { path: 'staff', element: withSuspense(<DoctorsPage />) },
              { path: 'medical-aids', element: withSuspense(<MedicalAidsPage />) },
              { path: 'service-pricing', element: withSuspense(<ServicePricingPage />) },
              { path: 'practice', element: withSuspense(<PracticePage />) },
            ],
          },
        ],
      },
    ],
  },
])
