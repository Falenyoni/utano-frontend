import { useState } from 'react'
import { type AppointmentSummary } from './appointmentsApi'

const STATUS_COLORS: Record<string, string> = {
  Scheduled:  'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200',
  Confirmed:  'bg-green-100 border-green-400 text-green-800 dark:bg-green-900 dark:border-green-600 dark:text-green-200',
  CheckedIn:  'bg-teal-100 border-teal-400 text-teal-800 dark:bg-teal-900 dark:border-teal-600 dark:text-teal-200',
  InProgress: 'bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200',
  Completed:  'bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400',
  Cancelled:  'bg-red-50 border-red-300 text-red-400 dark:bg-red-950 dark:border-red-700 dark:text-red-500',
  NoShow:     'bg-orange-50 border-orange-300 text-orange-500 dark:bg-orange-950 dark:border-orange-700 dark:text-orange-400',
}

const GRID_START_H = 7    // 07:00
const GRID_END_H   = 19   // 19:00
const SLOT_PX      = 48   // px per 30-min slot
const TIME_COL_W   = 64   // px for the time label column
const DOC_COL_MIN  = 160  // min px per doctor column

const TOTAL_SLOTS  = (GRID_END_H - GRID_START_H) * 2          // 24 slots
const TOTAL_H      = TOTAL_SLOTS * SLOT_PX                     // 1152 px

