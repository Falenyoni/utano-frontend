import { BulkUploadModal, type ImportColumn } from '@/shared/components/BulkUploadModal'
import { apiFetch } from '@/shared/lib/api/apiFetch'
import type { CreatePatientRequest } from './patientsApi'

const COLUMNS: ImportColumn[] = [
  { key: 'firstName',          label: 'First Name',          required: true },
  { key: 'lastName',           label: 'Last Name',           required: true },
  { key: 'dateOfBirth',        label: 'Date of Birth',       required: true, hint: 'YYYY-MM-DD' },
  { key: 'gender',             label: 'Gender',              required: true, hint: 'Male / Female / Other' },
  { key: 'nationalId',         label: 'National ID',         required: true },
  { key: 'phone',              label: 'Phone',               required: true, hint: '+263771234567' },
  { key: 'email',              label: 'Email',               hint: 'optional' },
  { key: 'street',             label: 'Street',              hint: 'optional' },
  { key: 'city',               label: 'City',                hint: 'optional' },
  { key: 'country',            label: 'Country',             hint: 'defaults to Zimbabwe' },
  { key: 'bloodGroup',         label: 'Blood Group',         hint: 'A+ · A- · B+ · B- · O+ · O- · AB+ · AB-' },
  { key: 'allergies',          label: 'Allergies',           hint: 'optional' },
  { key: 'chronicConditions',  label: 'Chronic Conditions',  hint: 'optional' },
]

// Backend BloodGroup enum uses word form — map common shorthand notation
const BLOOD_GROUP_MAP: Record<string, string> = {
  'a+': 'APositive',  'a-': 'ANegative',
  'b+': 'BPositive',  'b-': 'BNegative',
  'o+': 'OPositive',  'o-': 'ONegative',
  'ab+': 'ABPositive', 'ab-': 'ABNegative',
  // already in enum form
  'apositive': 'APositive', 'anegative': 'ANegative',
  'bpositive': 'BPositive', 'bnegative': 'BNegative',
  'opositive': 'OPositive', 'onegative': 'ONegative',
  'abpositive': 'ABPositive', 'abnegative': 'ABNegative',
}

function normalizeBloodGroup(raw: string): string | null {
  if (!raw.trim()) return null
  return BLOOD_GROUP_MAP[raw.trim().toLowerCase()] ?? null
}

// xlsx strips '+' from numbers (reads +263... as the number 263...)
// Restore it for international phone numbers that start with a country code
function normalizePhone(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  // If xlsx converted +263... → 263..., re-add the +
  if (/^2[0-9]{11,}$/.test(s)) return `+${s}`
  return s
}

async function importPatient(row: Record<string, string>) {
  const req: CreatePatientRequest = {
    firstName:  row.firstName,
    lastName:   row.lastName,
    middleName: null,
    dateOfBirth: row.dateOfBirth,
    gender:     row.gender,
    nationalId: row.nationalId,
    contacts: [{
      type:        'Mobile',
      phoneNumber: normalizePhone(row.phone),
      email:       row.email || null,
      isPrimary:   true,
    }],
    addresses: row.street || row.city ? [{
      type:    'Residential',
      street:  row.street || '',
      suburb:  null,
      city:    row.city || '',
      country: row.country || 'Zimbabwe',
      isPrimary: true,
    }] : [],
    medicalAidId:       null,
    medicalAidNumber:   null,
    bloodGroup:         normalizeBloodGroup(row.bloodGroup),
    allergies:          row.allergies || null,
    chronicConditions:  row.chronicConditions || null,
  }

  const res = await apiFetch('/api/patients', {
    method: 'POST',
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const msg = body?.errors
      ? Object.values(body.errors as Record<string, string[]>).flat().join(', ')
      : body?.title ?? 'Failed to create patient'
    throw new Error(msg)
  }
}

interface Props { onClose: () => void; onDone: () => void }

export function PatientImportModal({ onClose, onDone }: Props) {
  return (
    <BulkUploadModal
      title="Import Patients"
      columns={COLUMNS}
      templateFileName="utano-patients-template.csv"
      onClose={onClose}
      onSubmitRow={importPatient}
      onDone={onDone}
      rowLabel={(row) =>
        row.firstName && row.lastName
          ? `${row.firstName} ${row.lastName}`
          : `Row`
      }
    />
  )
}
