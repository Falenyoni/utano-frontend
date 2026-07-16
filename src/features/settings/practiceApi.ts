import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface PracticeDetail {
  id: string
  name: string
  contactEmail: string
  contactPhone: string
  physicalAddress: string
  hasDispensary: boolean
}

export interface UpdatePracticeRequest {
  name: string
  contactEmail: string
  contactPhone: string
  physicalAddress: string
  hasDispensary: boolean
}

export async function getPractice(): Promise<PracticeDetail> {
  const res = await apiFetch('/api/practice', { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch practice details')
  return res.json()
}

export async function updatePractice(request: UpdatePracticeRequest): Promise<void> {
  const res = await apiFetch('/api/practice', {
    method: 'PUT',
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail ?? 'Failed to update practice details')
  }
}
