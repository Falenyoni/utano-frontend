import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface StaffUser {
  id: string
  fullName: string
  email: string
  role: string
  status: string
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
}

export const ROLES = ['Doctor', 'Receptionist', 'Billing', 'Admin'] as const
export type Role = (typeof ROLES)[number]

export async function getUsers(role?: string): Promise<StaffUser[]> {
  const query = role ? `?role=${role}` : ''
  const res = await apiFetch(`/api/users${query}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function createUser(request: CreateUserRequest): Promise<StaffUser> {
  const res = await apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail ?? 'Failed to create user')
  }
  return res.json()
}

export async function deactivateUser(id: string): Promise<void> {
  const res = await apiFetch(`/api/users/${id}/deactivate`, { method: 'PUT' })
  if (!res.ok) throw new Error('Failed to deactivate user')
}
