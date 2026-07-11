import { useState, useRef, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useOpenVisit } from './useVisits'
import { useDoctors } from '@/features/appointments/useAppointments'
import { getPatients } from '@/features/patients/patientsApi'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

interface PrefillState {
  patientId?: string
  patientName?: string
  doctorId?: string
  doctorName?: string
  appointmentId?: string
  visitDate?: string
}

export function NewVisitPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as PrefillState | null) ?? {}

  const openVisit = useOpenVisit()
  const { data: doctors } = useDoctors()

  const [visitDate, setVisitDate] = useState(prefill.visitDate ?? todayISO())
  const [doctorId, setDoctorId] = useState(prefill.doctorId ?? '')
  const [department, setDepartment] = useState('')
  const [patientSearch, setPatientSearch] = useState(prefill.patientName ?? '')
  const [patientId, setPatientId] = useState(prefill.patientId ?? '')
  const [patientName, setPatientName] = useState(prefill.patientName ?? '')
  const [patientGender, setPatientGender] = useState<string | null>(null)
  const [patientDateOfBirth, setPatientDateOfBirth] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<{ id: string; fullName: string; gender: string; dateOfBirth: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const patientLocked = !!prefill.patientId
  const doctorLocked = !!prefill.doctorId

  function handlePatientSearch(term: string) {
    setPatientSearch(term)
    setPatientId('')
    setPatientName('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (term.length < 2) { setSearchResults([]); return }
    debounceRef.current = setTimeout(async () => {
      const result = await getPatients({ searchTerm: term, pageSize: 5 })
      setSearchResults(result.data)
    }, 300)
  }

  function selectPatient(id: string, name: string, gender: string, dob: string) {
    setPatientId(id)
    setPatientName(name)
    setPatientGender(gender)
    setPatientDateOfBirth(dob)
    setPatientSearch(name)
    setSearchResults([])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!patientId) { setError('Please select a patient.'); return }
    if (!doctorId) { setError('Please select a doctor.'); return }

    const resolvedDoctorName = prefill.doctorName ?? doctors?.find((d) => d.id === doctorId)?.fullName ?? ''

    try {
      const result = await openVisit.mutateAsync({
        patientId,
        patientName,
        doctorId,
        doctorName: resolvedDoctorName,
        visitDate,
        department: department.trim() || null,
        appointmentId: prefill.appointmentId,
        patientGender: patientGender ?? undefined,
        patientDateOfBirth: patientDateOfBirth ?? undefined,
      })
      navigate(`/consultations/${result.id}`)
    } catch {
      setError('Failed to open visit. Please try again.')
    }
  }

  const inputClass = 'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm'
  const lockedClass = 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Open Visit</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {prefill.appointmentId && (
          <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-3 py-2 rounded-md">
            Linked to appointment
          </p>
        )}

        <div className="relative">
          <label className={labelClass}>Patient</label>
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => handlePatientSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className={`${inputClass} ${patientLocked ? lockedClass : ''}`}
            autoComplete="off"
            readOnly={patientLocked}
          />
          {searchResults.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
              {searchResults.map((p) => (
                <li
                  key={p.id}
                  onClick={() => selectPatient(p.id, p.fullName, p.gender, p.dateOfBirth)}
                  className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {p.fullName}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className={labelClass}>Doctor</label>
          {doctorLocked ? (
            <input
              type="text"
              value={prefill.doctorName ?? ''}
              readOnly
              className={`${inputClass} ${lockedClass}`}
            />
          ) : (
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={inputClass} required>
              <option value="">Select doctor...</option>
              {doctors?.map((d) => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className={labelClass}>Visit Date</label>
          <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className={inputClass} required />
        </div>

        <div>
          <label className={labelClass}>Department (optional)</label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Outpatient, Emergency, ICU"
            className={inputClass}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={openVisit.isPending}
            className="flex-1 bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {openVisit.isPending ? 'Opening...' : 'Open Visit'}
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
