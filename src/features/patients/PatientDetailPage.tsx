import { useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router'
import { usePatient } from './usePatient'
import { useUpdatePatient, useDeactivatePatient, useActivatePatient, useAddContact, useUpdateContact, useAddAddress, useUpdateAddress } from './usePatientMutations'
import { useMedicalAids } from '@/features/medicalAids/useMedicalAids'
import { useVisits } from '@/features/consultations/useVisits'
import type { Contact, Address } from './patientsApi'

const STATUS_COLORS: Record<string, string> = {
  InProgress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

const inputClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

const CONTACT_TYPES = ['Mobile', 'Home', 'Work', 'Emergency']
const ADDRESS_TYPES = ['Residential', 'Work', 'Postal', 'Other']

const BLOOD_GROUPS = ['APositive', 'ANegative', 'BPositive', 'BNegative', 'ABPositive', 'ABNegative', 'OPositive', 'ONegative']
const BLOOD_GROUP_LABELS: Record<string, string> = {
  APositive: 'A+', ANegative: 'A-', BPositive: 'B+', BNegative: 'B-',
  ABPositive: 'AB+', ABNegative: 'AB-', OPositive: 'O+', ONegative: 'O-',
}

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl p-4 sm:p-6 space-y-4 mx-4">
        {children}
      </div>
    </div>
  )
}

