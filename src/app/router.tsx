import { createBrowserRouter, Navigate } from 'react-router'
import { lazy, Suspense } from 'react'
import App from '@/App'
import { ProtectedRoute } from '@/shared/lib/auth/ProtectedRoute'
import { SettingsLayout } from '@/features/settings/SettingsLayout'
import { PermissionGuard } from '@/shared/lib/auth/PermissionGuard'

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
const UsersPage = lazy(() =>
  import('@/features/settings/UsersPage').then((m) => ({ default: m.UsersPage })),
)
const RolesPage = lazy(() =>
  import('@/features/settings/RolesPage').then((m) => ({ default: m.RolesPage })),
)
const ServicePricingPage = lazy(() =>
  import('@/features/settings/ServicePricingPage').then((m) => ({ default: m.ServicePricingPage })),
)
const PracticePage = lazy(() =>
  import('@/features/settings/PracticePage').then((m) => ({ default: m.PracticePage })),
)
const BrandingPage = lazy(() =>
  import('@/features/settings/BrandingPage').then((m) => ({ default: m.BrandingPage })),
)
const DoctorsPageSettings = lazy(() =>
  import('@/features/doctors/DoctorsPage').then((m) => ({ default: m.DoctorsPage })),
)
const MedicalAidsPage = lazy(() =>
  import('@/features/medicalAids/MedicalAidsPage').then((m) => ({ default: m.MedicalAidsPage })),
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
const FinancialPage = lazy(() =>
  import('@/features/financial/FinancialPage').then((m) => ({ default: m.FinancialPage })),
)

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<div>Loading...</div>}>{element}</Suspense>
}

function withPermission(permission: string | string[], element: React.ReactNode) {
  return <PermissionGuard permission={permission}>{element}</PermissionGuard>
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
          { path: 'patients', element: withPermission('patients.view', withSuspense(<PatientsPage />)) },
          { path: 'patients/new', element: withPermission('patients.create', withSuspense(<NewPatientPage />)) },
          { path: 'patients/:id', element: withPermission('patients.view', withSuspense(<PatientDetailPage />)) },
          { path: 'patients/:id/visits', element: withPermission('patients.view', withSuspense(<PatientVisitsPage />)) },
          { path: 'waiting-room', element: withPermission('appointments.view', withSuspense(<WaitingRoomPage />)) },
          { path: 'appointments', element: withPermission('appointments.view', withSuspense(<AppointmentsPage />)) },
          { path: 'appointments/new', element: withPermission('appointments.create', withSuspense(<NewAppointmentPage />)) },
          { path: 'appointments/walk-in', element: withPermission('appointments.create', withSuspense(<WalkInPage />)) },
          { path: 'consultations', element: withPermission(['clinical_notes.view', 'triage.create'], withSuspense(<ConsultationsPage />)) },
          { path: 'consultations/new', element: withPermission('clinical_notes.create', withSuspense(<NewVisitPage />)) },
          { path: 'consultations/:id', element: withPermission(['clinical_notes.view', 'triage.create'], withSuspense(<VisitDetailPage />)) },
          { path: 'billing', element: withPermission('billing.view', withSuspense(<BillingPage />)) },
          { path: 'billing/:id', element: withPermission('billing.view', withSuspense(<InvoiceDetailPage />)) },
          { path: 'inventory', element: withPermission('inventory.view', withSuspense(<InventoryPage />)) },
          { path: 'inventory/:id', element: withPermission('inventory.view', withSuspense(<StockItemDetailPage />)) },
          { path: 'dispensary', element: withPermission('dispensary.view', withSuspense(<DispensaryPage />)) },
          { path: 'reports', element: withPermission('reports.view', withSuspense(<ReportsPage />)) },
          { path: 'claims', element: withPermission('claims.view', withSuspense(<ClaimsPage />)) },
          { path: 'admin/audit-log', element: withPermission('settings.users', withSuspense(<AuditLogPage />)) },
          { path: 'financial', element: withPermission('billing.view', withSuspense(<FinancialPage />)) },
          {
            path: 'settings',
            element: <SettingsLayout />,
            children: [
              { index: true, element: <Navigate to="users" replace /> },
              { path: 'users', element: withSuspense(<UsersPage />) },
              { path: 'roles', element: withSuspense(<RolesPage />) },
              { path: 'staff', element: withSuspense(<DoctorsPageSettings />) },
              { path: 'medical-aids', element: withSuspense(<MedicalAidsPage />) },
              { path: 'service-pricing', element: withSuspense(<ServicePricingPage />) },
              { path: 'practice', element: withSuspense(<PracticePage />) },
              { path: 'branding', element: withSuspense(<BrandingPage />) },
            ],
          },
        ],
      },
    ],
  },
])
