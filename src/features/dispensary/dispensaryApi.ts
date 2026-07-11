import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface DispensaryRow {
  prescriptionId: string
  visitId: string
  patientName: string
  visitDate: string
  doctorName: string
  description: string
  quantity: number
  dosageInstructions: string | null
  dispensingType: string
  stockItemId: string | null
  stockItemName: string | null
  createdAt: string
}

export async function getDispensaryQueue(): Promise<DispensaryRow[]> {
  const res = await apiFetch('/api/clinical/dispensary', { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch dispensary queue')
  return res.json()
}

export async function dispensePrescriptionFromQueue(visitId: string, prescriptionId: string): Promise<void> {
  const res = await apiFetch(`/api/visits/${visitId}/prescriptions/${prescriptionId}/dispense`, { method: 'PUT' })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? body?.title ?? 'Failed to dispense prescription')
  }
}
