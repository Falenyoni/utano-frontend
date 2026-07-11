import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface PrescriptionRow {
  id: string
  description: string
  quantity: number
  dosageInstructions: string | null
  dispensingType: 'BillAndDispense' | 'External'
  status: 'Pending' | 'Dispensed'
  stockItemId: string | null
  stockItemName: string | null
  unitPrice: number | null
  createdAt: string
}

export interface AddPrescriptionRequest {
  description: string
  quantity: number
  dispensingType: 'BillAndDispense' | 'External'
  stockItemId?: string | null
  stockItemName?: string | null
  dosageInstructions?: string | null
  unitPrice?: number | null
}

export async function getPrescriptions(visitId: string): Promise<PrescriptionRow[]> {
  const res = await apiFetch(`/api/visits/${visitId}/prescriptions`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch prescriptions')
  return res.json()
}

export async function addPrescription(visitId: string, body: AddPrescriptionRequest): Promise<PrescriptionRow> {
  const res = await apiFetch(`/api/visits/${visitId}/prescriptions`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to add prescription')
  return res.json()
}

export async function dispensePrescription(visitId: string, prescriptionId: string): Promise<void> {
  const res = await apiFetch(`/api/visits/${visitId}/prescriptions/${prescriptionId}/dispense`, { method: 'PUT' })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? body?.title ?? 'Failed to dispense prescription')
  }
}

export async function removePrescription(visitId: string, prescriptionId: string): Promise<void> {
  const res = await apiFetch(`/api/visits/${visitId}/prescriptions/${prescriptionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to remove prescription')
}
