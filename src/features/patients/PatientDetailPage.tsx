import { useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router'
import { usePatient } from './usePatient'
import { useUpdatePatient, useDeactivatePatient, useActivatePatient } from './usePatientMutations'
import { useMedicalAids } from '@/features/medicalAids/useMedicalAids'

const BLOOD_GROUPS = ['APositive', 'ANegative', 'BPositive', 'BNegative', 'ABPositive', 'ABNegative', 'OPositive', 'ONegative']
const BLOOD_GROUP_LABELS: Record<string, string> = {
  APositive: 'A+', ANegative: 'A-', BPositive: 'B+', BNegative: 'B-',
  ABPositive: 'AB+', ABNegative: 'AB-', OPositive: 'O+', ONegative: 'O-',
}

const inputClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: patient, isLoading, error } = usePatient(id!)
  const { data: medicalAids } = useMedicalAids()
  const updatePatient = useUpdatePatient()
  const deactivatePatient = useDeactivatePatient()
  const activatePatient = useActivatePatient()

  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [notes, setNotes] = useState('')
  const [medicalAidId, setMedicalAidId] = useState('')
  const [medicalAidNumber, setMedicalAidNumber] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [allergies, setAllergies] = useState('')
  const [chronicConditions, setChronicConditions] = useState('')

  function handleStartEdit() {
    setFirstName(patient?.firstName ?? '')
    setLastName(patient?.lastName ?? '')
    setMiddleName(patient?.middleName ?? '')
    setNotes(patient?.notes ?? '')
    setMedicalAidId(patient?.medicalAidId ?? '')
    setMedicalAidNumber(patient?.medicalAidNumber ?? '')
    setBloodGroup(patient?.bloodGroup ?? '')
    setAllergies(patient?.allergies ?? '')
    setChronicConditions(patient?.chronicConditions ?? '')
    setIsEditing(true)
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!id) return

    updatePatient.mutate(
      {
        id,
        firstName,
        lastName,
        middleName: middleName || null,
        notes: notes || null,
        medicalAidId: medicalAidId || null,
        medicalAidNumber: medicalAidNumber || null,
        bloodGroup: bloodGroup || null,
        allergies: allergies || null,
        chronicConditions: chronicConditions || null,
      },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  function handleToggleStatus() {
    if (!id || !patient) return
    if (patient.status === 'Active') {
      deactivatePatient.mutate(id)
    } else {
      activatePatient.mutate(id)
    }
  }

  if (isLoading) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
  if (error || !patient)
    return <div className="text-sm text-red-600 dark:text-red-400">Failed to load patient.</div>

  const activeAids = medicalAids?.filter((a) => a.isActive) ?? []

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{patient.fullName}</h2>
          <span
            className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              patient.status === 'Active'
                ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {patient.status}
          </span>
        </div>
        <button
          onClick={() => navigate('/patients')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          ← Back to list
        </button>
      </div>

      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Personal Details</h3>
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Edit
            </button>
          )}
        </div>

        {!isEditing ? (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">National ID</dt>
              <dd className="text-gray-900 dark:text-gray-100">{patient.nationalId}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Date of Birth</dt>
              <dd className="text-gray-900 dark:text-gray-100">{patient.dateOfBirth}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Gender</dt>
              <dd className="text-gray-900 dark:text-gray-100">{patient.gender}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500 dark:text-gray-400">Notes</dt>
              <dd className="text-gray-900 dark:text-gray-100">{patient.notes || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Medical Aid</dt>
              <dd className="text-gray-900 dark:text-gray-100">{patient.medicalAidName || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Medical Aid Number</dt>
              <dd className="text-gray-900 dark:text-gray-100">{patient.medicalAidNumber || '—'}</dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Middle Name</label>
                <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Medical Aid</label>
                <select value={medicalAidId} onChange={(e) => setMedicalAidId(e.target.value)} className={inputClass}>
                  <option value="">None</option>
                  {activeAids.map((aid) => (
                    <option key={aid.id} value={aid.id}>{aid.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Medical Aid Number</label>
                <input value={medicalAidNumber} onChange={(e) => setMedicalAidNumber(e.target.value)} placeholder="e.g. PSM123456" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Blood Group</label>
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={inputClass}>
                  <option value="">Unknown</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{BLOOD_GROUP_LABELS[bg]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Allergies</label>
              <textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} placeholder="e.g. Penicillin" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Chronic Conditions</label>
              <textarea value={chronicConditions} onChange={(e) => setChronicConditions(e.target.value)} rows={2} placeholder="e.g. Hypertension, Diabetes" className={inputClass} />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updatePatient.isPending}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {updatePatient.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {!isEditing && (patient.bloodGroup || patient.allergies || patient.chronicConditions) && (
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Medical History</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {patient.bloodGroup && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Blood Group</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {BLOOD_GROUP_LABELS[patient.bloodGroup] ?? patient.bloodGroup}
                </dd>
              </div>
            )}
            {patient.allergies && (
              <div className="col-span-2">
                <dt className="text-gray-500 dark:text-gray-400">Allergies</dt>
                <dd className="text-gray-900 dark:text-gray-100">{patient.allergies}</dd>
              </div>
            )}
            {patient.chronicConditions && (
              <div className="col-span-2">
                <dt className="text-gray-500 dark:text-gray-400">Chronic Conditions</dt>
                <dd className="text-gray-900 dark:text-gray-100">{patient.chronicConditions}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact</h3>
        {patient.contacts.map((contact) => (
          <div key={contact.id} className="text-sm text-gray-700 dark:text-gray-300">
            {contact.phoneNumber} {contact.email && `· ${contact.email}`}
          </div>
        ))}
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Address</h3>
        {patient.addresses.map((address) => (
          <div key={address.id} className="text-sm text-gray-700 dark:text-gray-300">
            {address.street}{address.suburb ? `, ${address.suburb}` : ''}, {address.city}, {address.country}
          </div>
        ))}
      </section>

      <button
        onClick={handleToggleStatus}
        disabled={deactivatePatient.isPending || activatePatient.isPending}
        className={`text-sm font-medium px-4 py-2 rounded-md border disabled:opacity-50 ${
          patient.status === 'Active'
            ? 'border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950'
            : 'border-green-300 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950'
        }`}
      >
        {patient.status === 'Active' ? 'Deactivate Patient' : 'Activate Patient'}
      </button>
    </div>
  )
}
