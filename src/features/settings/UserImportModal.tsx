import { useQueryClient } from '@tanstack/react-query'
import { BulkUploadModal, type ImportColumn } from '@/shared/components/BulkUploadModal'
import { createUser } from './rbacApi'

const VALID_ROLES = ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Billing']

const COLUMNS: ImportColumn[] = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName',  label: 'Last Name',  required: true },
  { key: 'email',     label: 'Email',      required: true },
  { key: 'password',  label: 'Password',   required: true },
  { key: 'role',      label: 'Role',       required: true, hint: 'Admin, Doctor, Nurse, Receptionist, Billing' },
]

function normalizeRole(raw: string): string {
  const found = VALID_ROLES.find((r) => r.toLowerCase() === raw.trim().toLowerCase())
  if (!found) throw new Error(`Invalid role "${raw.trim()}". Must be one of: ${VALID_ROLES.join(', ')}`)
  return found
}

async function importUser(row: Record<string, string>) {
  const firstName = row.firstName?.trim()
  const lastName  = row.lastName?.trim()
  const email     = row.email?.trim()
  const password  = row.password?.trim()
  const role      = normalizeRole(row.role ?? '')

  const res = await createUser({ firstName, lastName, email, password, role })
    .then(() => null)
    .catch((err: Error) => { throw err })

  return res
}

interface Props { onClose: () => void; onDone: () => void }

export function UserImportModal({ onClose, onDone }: Props) {
  const qc = useQueryClient()

  return (
    <BulkUploadModal
      title="Import Users"
      columns={COLUMNS}
      templateFileName="utano-users-template.csv"
      rowLabel={(row) =>
        row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : 'User'
      }
      onClose={onClose}
      onSubmitRow={importUser}
      onDone={() => { qc.invalidateQueries({ queryKey: ['users'] }); onDone() }}
    />
  )
}
