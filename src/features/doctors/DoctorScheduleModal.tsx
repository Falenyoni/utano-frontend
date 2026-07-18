import { useState, useEffect } from 'react'
import {
  useDoctorSchedule,
  useSetDoctorSchedule,
  useAddScheduleException,
  useRemoveScheduleException,
} from '@/features/appointments/useScheduling'
import type { DayScheduleDto, ScheduleExceptionDto } from '@/features/appointments/schedulingApi'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon → Sun
const DAY_NAMES: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
}
const SLOT_OPTIONS = [15, 20, 30, 45, 60]

interface DayState {
  active: boolean
  startTime: string
  endTime: string
  slotDurationMinutes: number
}

const DEFAULT_DAY: DayState = { active: false, startTime: '08:00', endTime: '17:00', slotDurationMinutes: 30 }
const WORKDAY: DayState = { active: true, startTime: '08:00', endTime: '17:00', slotDurationMinutes: 30 }

function buildInitialDays(schedule: DayScheduleDto[]): Record<number, DayState> {
  const days: Record<number, DayState> = {}
  for (const dow of DAY_ORDER) {
    const found = schedule.find((s) => s.dayOfWeek === dow)
    days[dow] = found
      ? { active: found.isActive, startTime: found.startTime, endTime: found.endTime, slotDurationMinutes: found.slotDurationMinutes }
      : DEFAULT_DAY
  }
  return days
}

const inputClass =
  'rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-sm'

interface Props {
  doctorId: string
  doctorName: string
  onClose: () => void
}