function EditContactModal({
  patientId,
  contact,
  onClose,
}: {
  patientId: string
  contact: Contact
  onClose: () => void
}) {
  const [type, setType] = useState(contact.type)
  const [phoneNumber, setPhoneNumber] = useState(contact.phoneNumber)
  const [email, setEmail] = useState(contact.email ?? '')
  const updateContact = useUpdateContact(patientId)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateContact.mutate(
      { contactId: contact.id, type, phoneNumber, email: email || null },
      { onSuccess: onClose },
    )
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Edit Contact</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Phone Number</label>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className={inputClass}
            required
            placeholder="+263 77 123 4567"
          />
        </div>
        <div>
          <label className={labelClass}>Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="patient@example.com"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={updateContact.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {updateContact.isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalBackdrop>
  )
}

function EditAddressModal({
  patientId,
  address,
  onClose,
}: {
  patientId: string
  address: Address
  onClose: () => void
}) {
  const [type, setType] = useState(address.type)
  const [street, setStreet] = useState(address.street)
  const [suburb, setSuburb] = useState(address.suburb ?? '')
  const [city, setCity] = useState(address.city)
  const [country, setCountry] = useState(address.country)
  const updateAddress = useUpdateAddress(patientId)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateAddress.mutate(
      { addressId: address.id, type, street, suburb: suburb || null, city, country },
      { onSuccess: onClose },
    )
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Edit Address</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {ADDRESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Street</label>
          <input value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Suburb (optional)</label>
          <input value={suburb} onChange={(e) => setSuburb(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} required />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={updateAddress.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {updateAddress.isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalBackdrop>
  )
}

function AddContactModal({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const [type, setType] = useState('Mobile')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [isPrimary, setIsPrimary] = useState(true)
  const addContact = useAddContact(patientId)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    addContact.mutate(
      { type, phoneNumber, email: email || null, isPrimary },
      { onSuccess: onClose },
    )
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Add Contact</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Phone Number</label>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className={inputClass}
            required
            placeholder="+263 77 123 4567"
          />
        </div>
        <div>
          <label className={labelClass}>Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="patient@example.com"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded" />
          Set as primary contact
        </label>
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={addContact.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {addContact.isPending ? 'Adding...' : 'Add Contact'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalBackdrop>
  )
}

function AddAddressModal({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const [type, setType] = useState('Residential')
  const [street, setStreet] = useState('')
  const [suburb, setSuburb] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Zimbabwe')
  const [isPrimary, setIsPrimary] = useState(true)
  const addAddress = useAddAddress(patientId)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    addAddress.mutate(
      { type, street, suburb: suburb || null, city, country, isPrimary },
      { onSuccess: onClose },
    )
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Add Address</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {ADDRESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Street</label>
          <input value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} required placeholder="123 Main Street" />
        </div>
        <div>
          <label className={labelClass}>Suburb (optional)</label>
          <input value={suburb} onChange={(e) => setSuburb(e.target.value)} className={inputClass} placeholder="Avondale" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} required placeholder="Harare" />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} required />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded" />
          Set as primary address
        </label>
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={addAddress.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {addAddress.isPending ? 'Adding...' : 'Add Address'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalBackdrop>
  )
}

function VisitHistory({ patientId }: { patientId: string }) {
  const navigate = useNavigate()
  const { data, isLoading } = useVisits({ patientId, page: 1, pageSize: 1 })
  const last = data?.data[0]

  return (
    <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last Visit</h3>
        <button
          onClick={() => navigate(`/patients/${patientId}/visits`)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all →
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      {!isLoading && !last && (
        <p className="text-sm text-gray-400">No visits recorded.</p>
      )}

      {last && (
        <div
          onClick={() => navigate(`/consultations/${last.id}`)}
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-2 -mx-2 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{last.visitDate}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{last.doctorName}</p>
              {last.diagnosis && <p className="text-xs text-gray-500 dark:text-gray-400">{last.diagnosis}</p>}
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[last.status] ?? ''}`}>
              {last.status}
            </span>
          </div>
          {data && data.totalCount > 1 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{data.totalCount - 1} earlier visit{data.totalCount > 2 ? 's' : ''}</p>
          )}
        </div>
      )}
    </section>
  )
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: patient, isLoading, error } = usePatient(id!)
  const { data: medicalAids } = useMedicalAids()
  const updatePatient = useUpdatePatient(id)
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

  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [showAddContact, setShowAddContact] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)

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
      {showAddContact && id && (
        <AddContactModal patientId={id} onClose={() => setShowAddContact(false)} />
      )}
      {editingContact && id && (
        <EditContactModal
          patientId={id}
          contact={editingContact}
          onClose={() => setEditingContact(null)}
        />
      )}
      {showAddAddress && id && (
        <AddAddressModal patientId={id} onClose={() => setShowAddAddress(false)} />
      )}
      {editingAddress && id && (
        <EditAddressModal
          patientId={id}
          address={editingAddress}
          onClose={() => setEditingAddress(null)}
        />
      )}

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

      {!isEditing && (
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Medical History</h3>
            <button
              onClick={handleStartEdit}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Edit
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Blood Group</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {patient.bloodGroup ? (BLOOD_GROUP_LABELS[patient.bloodGroup] ?? patient.bloodGroup) : '—'}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500 dark:text-gray-400">Allergies</dt>
              <dd className="text-gray-900 dark:text-gray-100">{patient.allergies || '—'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500 dark:text-gray-400">Chronic Conditions</dt>
              <dd className="text-gray-900 dark:text-gray-100">{patient.chronicConditions || '—'}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contacts</h3>
          <button
            onClick={() => setShowAddContact(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Add Contact
          </button>
        </div>
        {patient.contacts.length === 0 && (
          <p className="text-sm text-gray-400">No contacts recorded.</p>
        )}
        {patient.contacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">{contact.type}</span>
              <span className="text-gray-900 dark:text-gray-100">{contact.phoneNumber}</span>
              {contact.email && (
                <span className="text-gray-500 dark:text-gray-400"> · {contact.email}</span>
              )}
              {contact.isPrimary && (
                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">Primary</span>
              )}
            </div>
            <button
              onClick={() => setEditingContact(contact)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-4 shrink-0"
            >
              Edit
            </button>
          </div>
        ))}
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Addresses</h3>
          <button
            onClick={() => setShowAddAddress(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Add Address
          </button>
        </div>
        {patient.addresses.length === 0 && (
          <p className="text-sm text-gray-400">No addresses recorded.</p>
        )}
        {patient.addresses.map((address) => (
          <div key={address.id} className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">{address.type}</span>
              <span className="text-gray-900 dark:text-gray-100">
                {address.street}{address.suburb ? `, ${address.suburb}` : ''}, {address.city}, {address.country}
              </span>
              {address.isPrimary && (
                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">Primary</span>
              )}
            </div>
            <button
              onClick={() => setEditingAddress(address)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-4 shrink-0"
            >
              Edit
            </button>
          </div>
        ))}
      </section>

      <VisitHistory patientId={id!} />

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
