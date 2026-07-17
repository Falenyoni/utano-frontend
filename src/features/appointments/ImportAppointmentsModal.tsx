import { useQueryClient } from '@tanstack/react-query'
import { BulkUploadModal, type ImportColumn } from '@/shared/components/BulkUploadModal'
import { bulkImportAppointments } from './appointmentsApi'

const COLUMNS: ImportColumn[] = [
  { key: 'patientName',     label: 'PatientName',     required: true },
  { key: 'doctorName',      label: 'DoctorName',      required: true },
  { key: 'appointmentDate', label: 'AppointmentDate', required: true, hint: 'YYYY-MM-DD' },
  { key: 'startTime',       label: 'StartTime',       required: true, hint: 'HH:MM' },
  { key: 'endTime',         label: 'EndTime',         required: true, hint: 'HH:MM' },
  { key: 'type',            label: 'Type',            required: true, hint: 'Consultation · FollowUp · Procedure · Vaccination · LabCollection · WalkIn · Other' },
  { key: 'notes',           label: 'Notes',           hint: 'optional' },
]

async function importRow(row: Record<string, string>) {
  const result = await bulkImportAppointments([{
    patientName:     row.patientName,
    doctorName:      row.doctorName,
    appointmentDate: row.appointmentDate,
    startTime:       row.startTime,
    endTime:         row.endTime,
    type:            row.type,
    notes:           row.notes || undefined,
  }])
  if (result.failed > 0) throw new Error(result.errors[0] ?? 'Import failed')
}

interface Props {
  onClose: () => void
}

export function ImportAppointmentsModal({ onClose }: Props) {
  const queryClient = useQueryClient()

  return (
    <BulkUploadModal
      title="Import Appointments"
      columns={COLUMNS}
      templateFileName="utano-appointments-template.csv"
      onClose={onClose}
      onSubmitRow={importRow}
      onDone={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}
      rowLabel={(row) =>
        row.patientName
          ? `${row.patientName} — ${row.appointmentDate}`
          : 'Row'
      }
    />
  )
}
