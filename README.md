# Utano — Healthcare Practice Management System (Frontend)

React + TypeScript single-page application for the Utano healthcare practice management platform.
Covers reception, nursing, clinical, dispensary, billing, inventory, and admin workflows.

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS (utility-first, dark mode via `dark:` variants) |
| Routing | `react-router` v7 (NOT `react-router-dom`) |
| Data fetching | `@tanstack/react-query` v5 |
| HTTP | Native `fetch` via shared `apiFetch` wrapper |
| State | React Query cache only — no Redux or Zustand |

---

## Project Structure

```
src/
  app/
    layout/
      Navbar.tsx          <- Top bar: hamburger (mobile), practice name, user, logout
      Sidebar.tsx         <- Nav drawer (mobile) / sticky sidebar (desktop md+)
    DashboardPage.tsx
    queryClient.ts
    router.tsx            <- All routes, lazy-loaded with Suspense
  features/
    appointments/         <- Scheduling, waiting room, walk-ins
    audit/                <- Audit log viewer (admin)
    auth/                 <- Login page
    billing/              <- Invoices, payments, payment plans
    claims/               <- Medical aid claims
    consultations/        <- Visits, triage, consultation, prescriptions
    dispensary/           <- Dispensary queue for pending prescriptions
    doctors/              <- Staff list
    inventory/            <- Stock management
    medicalAids/          <- Medical aid plans list
    patients/             <- Patient registry and detail
    reports/              <- Revenue and usage reports
    settings/             <- Practice settings, staff, medical aids
    setup/                <- First-time practice setup
  shared/
    lib/
      api/apiFetch.ts     <- Fetch wrapper (adds auth header, base URL)
      auth/               <- AuthContext, ProtectedRoute
```

### Feature Folder Convention

Each feature follows the same three-file pattern:

```
features/example/
  exampleApi.ts        <- Raw API functions (apiFetch calls), TypeScript interfaces
  useExample.ts        <- React Query hooks (useQuery / useMutation wrappers)
  ExamplePage.tsx      <- Page component (layout, UI, event handlers)
```

---

## Route Map

