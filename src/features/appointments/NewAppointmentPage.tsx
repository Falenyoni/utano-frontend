import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useBookAppointment, useDoctors } from './useAppointments'
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

export function NewAppointmentPage() {
  const navigate = useNavigate()
  const bookMutation = useBookAppointment()
  const { data: doctorsData, isLoading: loadingDoctors } = useDoctors()

  const [patientSearch, setPatientSearch] = useState('')
  const { data: patientsData } = usePatients(
    { searchTerm: patientSearch, status: 'Active', page: 1, pageSize: 10 },
    { enabled: patientSearch.length >= 2 },
  )

  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null)
  const [date, setDate] = useState(todayISO())
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('08:30')
  const [type, setType] = useState('Consultation')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedPatient) return setError('Please select a patient.')
    if (!selectedDoctor) return setError('Please select a doctor.')

    bookMutation.mutate(
      {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        appointmentDate: date,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        type,
        notes: notes || null,
      },
      {
        onSuccess: () => navigate('/appointments'),
        onError: (err) => setError(err.message),
      },
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Book Appointment</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Schedule a new appointment</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Patient
          </label>
          {selectedPatient ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-md border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950">
              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPatient.name}</span>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient by name or ID..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              />
              {patientsData && patientsData.data.length > 0 && (
                <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 max-h-48 overflow-y-auto">
                  {patientsData.data.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedPatient({ id: p.id, name: p.fullName }); setPatientSearch('') }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {p.fullName}
                      <span className="ml-2 text-xs text-gray-400">{p.nationalId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Doctor
          </label>
          {loadingDoctors ? (
            <p className="text-sm text-gray-400">Loading doctors...</p>
          ) : (
            <select
              value={selectedDoctor?.id ?? ''}
              onChange={(e) => {
                const doc = doctorsData?.find((d) => d.id === e.target.value)
                setSelectedDoctor(doc ? { id: doc.id, name: doc.fullName } : null)
              }}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            >
              <option value="">Select a doctor</option>
              {doctorsData?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            >
              {APPOINTMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Reason for visit, special instructions..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={bookMutation.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bookMutation.isPending ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  )
}
