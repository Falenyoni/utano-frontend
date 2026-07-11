import { useState, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useBookAppointment, useDoctors } from './useAppointments'
import { getPatients, quickRegisterPatient } from '@/features/patients/patientsApi'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function nowTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`
}

function plusMinutes(time: string, mins: number) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`
}

const inputClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
const subLabelClass = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'

export function WalkInPage() {
  const navigate = useNavigate()
  const bookAppointment = useBookAppointment()
  const { data: doctors } = useDoctors()

  const start = nowTime()

  // Patient search state
  const [patientSearch, setPatientSearch] = useState('')
  const [patientId, setPatientId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; fullName: string }[]>([])
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Quick register state
  const [showQuickRegister, setShowQuickRegister] = useState(false)
  const [qrFirstName, setQrFirstName] = useState('')
  const [qrLastName, setQrLastName] = useState('')
  const [qrDob, setQrDob] = useState('')
  const [qrGender, setQrGender] = useState('Male')
  const [qrNationalId, setQrNationalId] = useState('')
  const [qrPhone, setQrPhone] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)

  // Walk-in form state
  const [doctorId, setDoctorId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handlePatientSearch(term: string) {
    setPatientSearch(term)
    setPatientId('')
    setPatientName('')
    setSearched(false)
    setShowQuickRegister(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (term.length < 2) { setSearchResults([]); return }
    debounceRef.current = setTimeout(async () => {
      const result = await getPatients({ searchTerm: term, status: 'Active', pageSize: 6 })
      setSearchResults(result.data)
      setSearched(true)
    }, 300)
  }

  function selectPatient(id: string, name: string) {
    setPatientId(id)
    setPatientName(name)
    setPatientSearch(name)
    setSearchResults([])
    setSearched(false)
    setShowQuickRegister(false)
  }

  function openQuickRegister() {
    setShowQuickRegister(true)
    setQrError(null)
    // Pre-fill from search term if it looks like a name
    const parts = patientSearch.trim().split(/\s+/)
    if (parts.length >= 2) {
      setQrFirstName(parts[0])
      setQrLastName(parts.slice(1).join(' '))
    } else if (parts.length === 1 && parts[0]) {
      setQrFirstName(parts[0])
    }
  }

  async function handleQuickRegister() {
    setQrError(null)
    if (!qrFirstName.trim() || !qrLastName.trim() || !qrDob || !qrPhone.trim() || !qrNationalId.trim()) {
      setQrError('All fields are required.')
      return
    }
    setQrLoading(true)
    try {
      const result = await quickRegisterPatient({
        firstName: qrFirstName.trim(),
        lastName: qrLastName.trim(),
        dateOfBirth: qrDob,
        gender: qrGender,
        nationalId: qrNationalId.trim(),
        phoneNumber: qrPhone.trim(),
      })
      selectPatient(result.id, result.fullName)
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'Failed to register patient.')
    } finally {
      setQrLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!patientId) { setError('Please select a patient.'); return }
    if (!doctorId) { setError('Please select a doctor.'); return }

    const doctor = doctors?.find((d) => d.id === doctorId)

    try {
      await bookAppointment.mutateAsync({
        patientId,
        patientName,
        doctorId,
        doctorName: doctor?.fullName ?? '',
        appointmentDate: todayISO(),
        startTime: start,
        endTime: plusMinutes(start, 30),
        type: 'WalkIn',
        notes: notes || null,
      })
      navigate('/waiting-room')
    } catch {
      setError('Failed to register walk-in. Please try again.')
    }
  }

  const noResultsFound = searched && searchResults.length === 0 && !patientId

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Register Walk-in</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Patient will be added to today's waiting room.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {/* Patient search / selection */}
        <div className="relative">
          <label className={labelClass}>Patient</label>

          {patientId ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-md border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950">
              <span className="text-sm text-gray-900 dark:text-gray-100">{patientName}</span>
              <button
                type="button"
                onClick={() => {
                  setPatientId('')
                  setPatientName('')
                  setPatientSearch('')
                  setSearchResults([])
                  setSearched(false)
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => handlePatientSearch(e.target.value)}
                placeholder="Search by name or National ID..."
                className={inputClass}
                autoComplete="off"
              />

              {searchResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => selectPatient(p.id, p.fullName)}
                      className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {p.fullName}
                    </li>
                  ))}
                </ul>
              )}

              {noResultsFound && !showQuickRegister && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>No patients found for "{patientSearch}".</span>
                  <button
                    type="button"
                    onClick={openQuickRegister}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium whitespace-nowrap"
                  >
                    Register as new patient
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Inline quick register form */}
        {showQuickRegister && (
          <div className="border border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-4 space-y-3 bg-blue-50/40 dark:bg-blue-950/30">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
              Quick Patient Registration
            </p>
            {qrError && <p className="text-xs text-red-600 dark:text-red-400">{qrError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={subLabelClass}>First Name *</label>
                <input
                  value={qrFirstName}
                  onChange={(e) => setQrFirstName(e.target.value)}
                  placeholder="First name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={subLabelClass}>Last Name *</label>
                <input
                  value={qrLastName}
                  onChange={(e) => setQrLastName(e.target.value)}
                  placeholder="Last name"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={subLabelClass}>Date of Birth *</label>
                <input
                  type="date"
                  value={qrDob}
                  onChange={(e) => setQrDob(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={subLabelClass}>Gender *</label>
                <select
                  value={qrGender}
                  onChange={(e) => setQrGender(e.target.value)}
                  className={inputClass}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={subLabelClass}>National ID *</label>
                <input
                  value={qrNationalId}
                  onChange={(e) => setQrNationalId(e.target.value)}
                  placeholder="National ID"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={subLabelClass}>Phone Number *</label>
                <input
                  value={qrPhone}
                  onChange={(e) => setQrPhone(e.target.value)}
                  placeholder="+263..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleQuickRegister}
                disabled={qrLoading}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {qrLoading ? 'Registering...' : 'Register Patient'}
              </button>
              <button
                type="button"
                onClick={() => { setShowQuickRegister(false); setQrError(null) }}
                className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>Doctor</label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Assign to doctor...</option>
            {doctors?.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Reason / Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Chief complaint or reason for visit..."
            rows={3}
            className={inputClass}
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          Arrival time:{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{start.slice(0, 5)}</span>{' '}
          · Date:{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{todayISO()}</span>{' '}
          · Type:{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">Walk-in</span>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={bookAppointment.isPending || showQuickRegister}
            className="flex-1 bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {bookAppointment.isPending ? 'Registering...' : 'Register & Add to Queue'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