| Route | Component | Notes |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/setup` | `SetupPage` | First-time practice setup |
| `/` | `DashboardPage` | Stats, today's visits, appointment breakdown |
| `/waiting-room` | `WaitingRoomPage` | Live queue of scheduled + in-progress patients |
| `/patients` | `PatientsPage` | Searchable patient list |
| `/patients/new` | `NewPatientPage` | Registration form |
| `/patients/:id` | `PatientDetailPage` | Demographics, contacts, addresses, medical history |
| `/appointments` | `AppointmentsPage` | Daily schedule, reschedule, cancel |
| `/appointments/new` | `NewAppointmentPage` | Book appointment |
| `/appointments/walk-in` | `WalkInPage` | Quick walk-in registration |
| `/consultations` | `ConsultationsPage` | Visits list filtered by date |
| `/consultations/new` | `NewVisitPage` | Open a visit (pre-filled from appointment context) |
| `/consultations/:id` | `VisitDetailPage` | Triage + Consultation + Prescriptions |
| `/billing` | `BillingPage` | Invoice list with filters; new invoice modal |
| `/billing/:id` | `InvoiceDetailPage` | Line items, payments, payment plan |
| `/dispensary` | `DispensaryPage` | Pending prescriptions queue (auto-refreshes 30s) |
| `/inventory` | `InventoryPage` | Stock list, low-stock alerts |
| `/inventory/:id` | `StockItemDetailPage` | Stock detail + transaction history |
| `/claims` | `ClaimsPage` | Medical aid claims |
| `/reports` | `ReportsPage` | Revenue reports |
| `/settings/staff` | (nested) | Doctors / staff management |
| `/settings/medical-aids` | (nested) | Medical aid plan management |
| `/settings/practice` | (nested) | Practice details |
| `/admin/audit-log` | `AuditLogPage` | Immutable clinical audit trail |

### Lazy Loading Pattern

All routes use named exports loaded lazily:

```tsx
const VisitDetailPage = lazy(() =>
  import('@/features/consultations/VisitDetailPage').then((m) => ({ default: m.VisitDetailPage }))
)
```

Default exports (e.g. `InvoiceDetailPage`) are loaded without `.then()`.

---

## Clinical Workflow in the UI

### Visit Detail Page (`/consultations/:id`)

The visit detail page is split into two independent sections reflecting the two-role workflow:

**Triage section (Nurse)**
- Vitals: BP systolic/diastolic, weight, height, temperature, pulse, O₂ saturation
- Chief complaint
- Own "Save Triage" button → `PUT /api/visits/{id}/triage`
- Editable while status is not Completed
- Status badge advances from In Progress (yellow) → Triaged (blue)

**Consultation section (Doctor)**
- Department, symptoms, diagnosis, treatment, general prescription notes
- Own "Save Notes" button → `PUT /api/visits/{id}`
- Editable while status is not Completed

**Prescriptions section**
- List of prescriptions with type (Bill & Dispense / External) and status (Pending / Dispensed)
- Add prescription: search inventory for BillAndDispense, or free-text for External
- Dispense directly from visit detail (BillAndDispense only, while Pending)
- Remove (while Pending)

**Complete Visit button**
- Visible when status is not Completed and no section is in edit mode
- Triggers invoice creation

### Dispensary Page (`/dispensary`)

Accessible to dispensers without entering individual visits. Shows all pending `BillAndDispense` prescriptions across all visits in one table. Auto-refreshes every 30 seconds. One-click Dispense per row.

---

## Key Patterns

### React Query

All server state lives in React Query. No `useState` for fetched data.

- Queries: `useQuery({ queryKey: [...], queryFn: () => apiFetch(...) })`
- Mutations: `useMutation({ mutationFn: ..., onSuccess: () => qc.invalidateQueries(...) })`
- On success, the relevant query key is invalidated to refetch fresh data

Query keys follow the pattern `['resource', params]` e.g. `['visits', { date, page }]` or `['visits', id]`.

### Dark Mode

All components use Tailwind's `dark:` variant. The app respects the system preference via `prefers-color-scheme`. A toggle in the UI stamps `data-theme` on the root element.

No component uses hardcoded light-only colours. Every `bg-white` has a `dark:bg-gray-900` pair, every `text-gray-900` has a `dark:text-gray-100` pair.

### Auth

`AuthContext` holds the decoded JWT payload (user info, practice name, role). `ProtectedRoute` wraps all authenticated routes. The JWT is stored in `localStorage` and attached to every `apiFetch` call via the `Authorization: Bearer` header.

### Form Pattern

Forms use controlled `useState` — no form library. Modals are rendered inline in the page component that owns them, not in a portal, to keep state co-located.

---

## Mobile Responsiveness

The app is fully responsive. The breakpoint strategy uses Tailwind's `sm:` prefix (640px) as the primary desktop threshold.

### Layout

- **Desktop (`md:` and above):** Sidebar is a `sticky` left column (`w-56`), visible at all times
- **Mobile (below `md:`):** Sidebar is hidden; a hamburger button in the Navbar opens a slide-in drawer with a dark backdrop overlay. Navigating to any route closes the drawer automatically (via `useLocation` effect)

### List Pages

List pages render two versions of the data:

| Viewport | Rendering |
|---|---|
| Mobile (`sm:hidden`) | Card list — one card per row, shows the most important fields, tap to navigate |
| Desktop (`hidden sm:block`) | Full table with all columns |

Pages with mobile cards: Patients, Consultations, Appointments, Waiting Room, Billing, Dispensary.

### Tables That Stay as Tables

Some tables (Audit Log, Inventory) remain as tables on mobile but are wrapped in `overflow-x-auto` so they scroll horizontally without breaking the page layout.

### Forms and Modals

Forms use `grid-cols-1 sm:grid-cols-2` so fields stack on mobile. Modals are `max-w-lg w-full mx-4` — full-width with side margins on mobile, constrained on desktop.

---

## RBAC — Permission-Based Access Control

### Design

The UI enforces the same permission model as the backend. The JWT contains a `permissions` claim (list of strings e.g. `["visits.triage", "visits.consult", "patients.read"]`). The frontend reads this list and:

1. Filters sidebar nav items — links the user has no permission to reach are hidden
2. Conditionally renders action buttons — e.g. "Save Triage" only shown if user has `visits.triage`
3. Guards routes — navigating directly to a restricted URL redirects to the dashboard

### Permission Hook

A single hook drives all permission checks:

```ts
// src/shared/lib/auth/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth()
  const permissions = new Set(user?.permissions ?? [])
  return {
    can: (permission: string) => permissions.has(permission),
    canAny: (...perms: string[]) => perms.some((p) => permissions.has(p)),
  }
}
```

Usage anywhere in the UI:

```tsx
const { can } = usePermissions()
{can('visits.triage') && <button onClick={saveTriage}>Save Triage</button>}
```

### Sidebar Filtering

Each nav item declares what permission is required to see it. Items with no `permission` field are visible to all authenticated users.

```ts
const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/patients', label: 'Patients', icon: '👤', permission: 'patients.read' },
  { to: '/dispensary', label: 'Dispensary', icon: '🧪', permission: 'dispensary.view' },
  { to: '/admin/audit-log', label: 'Audit Log', icon: '📜', permission: 'audit.view' },
  { to: '/settings', label: 'Settings', icon: '⚙️', permission: 'settings.manage' },
  // ...
]
```

The sidebar maps over this list and calls `can(item.permission)` to filter.

### Route Guards

`ProtectedRoute` is extended to accept an optional `permission` prop. Navigating to a guarded route without the permission redirects to `/` with a toast message.

### Admin Permissions Page (`/settings/permissions`)

Accessible to Admin only (`settings.manage` permission). Shows all permissions in the system grouped by feature area. For each permission, a row of role toggles (Receptionist, Nurse, Doctor, Dispenser) lets the admin grant or revoke. Changes call `PUT /api/admin/permissions/roles`. An optional per-user override section appears below each permission.

### What Changes Per Visit Workflow

| UI Element | Required Permission |
|---|---|
| "Save Triage" button | `visits.triage` |
| Triage section edit button | `visits.triage` |
| "Save Notes" button (consultation) | `visits.consult` |
| "Add Prescription" button | `visits.prescribe` |
| "Dispense" button on visit detail | `dispensary.dispense` |
| "Complete Visit" button | `visits.complete` |
| "+ Open Visit" on consultations list | `visits.open` |

### Implementation Checklist

- [ ] Add `permissions: string[]` to JWT user type in `AuthContext`
- [ ] `usePermissions()` hook in `shared/lib/auth/`
- [ ] Update `Sidebar.tsx` to filter nav items by permission
- [ ] Update `ProtectedRoute` to accept `permission` prop
- [ ] Update `VisitDetailPage` — gate triage, consultation, prescriptions, complete buttons
- [ ] Update `ConsultationsPage` — gate "Open Visit" button
- [ ] Update `DispensaryPage` — gate "Dispense" button
- [ ] Build `/settings/permissions` admin page
- [ ] Add permissions API calls to `settingsApi.ts`

---

## Outstanding Work

### Must Do

| Item | Detail |
|---|---|
| Permission-based UI | Design finalised — see RBAC section above. Permissions come from JWT claim; `usePermissions()` hook gates nav items, buttons, and routes. Admin manages grants via `/settings/permissions` page. |
| Multi-practice login | After login, if the user has multiple practices, show a practice selection screen. Practice switcher in sidebar for owners |
| Session expiry handling | Currently expired tokens result in 401 errors — should redirect to login automatically |

### Planned Features

| Feature | Detail |
|---|---|
| Push/live notifications | Alert dispenser when new prescription added (instead of polling every 30s). Could use SignalR or server-sent events |
| Patient detail — visit history | Show past visits on the patient detail page |
| Patient detail — invoice history | Show past invoices linked to the patient |
| New patient from visit/appointment | Currently patients must be registered separately before booking; allow inline creation |
| Offline support / PWA | Service worker caching for read-heavy pages (patient list, today's visits) for practices with intermittent connectivity |
| Unit and component tests | No tests written yet; React Testing Library + MSW for API mocking is the intended stack |
| Claims page | UI for submitting and tracking medical aid claims (backend endpoints TBD) |
| Reports page | Revenue charts by doctor/period; patient visit frequency trends |
| Print-friendly invoice | CSS print stylesheet or PDF generation for invoices |
| Appointment reminders UI | Configure SMS/email reminder templates per practice |

---

## Design Decisions — Pending Implementation

### Visit Creation Flow (Option B — enforced)

**Decision:** Visits must always be created from the Waiting Room or Appointments page, never from the patient profile.

**Rationale:** Every visit needs a clear origin — either an appointment (linked via `appointmentId`) or a deliberate walk-in decision. Creating from the patient profile bypassed the appointment link silently, producing visits with no origin context and broken appointment statistics.

**Changes made:**
- Removed `+ Open Visit` from `PatientDetailPage`. Replaced with `View all →` linking to the patient's visit history page.
- `PatientDetailPage` now shows only the last visit (1 record, no pagination) as a quick summary.
- Full visit history lives at `/patients/:id/visits` with doctor filter and full pagination.
- Walk-ins: book a same-day appointment first, patient appears in Waiting Room, open visit from there.

---

### Billing — Discounts and Write-offs (Pending)

**Current state:** Per-line-item `discountPercent` works. No invoice-level discount. No write-off.

**Planned additions:**
- **Invoice-level discount** — percentage or fixed amount off the whole bill (staff, pensioner, hardship). Requires `discountType`, `discountValue`, `discountReason` fields.
- **Discount reason** — mandatory for audit. Shown on invoice and in reports.
- **Write-off** — separate action to clear an uncollectable balance. Irreversible. Requires mandatory reason.

**UI to build:**
- "Apply Discount" button on Draft invoices → modal with type (Percent/Fixed), value, reason
- "Write Off Balance" button on Issued/PartiallyPaid invoices → confirmation modal with mandatory reason field
- Discount line shown on invoice detail and print view

---

### Medical Aid Shortfalls and Reconciliation (Pending)

**Problem:** Medical aids rarely pay the full claimed amount. The shortfall currently sits as an unpaid balance with no owner and no workflow.

**Planned workflow:**
1. Medical aid sends Remittance Advice (RA) — one document covering many claims
2. Staff enters RA in the system → lines matched to invoices automatically by invoice reference
3. Bulk payment posted across all matched invoices in one action
4. For each shortfall, staff chooses: **Bill to patient** / **Write off** / **Dispute**
5. Disputed claims get a follow-up date and resubmission tracking

**UI to build:**
- Remittance Advice entry screen under Claims — date, medical aid, reference, line items
- Auto-match to submitted claims, flag unmatched lines
- Per-line shortfall action (Bill / Write Off / Dispute)
- Recon report: submitted vs approved vs rejected by medical aid and period

---

### Doctor External Hospital Sessions (Pending)

**Problem:** Doctors consult at external hospitals outside the practice. They need to bill those hospitals and track payment separately from patient billing.

**Decision:** Session-based — doctor logs a session at a facility (not per patient). Hospitals pay per session or procedure list.

**UI to build:**
- External Facilities management page under Settings (alongside Medical Aid Schemes)
- "Log Session" page — doctor, facility, date, type, fee, notes
- Facility Invoice page — same layout as patient invoice but addressed to the facility
- Facility claims section in Claims module — submission, approval, payment tracking
