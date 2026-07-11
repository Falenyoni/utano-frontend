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
  stockItemId: string
  stockItemName: string
  quantityOnHand: number
  unit: string
  createdAt: string
}

export async function getDispensaryQueue(): Promise<DispensaryRow[]> {
  const res = await apiFetch('/api/clinical/dispensary', { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch dispensary queue')
  return res.json()
}

export async function dispensePrescriptionFromQueue(
  visitId: string,
  prescriptionId: string,
  quantityOverride?: number,
): Promise<void> {
  const res = await apiFetch(`/api/visits/${visitId}/prescriptions/${prescriptionId}/dispense`, {
    method: 'PUT',
    body: JSON.stringify({ quantityOverride: quantityOverride ?? null }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? body?.title ?? 'Failed to dispense prescription')
  }
}
