import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface ServiceItemRow {
  id: string
  practiceId: string | null
  name: string
  category: 'Consultation' | 'Procedure' | 'Other'
  defaultPrice: number
  nhrplCode: string | null
  defaultIcdCode: string | null
  appointmentTypeKey: string | null
  isActive: boolean
  isGlobal: boolean
}

export interface UpsertServiceItemBody {
  name: string
  category: string
  defaultPrice: number
  nhrplCode?: string | null
  defaultIcdCode?: string | null
  appointmentTypeKey?: string | null
}

export async function getServiceItems(): Promise<ServiceItemRow[]> {
  const res = await apiFetch('/api/settings/service-items', { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch service items')
  return res.json()
}

export async function createServiceItem(body: UpsertServiceItemBody): Promise<ServiceItemRow> {
  const res = await apiFetch('/api/settings/service-items', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to create service item')
  return res.json()
}

export async function updateServiceItem(id: string, body: UpsertServiceItemBody): Promise<ServiceItemRow> {
  const res = await apiFetch(`/api/settings/service-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to update service item')
  return res.json()
}

export async function toggleServiceItem(id: string, activate: boolean): Promise<void> {
  const action = activate ? 'activate' : 'deactivate'
  const res = await apiFetch(`/api/settings/service-items/${id}/${action}`, { method: 'PATCH' })
  if (!res.ok) throw new Error(`Failed to ${action} service item`)
}
