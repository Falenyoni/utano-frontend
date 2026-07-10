import { useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router'
import { usePatient } from './usePatient'
import { useUpdatePatient, useDeactivatePatient, useActivatePatient } from './usePatientMutations'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: patient, isLoading, error } = usePatient(id!)
  const updatePatient = useUpdatePatient()
  const deactivatePatient = useDeactivatePatient()
  const activatePatient = useActivatePatient()

  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [notes, setNotes] = useState(patient?.notes ?? '')

  function handleStartEdit() {
    setFirstName('')
    setLastName('')
    setMiddleName('')
    setNotes(patient?.notes ?? '')
    setIsEditing(true)
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!id) return

    updatePatient.mutate(
      { id, firstName, lastName, middleName: middleName || null, notes: notes || null },
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

  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>
  if (error || !patient) return <div className="text-sm text-red-600">Failed to load patient.</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{patient.fullName}</h2>
          <span
            className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              patient.status === 'Active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {patient.status}
          </span>
        </div>
        <button
          onClick={() => navigate('/patients')}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to list
        </button>
      </div>

      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Personal Details</h3>
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        {!isEditing ? (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">National ID</dt>
              <dd className="text-gray-900">{patient.nationalId}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Date of Birth</dt>
              <dd className="text-gray-900">{patient.dateOfBirth}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Gender</dt>
              <dd className="text-gray-900">{patient.gender}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">Notes</dt>
              <dd className="text-gray-900">{patient.notes || '—'}</dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <p className="text-xs text-gray-400">
              Re-enter the full name below (the system doesn't retain first/last name split for editing).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                <input
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={3}
              />
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
                className="border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Contact</h3>
        {patient.contacts.map((contact) => (
          <div key={contact.id} className="text-sm text-gray-700">
            {contact.phoneNumber} {contact.email && `· ${contact.email}`}
          </div>
        ))}
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Address</h3>
        {patient.addresses.map((address) => (
          <div key={address.id} className="text-sm text-gray-700">
            {address.street}, {address.suburb}, {address.city}, {address.country}
          </div>
        ))}
      </section>

      <button
        onClick={handleToggleStatus}
        disabled={deactivatePatient.isPending || activatePatient.isPending}
        className={`text-sm font-medium px-4 py-2 rounded-md border disabled:opacity-50 ${
          patient.status === 'Active'
            ? 'border-red-300 text-red-600 hover:bg-red-50'
            : 'border-green-300 text-green-600 hover:bg-green-50'
        }`}
      >
        {patient.status === 'Active' ? 'Deactivate Patient' : 'Activate Patient'}
      </button>
    </div>
  )
}