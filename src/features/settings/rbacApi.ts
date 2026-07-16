import { apiFetch } from '@/shared/lib/api/apiFetch'

// ── Branding ──────────────────────────────────────────────────────────────────

export interface BrandingDto {
  practiceName: string
  primaryColor: string | null
  logoBase64: string | null
}

export async function getBranding(): Promise<BrandingDto> {
  const res = await apiFetch('/api/branding')
  if (!res.ok) throw new Error('Failed to load branding')
  return res.json()
}

export async function updateBranding(data: {
  primaryColor: string | null
  logoBase64?: string | null
}): Promise<void> {
  const res = await apiFetch('/api/branding', { method: 'POST', body: JSON.stringify(data) })
  if (!res.ok) throw new Error('Failed to save branding')
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export interface RoleRow {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  isActive: boolean
  permissions: string[]
}

export interface UserRow {
  id: string
  fullName: string
  email: string
  role: string
  status: string
  createdAt: string
}

export interface CreateRoleRequest {
  name: string
  description: string | null
  permissions: string[]
}

export interface UpdateRoleRequest {
  name: string
  description: string | null
  permissions: string[]
  isActive: boolean
}

export async function getRoles(): Promise<RoleRow[]> {
  const res = await apiFetch('/api/roles', { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch roles')
  return res.json()
}

export async function createRole(body: CreateRoleRequest): Promise<string> {
  const res = await apiFetch('/api/roles', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail ?? 'Failed to create role')
  }
  return res.json()
}

export async function updateRole(id: string, body: UpdateRoleRequest): Promise<void> {
  const res = await apiFetch(`/api/roles/${id}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail ?? 'Failed to update role')
  }
}

export async function getPermissions(): Promise<string[]> {
  const res = await apiFetch('/api/permissions', { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch permissions')
  return res.json()
}

export async function getUsers(): Promise<UserRow[]> {
  const res = await apiFetch('/api/users', { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
}

export async function createUser(body: CreateUserRequest): Promise<UserRow> {
  const res = await apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail ?? 'Failed to create user')
  }
  return res.json()
}

export async function assignUserRoles(userId: string, roleIds: string[]): Promise<void> {
  const res = await apiFetch(`/api/users/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ roleIds }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail ?? 'Failed to assign roles')
  }
}

export async function updateUser(
  userId: string,
  body: { firstName: string; lastName: string; role: string },
): Promise<void> {
  const res = await apiFetch(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail ?? 'Failed to update user')
  }
}

export async function deactivateUser(userId: string): Promise<void> {
  const res = await apiFetch(`/api/users/${userId}/deactivate`, { method: 'PUT' })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail ?? 'Failed to deactivate user')
  }
}

export async function activateUser(userId: string): Promise<void> {
  const res = await apiFetch(`/api/users/${userId}/activate`, { method: 'PUT' })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail ?? 'Failed to activate user')
  }
}
