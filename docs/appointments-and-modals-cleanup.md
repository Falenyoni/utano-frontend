# Appointments UX Fixes + Page-to-Modal Conversion — Plan

Requested 2026-07-30. Not yet built — this is the plan, with current-state references, the
technical approach for each item, and gaps found while researching it. Nothing here has
shipped yet.

---

## 1. Appointments list — "Open" for in-progress, hide edit actions

**Current state:** `AppointmentsPage.tsx` (both the mobile card list and the desktop table,
duplicated markup at lines ~226–247 and ~293–320) renders, for any status in
`ACTIVE_STATUSES = ['Scheduled', 'Confirmed', 'CheckedIn', 'InProgress']`:
- Check In (Scheduled/Confirmed only)
- **"Open Visit" shown when `appt.status !== 'InProgress'`** — i.e. shown for Scheduled/Confirmed/CheckedIn, hidden exactly for InProgress. This looks backwards from what's needed, and arguably was already slightly off before this request — it lets someone "open a visit" for an appointment that hasn't even been checked in yet.
- Reschedule / Reassign / Cancel — shown unconditionally for **all** active statuses, including InProgress.

**Requested change:** for `InProgress` specifically — replace Reschedule/Reassign/Cancel with a single **"Open"** button that goes straight to the existing Visit. Reschedule/Reassign/Cancel disappear once an appointment is InProgress (mid-visit, none of those make sense anymore).

**Blocker found:** `AppointmentSummary` (`appointmentsApi.ts` lines 3–16) has no `visitId` field — only `patientId`/`doctorId`/etc. Today's "Open Visit" button doesn't actually open an existing visit at all — it navigates to `/consultations/new` (`NewVisitPage`, creates a **new** visit) and passes `appointmentId` as prefill state. That's fine for CheckedIn (no visit exists yet), but wrong for InProgress (a visit already exists — `Visit.AppointmentId` is stored on the `Visit` entity per `Utano.Module.ClinicalNotes/Domain/Entities/Visit.cs`, so the backend *has* the link, it's just not exposed to this list).

**Backend prerequisite:** need a way to resolve appointment → visit. Simplest: add `visitId: string | null` to `AppointmentSummaryResponse`/`GetAppointmentsHandler`, populated via a lookup against `ClinicalNotes`' `Visits` table by `AppointmentId` — same cross-module-abstraction pattern already used for `IAppointmentLinker` (Core interface, ClinicalNotes implements the write side; this would be the read side, e.g. `IVisitLookup.GetVisitIdForAppointmentAsync(appointmentId)`, interface in Core, implemented in ClinicalNotes, consumed by Appointments' query handler).

**Frontend change (once backend has `visitId`):** in both list renders, when `appt.status === 'InProgress'`, render a single "Open" button → `navigate(`/consultations/${appt.visitId}`)` (the existing `VisitDetailPage` route) instead of the Check In/Reschedule/Reassign/Cancel block.

---

## 2. Grid view — click an in-progress block, go straight to the Visit

**Current state:** `AppointmentsPage.tsx` wires `DayGridView`'s `onAction` as:
```tsx
onAction={(appt) => {
  if (ACTIVE_STATUSES.includes(appt.status)) openReschedule(appt)
}}
```
Every appointment block click, regardless of status, opens the Reschedule modal — including InProgress ones. There's no status-specific branching in `DayGridView.tsx` itself; it just calls `onAction?.(appt)` on click (line 243) and lets the parent decide.

**Requested change:** clicking an InProgress block should navigate straight to its Visit instead of opening Reschedule.

