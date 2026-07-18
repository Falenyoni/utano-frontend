import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useBookAppointment, useDoctors } from './useAppointments'
import { useAvailableSlots } from './useScheduling'
import { usePatients } from '@/features/patients/usePatients'

const APPOINTMENT_TYPES = [
  'Consultation',
  'FollowUp',
  'Procedure',
  'Vaccination',
  'LabCollection',
  'Other',
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function nowHHMM() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const inputClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm'

export function NewAppointmentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state as {
    doctorId?: string; doctorName?: string
    date?: string; startTime?: string; endTime?: string
  } | null

  const bookMutation = useBookAppointment()
  const { data: doctorsData, isLoading: loadingDoctors } = useDoctors()

  const [patientSearch, setPatientSearch] = useState('')
  const { data: patientsData } = usePatients(
    { searchTerm: patientSearch, status: 'Active', page: 1, pageSize: 10 },
    { enabled: patientSearch.length >= 2 },
  )

  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(
    prefill?.doctorId && prefill?.doctorName
      ? { id: prefill.doctorId, name: prefill.doctorName }
      : null,
  )
  const [date, setDate] = useState(prefill?.date ?? todayISO())
  const [type, setType] = useState('Consultation')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Slot picker state — pre-fill from grid click if available
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null)
  const [manualMode, setManualMode] = useState(!!(prefill?.startTime))
  const [manualStart, setManualStart] = useState(prefill?.startTime ?? '08:00')
  const [manualEnd, setManualEnd] = useState(prefill?.endTime ?? '08:30')

  const { data: slots, isLoading: loadingSlots } = useAvailableSlots(
    selectedDoctor?.id ?? null,
    date,
  )

  const hasSchedule = slots !== undefined
  const noSchedule = hasSchedule && slots.length === 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedPatient) return setError('Please select a patient.')
    if (!selectedDoctor) return setError('Please select a doctor.')

    const startTime = manualMode ? `${manualStart}:00` : selectedSlot ? `${selectedSlot.startTime}:00` : null
    const endTime = manualMode ? `${manualEnd}:00` : selectedSlot ? `${selectedSlot.endTime}:00` : null

    if (!startTime || !endTime) return setError('Please select a time slot.')

    const effectiveStart = manualMode ? manualStart : selectedSlot?.startTime ?? ''
    if (date === todayISO() && effectiveStart <= nowHHMM()) {
      return setError('Cannot book an appointment at a time that has already passed.')
    }

    bookMutation.mutate(
      {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        appointmentDate: date,
        startTime,
        endTime,
        type,
        notes: notes || null,
      },
      {
        onSuccess: () => navigate('/appointments'),
        onError: (err) => setError(err.message),
      },
    )
  }

  // Reset slot when doctor or date changes
  function handleDoctorChange(doctorId: string) {
    const doc = doctorsData?.find((d) => d.id === doctorId)
    setSelectedDoctor(doc ? { id: doc.id, name: doc.fullName } : null)
    setSelectedSlot(null)
  }

  function handleDateChange(newDate: string) {
    setDate(newDate)
    setSelectedSlot(null)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Book Appointment</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Schedule a new appointment</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patient */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient</label>
          {selectedPatient ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-md border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950">
              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPatient.name}</span>
              <button type="button" onClick={() => setSelectedPatient(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Change</button>
            </div>
          ) : (
            <div className="space-y-1">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient by name or ID..."
                className={inputClass}
              />
              {patientsData && patientsData.data.length > 0 && (
                <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 max-h-48 overflow-y-auto">
                  {patientsData.data.map((p) => (
                    <button key={p.id} type="button"
                      onClick={() => { setSelectedPatient({ id: p.id, name: p.fullName }); setPatientSearch('') }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
                      {p.fullName}
                      <span className="ml-2 text-xs text-gray-400">{p.nationalId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Doctor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor</label>
          {loadingDoctors ? (
            <p className="text-sm text-gray-400">Loading doctors...</p>
          ) : (
            <select value={selectedDoctor?.id ?? ''} onChange={(e) => handleDoctorChange(e.target.value)}
              className={inputClass}>
              <option value="">Select a doctor</option>
              {doctorsData?.map((d) => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>
          )}
        </div>

        {/* Date + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input type="date" value={date} min={todayISO()}
              onChange={(e) => handleDateChange(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Slot picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Slot</label>
            {selectedDoctor && (
              <button type="button" onClick={() => { setManualMode((m) => !m); setSelectedSlot(null) }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                {manualMode ? 'Pick from schedule' : 'Enter manually'}
              </button>
            )}
          </div>

          {!selectedDoctor && (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Select a doctor to see available slots.</p>
          )}

          {selectedDoctor && manualMode && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
                <input type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)}
                  required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Time</label>
                <input type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)}
                  required className={inputClass} />
              </div>
            </div>
          )}

          {selectedDoctor && !manualMode && (
            <>
              {loadingSlots && (
                <p className="text-sm text-gray-400 dark:text-gray-500">Loading slots...</p>
              )}
              {noSchedule && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  No schedule configured for this doctor on {new Date(date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long' })}.
                  <button type="button" onClick={() => setManualMode(true)}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:underline">Enter time manually</button>
                </p>
              )}
              {slots && slots.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime
                    const isPast = date === todayISO() && slot.startTime <= nowHHMM()
                    const unavailable = !slot.isAvailable || isPast
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={unavailable}
                        onClick={() => setSelectedSlot({ startTime: slot.startTime, endTime: slot.endTime })}
                        title={isPast ? 'This time has already passed' : undefined}
                        className={[
                          'px-2 py-1.5 rounded text-xs font-medium border transition-colors',
                          unavailable
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950',
                        ].join(' ')}
                      >
                        {slot.startTime}
                      </button>
                    )
                  })}
                </div>
              )}
              {selectedSlot && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Selected: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSlot.startTime} – {selectedSlot.endTime}</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (optional)
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            placeholder="Reason for visit, special instructions..."
            className={inputClass} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" onClick={() => navigate('/appointments')}
            className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
            Cancel
          </button>
          <button type="submit" disabled={bookMutation.isPending}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {bookMutation.isPending ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  )
}