function toMinutes(t: string): number {
  // Accepts "HH:MM", "HH:MM:SS", "HH:MM:SS.fff"
  const parts = t.split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

// Strip "Dr. / Dr / Prof. / Nurse " prefixes so CSV names like "Dr. Tendai Moyo"
// match system names like "Tendai Moyo"
function normalizeDocName(name: string): string {
  return name.toLowerCase().replace(/^(dr\.?|prof\.?|nurse)\s+/, '').trim()
}

function snapTime(y: number): { startTime: string; endTime: string; snappedY: number } {
  const rawMins = (y / SLOT_PX) * 30
  const snapped15 = Math.floor(rawMins / 15) * 15
  const startTotal = GRID_START_H * 60 + snapped15
  const endTotal = startTotal + 30
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  return {
    startTime: fmt(startTotal),
    endTime: fmt(endTotal),
    snappedY: (snapped15 / 30) * SLOT_PX,
  }
}

function topPx(mins: number): number {
  return ((mins - GRID_START_H * 60) / 30) * SLOT_PX
}

function heightPx(durationMins: number): number {
  return Math.max((durationMins / 30) * SLOT_PX, SLOT_PX * 0.75)
}

function isOverdue(appt: AppointmentSummary, today: string, nowHHMM: string): boolean {
  return (
    appt.appointmentDate === today &&
    toMinutes(appt.endTime) <= toMinutes(nowHHMM) &&
    ['Scheduled', 'Confirmed', 'CheckedIn'].includes(appt.status)
  )
}

// Build the hour/half-hour labels for the left column
const TIME_LABELS: { label: string; slot: number }[] = []
for (let h = GRID_START_H; h <= GRID_END_H; h++) {
  TIME_LABELS.push({ label: `${String(h).padStart(2, '0')}:00`, slot: (h - GRID_START_H) * 2 })
  if (h < GRID_END_H) {
    TIME_LABELS.push({ label: '', slot: (h - GRID_START_H) * 2 + 1 })
  }
}

interface Props {
  appointments: AppointmentSummary[]
  doctors: { id: string; name: string }[]
  today: string
  nowTime: string
  date: string
  onAction?: (appt: AppointmentSummary) => void
  onSlotClick?: (doctorId: string, doctorName: string, date: string, startTime: string, endTime: string) => void
}

export function DayGridView({ appointments, doctors, today, nowTime, date, onAction, onSlotClick }: Props) {
  const [hoverInfo, setHoverInfo] = useState<{ docId: string; snappedY: number; startTime: string; endTime: string } | null>(null)

  if (doctors.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No doctors found.</p>
    )
  }

  // For bulk-imported appointments (fake doctorId not in real list), remap by name.
  // Normalize names to strip titles ("Dr.", "Prof.", "Nurse") so "Dr. Tendai Moyo"
  // matches the system user "Tendai Moyo".
  const realIds  = new Set(doctors.map((d) => d.id))
  const nameToId = new Map(doctors.map((d) => [normalizeDocName(d.name), d.id]))

  const resolvedAppts = appointments.map((appt) => {
    if (realIds.has(appt.doctorId)) return appt
    const matchedId = nameToId.get(normalizeDocName(appt.doctorName ?? ''))
    return matchedId ? { ...appt, doctorId: matchedId } : appt
  })

  // Appointments that still don't match any real doctor after name remapping
  const unassigned = resolvedAppts.filter((a) => !realIds.has(a.doctorId))
  const allDoctors = unassigned.length > 0
    ? [...doctors, { id: '__unassigned__', name: 'Unassigned' }]
    : doctors

  const nowMins = toMinutes(nowTime)
  const nowTop  = topPx(nowMins)
  const showNow = nowMins >= GRID_START_H * 60 && nowMins <= GRID_END_H * 60

  const minWidth = TIME_COL_W + allDoctors.length * DOC_COL_MIN

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">

      {/* ── Header row ── */}
      <div
        className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 sticky top-0 z-20"
        style={{ minWidth }}
      >
        <div style={{ width: TIME_COL_W, flexShrink: 0 }} />
        {allDoctors.map((doc) => (
          <div
            key={doc.id}
            className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate border-l border-gray-200 dark:border-gray-700"
            style={{ minWidth: DOC_COL_MIN }}
          >
            {doc.name}
          </div>
        ))}
      </div>

      {/* ── Body ── */}
      <div
        className="relative flex"
        style={{ height: TOTAL_H, minWidth }}
      >
        {/* Time label column */}
        <div
          className="relative shrink-0"
          style={{ width: TIME_COL_W, height: TOTAL_H }}
        >
          {TIME_LABELS.map(({ label, slot }) => (
            <div
              key={slot}
              className="absolute right-2 text-[10px] leading-none text-gray-400 dark:text-gray-600 select-none"
              style={{ top: slot * SLOT_PX - 5 }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Doctor columns */}
        {allDoctors.map((doc) => {
          const colAppts = doc.id === '__unassigned__'
            ? unassigned
            : resolvedAppts.filter((a) => a.doctorId === doc.id)
          const isBookable = doc.id !== '__unassigned__' && !!onSlotClick
          const isHovered = hoverInfo?.docId === doc.id

          return (
            <div
              key={doc.id}
              className={`relative border-l border-gray-200 dark:border-gray-700 flex-1 ${isBookable ? 'cursor-crosshair' : ''}`}
              style={{ minWidth: DOC_COL_MIN, height: TOTAL_H }}
              onMouseMove={isBookable ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const y = e.clientY - rect.top
                const snapped = snapTime(Math.max(0, y))
                setHoverInfo({ docId: doc.id, ...snapped })
              } : undefined}
              onMouseLeave={isBookable ? () => setHoverInfo(null) : undefined}
              onClick={isBookable ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const y = e.clientY - rect.top
                const { startTime, endTime } = snapTime(Math.max(0, y))
                onSlotClick!(doc.id, doc.name, date, startTime, endTime)
              } : undefined}
            >
              {/* Hour / half-hour grid lines */}
              {TIME_LABELS.map(({ label, slot }) => (
                <div
                  key={slot}
                  className={`absolute left-0 right-0 border-t ${
                    label
                      ? 'border-gray-200 dark:border-gray-700'
                      : 'border-gray-100 dark:border-gray-800 border-dashed'
                  }`}
                  style={{ top: slot * SLOT_PX }}
                />
              ))}

              {/* Hover ghost block */}
              {isHovered && hoverInfo && (
                <div
                  className="absolute left-1 right-1 rounded border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 opacity-80 pointer-events-none flex items-center justify-center"
                  style={{ top: hoverInfo.snappedY + 1, height: SLOT_PX * 2 - 2 }}
                >
                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-300">
                    + {hoverInfo.startTime}
                  </span>
                </div>
              )}

              {/* Appointment blocks */}
              {colAppts.map((appt) => {
                const startMins = toMinutes(appt.startTime)
                const endMins   = toMinutes(appt.endTime)
                const top    = topPx(startMins)
                const height = heightPx(endMins - startMins)
                const overdue = isOverdue(appt, today, nowTime)
                const colorCls = STATUS_COLORS[appt.status] ?? 'bg-gray-100 border-gray-300 text-gray-700'

                return (
                  <button
                    key={appt.id}
                    onClick={(e) => { e.stopPropagation(); onAction?.(appt) }}
                    title={`${appt.patientName} · ${appt.startTime.slice(0, 5)}–${appt.endTime.slice(0, 5)} · ${appt.status}`}
                    className={`absolute left-1 right-1 rounded border text-left px-1.5 py-0.5 overflow-hidden hover:brightness-95 transition-all ${colorCls}`}
                    style={{ top: top + 1, height: height - 2 }}
                  >
                    <p className="text-[11px] font-semibold leading-tight truncate">{appt.patientName}</p>
                    <p className="text-[10px] leading-tight opacity-75">{appt.startTime.slice(0, 5)}</p>
                    {overdue && (
                      <span className="absolute top-0.5 right-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">⚠</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}

        {/* Current time line — spans full width of body */}
        {showNow && (
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
            style={{ top: nowTop }}
          >
            <span
              className="text-[9px] font-bold text-red-500 leading-none select-none"
              style={{ width: TIME_COL_W, textAlign: 'right', paddingRight: 4 }}
            >
              {nowTime}
            </span>
            <div className="flex-1 h-px bg-red-500" />
          </div>
        )}
      </div>
    </div>
  )
}