**Fix (needs the same `visitId` prerequisite as #1):**
```tsx
onAction={(appt) => {
  if (appt.status === 'InProgress' && appt.visitId) navigate(`/consultations/${appt.visitId}`)
  else if (ACTIVE_STATUSES.includes(appt.status)) openReschedule(appt)
}}
```

---

## 3. Waiting Room — same fix, plus it's currently worse than the list

**Current state:** `WaitingRoomPage.tsx` (lines 105–110, 174–181) already has an InProgress case, but it navigates to `/consultations` — the **generic consultations list**, not the specific visit (labeled "View Visit", which is misleading since it doesn't open a visit, it opens a list you'd then have to search). This is the same underlying gap as #1/#2, just already partially attempted here.

**Fix:** once `visitId` is on the appointment summary, change this to `navigate(`/consultations/${appt.visitId}`)`, consistent with #1/#2. CheckedIn's "Open Visit" (→ `/consultations/new`) is already correct as-is — that one really does need to create a new visit.

---

## 4. Convert pages to modals — Patient View, Register Patient, Walk-in, New Appointment

**Existing convention to follow:** this codebase already has an established, consistent modal pattern — plain `useState`-driven overlays, not router-driven modal routes. Examples already in the code: `ChangePasswordModal`/`NotificationPreferencesModal` (`Navbar.tsx`), `ImportAppointmentsModal`, the Reschedule/Reassign/Cancel modals inline in `AppointmentsPage.tsx`, and — notably — `PatientDetailPage.tsx` **already does this internally** for editing a contact or address (`EditContactModal`, `AddContactModal`, `EditAddressModal`, `AddAddressModal`, all built on a shared local `ModalBackdrop` helper). The plan below extends that same pattern outward, rather than introducing a second modal paradigm (e.g. React Router's parallel/modal-route pattern) that would sit inconsistently next to what's already there.

| Page today | Route | Becomes |
|---|---|---|
| `NewPatientPage.tsx` | `/patients/new` | `NewPatientModal`, opened from `PatientsPage` |
| `PatientDetailPage.tsx` | `/patients/:id` | `PatientDetailModal`, opened from `PatientsPage` (list stays visible/mounted behind it) |
| `WalkInPage.tsx` | `/appointments/walk-in` | `WalkInModal`, opened from `AppointmentsPage` and `WaitingRoomPage` (both currently link to the route) |
| `NewAppointmentPage.tsx` | `/appointments/new` | `NewAppointmentModal`, opened from `AppointmentsPage` |

**Per-page complications to solve, not just "wrap in a modal":**

- **`NewAppointmentPage`'s grid-slot prefill.** `DayGridView`'s `onSlotClick` currently does `navigate('/appointments/new', { state: { doctorId, doctorName, date, startTime, endTime } })` — router `location.state`. As a modal, this needs to become a normal prop (`AppointmentsPage` holds `const [prefill, setPrefill] = useState(...)`, `onSlotClick` sets it and opens the modal, modal receives `prefill` as a prop) instead of reading `useLocation().state`.
- **`PatientDetailPage`'s child navigation.** It currently navigates *away* to `/patients/:id/visits` (View all) and `/consultations/:id` (clicking last visit) — those are real page transitions, not sub-modals. As a modal, clicking either of those should probably just close the patient modal and navigate normally (that already works, since `navigate()` still functions fine regardless of what's currently rendered) — no special handling needed, just confirm it in testing.
- **`WalkInPage`'s inline quick-register.** Already its own smaller in-place form (not the full `NewPatientPage`) — this is a deliberate, existing divergence (walk-ins need speed, not the full intake form), not something to unify with `NewPatientModal`. Leave as-is inside `WalkInModal`.
- **Should `PatientsPage` keep `/patients/:id` as a real route too**, for direct links (e.g. from search results elsewhere, or a bookmark)? Recommend yes — keep the route, but have it *open the same modal component* on mount rather than rendering a full page (i.e. `PatientDetailModal` becomes the content, and there's a thin route wrapper that opens it pre-populated with the `:id` param, closing = navigate back to `/patients`). This avoids losing deep-linkability while still getting the "feels like a popup" UX for the common in-list-click case.

---

## 5. Cleanup opportunities found while reading this code

- **Modal boilerplate is duplicated per-file.** `ModalBackdrop`, `inputClass`, `labelClass` are redefined locally in `PatientDetailPage.tsx`, and slightly different versions of `inputClass`/`labelClass` exist again in `WalkInPage.tsx`, `NewAppointmentPage.tsx`, `NewPatientPage.tsx`, `Navbar.tsx`'s modals, and the inline modals in `AppointmentsPage.tsx`. Worth extracting one shared `<Modal>` component + shared form-input classnames to `shared/components/` while doing this conversion anyway — touching all these files is the natural moment to de-duplicate rather than copy the pattern a 7th time.
- **The existing "Open Visit" condition is likely already a minor bug**, independent of this request: it shows for Scheduled/Confirmed (not checked in yet) as well as CheckedIn. Worth deciding whether it should be tightened to CheckedIn-only while this area is being touched, or left alone as out-of-scope.
- **No frontend equivalent of the backend's dead-code findings** was spotted in this pass — the duplication above is the main thing worth flagging.

---

## Bigger gaps surfaced (not part of this request, noted for the backlog)

- **`visitId` missing from the Appointments API surface** — the actual blocker for #1/#2/#3, needs a small backend change (Core abstraction + ClinicalNotes implementation, same shape as `IAppointmentLinker`) before any of the frontend changes here can be done for real.
- Everything already on the deferred list from earlier this session: broader audit trail (Billing/Inventory/Patients/Identity), backend permission/tier enforcement (frontend-only today), RBAC seeding reconciliation.

---

## Proposed order

1. Backend: expose `visitId` on appointment summaries (unblocks 1–3).
2. Frontend: Appointments list + Waiting Room + Grid view InProgress→Visit fixes (1–3), small and independent of the modal work.
3. Extract shared `<Modal>`/form-input primitives (part of 5).
4. Convert the 4 pages to modals (4), using the shared primitives from step 3.