export function DoctorScheduleModal({ doctorId, doctorName, onClose }: Props) {
  const { data, isLoading } = useDoctorSchedule(doctorId)
  const setSchedule = useSetDoctorSchedule(doctorId)
  const addException = useAddScheduleException(doctorId)
  const removeException = useRemoveScheduleException(doctorId)

  const [days, setDays] = useState<Record<number, DayState>>(() =>
    Object.fromEntries(DAY_ORDER.map((d) => [d, DEFAULT_DAY])),
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Exception form state
  const [exDate, setExDate] = useState('')
  const [exType, setExType] = useState<'Unavailable' | 'ModifiedHours'>('Unavailable')
  const [exStart, setExStart] = useState('08:00')
  const [exEnd, setExEnd] = useState('17:00')
  const [exReason, setExReason] = useState('')
  const [exError, setExError] = useState<string | null>(null)

  useEffect(() => {
    if (data?.schedule) {
      setDays(buildInitialDays(data.schedule))
    }
  }, [data])

  function updateDay(dow: number, patch: Partial<DayState>) {
    setDays((prev) => ({ ...prev, [dow]: { ...prev[dow], ...patch } }))
    setSaved(false)
  }

  function applyTemplate(template: 'weekdays' | 'clear') {
    const next: Record<number, DayState> = {}
    for (const dow of DAY_ORDER) {
      if (template === 'weekdays') {
        next[dow] = dow >= 1 && dow <= 5 ? { ...WORKDAY } : { ...DEFAULT_DAY, active: false }
      } else {
        next[dow] = { ...DEFAULT_DAY, active: false }
      }
    }
    setDays(next)
    setSaved(false)
  }

  async function handleSave() {
    setSaveError(null)
    setSaved(false)
    const activeDays = DAY_ORDER.filter((d) => days[d].active)
    if (activeDays.length === 0) {
      setSaveError('Enable at least one working day.')
      return
    }
    for (const dow of activeDays) {
      const d = days[dow]
      if (d.startTime >= d.endTime) {
        setSaveError(`${DAY_NAMES[dow]}: end time must be after start time.`)
        return
      }
    }
    const payload = DAY_ORDER.map((dow) => ({
      dayOfWeek: dow,
      startTime: days[dow].startTime,
      endTime: days[dow].endTime,
      slotDurationMinutes: days[dow].slotDurationMinutes,
      isActive: days[dow].active,
    }))
    setSchedule.mutate(payload, {
      onSuccess: () => setSaved(true),
      onError: () => setSaveError('Failed to save schedule. Please try again.'),
    })
  }

  async function handleAddException() {
    setExError(null)
    if (!exDate) { setExError('Date is required.'); return }
    if (exType === 'ModifiedHours' && exStart >= exEnd) {
      setExError('End time must be after start time.')
      return
    }
    addException.mutate(
      {
        date: exDate,
        type: exType,
        startTime: exType === 'ModifiedHours' ? exStart : undefined,
        endTime: exType === 'ModifiedHours' ? exEnd : undefined,
        reason: exReason || undefined,
      },
      {
        onSuccess: () => { setExDate(''); setExReason(''); setExError(null) },
        onError: (err) => setExError(err.message),
      },
    )
  }

  const exceptions: ScheduleExceptionDto[] = data?.exceptions ?? []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Doctor Schedule</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{doctorName}</p>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none px-1">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
          {isLoading ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading schedule...</p>
          ) : (
            <>
              {/* Weekly schedule */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Weekly Schedule</h4>
                  <div className="flex gap-2">
                    <button onClick={() => applyTemplate('weekdays')}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      Mon–Fri defaults
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <button onClick={() => applyTemplate('clear')}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:underline">
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {DAY_ORDER.map((dow) => {
                    const day = days[dow]
                    return (
                      <div key={dow}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors ${
                          day.active
                            ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40'
                        }`}>
                        <input
                          type="checkbox"
                          checked={day.active}
                          onChange={(e) => updateDay(dow, { active: e.target.checked })}
                          className="w-4 h-4 rounded accent-blue-600"
                        />
                        <span className={`w-24 text-sm font-medium shrink-0 ${
                          day.active
                            ? 'text-gray-800 dark:text-gray-200'
                            : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          {DAY_NAMES[dow]}
                        </span>

                        {day.active ? (
                          <div className="flex items-center gap-2 flex-1 flex-wrap">
                            <input type="time" value={day.startTime}
                              onChange={(e) => updateDay(dow, { startTime: e.target.value })}
                              className={inputClass} />
                            <span className="text-gray-400 dark:text-gray-600 text-sm">→</span>
                            <input type="time" value={day.endTime}
                              onChange={(e) => updateDay(dow, { endTime: e.target.value })}
                              className={inputClass} />
                            <select value={day.slotDurationMinutes}
                              onChange={(e) => updateDay(dow, { slotDurationMinutes: Number(e.target.value) })}
                              className={inputClass}>
                              {SLOT_OPTIONS.map((m) => (
                                <option key={m} value={m}>{m} min</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-600 italic">Day off</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {saveError && <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>}
                {saved && <p className="text-xs text-green-600 dark:text-green-400">Schedule saved.</p>}

                <button onClick={handleSave} disabled={setSchedule.isPending}
                  className="w-full py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {setSchedule.isPending ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>

              {/* Exceptions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Leave & Exceptions
                </h4>

                {exceptions.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No exceptions set.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {exceptions.map((ex) => (
                      <li key={ex.id}
                        className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{ex.date}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              ex.type === 'Unavailable'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                              {ex.type === 'Unavailable' ? 'Leave' : 'Modified Hours'}
                            </span>
                            {ex.startTime && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {ex.startTime} – {ex.endTime}
                              </span>
                            )}
                          </div>
                          {ex.reason && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">{ex.reason}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeException.mutate(ex.id)}
                          disabled={removeException.isPending}
                          className="text-xs text-red-500 dark:text-red-400 hover:underline ml-3 shrink-0 disabled:opacity-50">
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add exception form */}
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-3 space-y-2.5">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Add Exception
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
                      <input type="date" value={exDate} onChange={(e) => setExDate(e.target.value)}
                        className={`${inputClass} w-full`} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
                      <select value={exType} onChange={(e) => setExType(e.target.value as 'Unavailable' | 'ModifiedHours')}
                        className={`${inputClass} w-full`}>
                        <option value="Unavailable">Leave / Unavailable</option>
                        <option value="ModifiedHours">Modified Hours</option>
                      </select>
                    </div>
                  </div>

                  {exType === 'ModifiedHours' && (
                    <div className="flex items-center gap-2">
                      <input type="time" value={exStart} onChange={(e) => setExStart(e.target.value)}
                        className={inputClass} />
                      <span className="text-gray-400 text-sm">→</span>
                      <input type="time" value={exEnd} onChange={(e) => setExEnd(e.target.value)}
                        className={inputClass} />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Reason (optional)
                    </label>
                    <input type="text" value={exReason} onChange={(e) => setExReason(e.target.value)}
                      placeholder="e.g. Annual leave, Conference..."
                      className={`${inputClass} w-full`} />
                  </div>

                  {exError && <p className="text-xs text-red-600 dark:text-red-400">{exError}</p>}

                  <button onClick={handleAddException} disabled={addException.isPending || !exDate}
                    className="w-full py-1.5 text-sm font-medium border border-blue-600 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950 disabled:opacity-50 disabled:cursor-not-allowed">
                    {addException.isPending ? 'Adding...' : '+ Add Exception'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <button onClick={onClose}
            className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
