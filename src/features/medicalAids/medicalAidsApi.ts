import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface MedicalAid {
  id: string
  name: string
  code: string
  isActive: boolean
  createdAt: string
}

export async function getMedicalAids(): Promise<MedicalAid[]> {
  const response = await apiFetch('/api/medical-aids', { method: 'GET' })
  if (!response.ok) throw new Error('Failed to fetch medical aids')
  return response.json()
}

export async function addMedicalAid(name: string, code: string): Promise<MedicalAid> {
  const response = await apiFetch('/api/medical-aids', {
    method: 'POST',
    body: JSON.stringify({ name, code }),
  })
  if (!response.ok) throw new Error('Failed to add medical aid')
  return response.json()
}

export async function activateMedicalAid(id: string): Promise<void> {
  const response = await apiFetch(`/api/medical-aids/${id}/activate`, { method: 'PUT' })
  if (!response.ok) throw new Error('Failed to activate medical aid')
}

export async function deactivateMedicalAid(id: string): Promise<void> {
  const response = await apiFetch(`/api/medical-aids/${id}/deactivate`, { method: 'PUT' })
  if (!response.ok) throw new Error('Failed to deactivate medical aid')
}

export async function updateMedicalAid(id: string, name: string, code: string): Promise<void> {
  const response = await apiFetch(`/api/medical-aids/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, code }),
  })
  if (!response.ok) throw new Error('Failed to update medical aid')
}
