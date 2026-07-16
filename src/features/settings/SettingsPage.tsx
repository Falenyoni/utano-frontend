import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUsers, createUser, updateUser, assignUserRoles, deactivateUser, activateUser,
  getRoles, createRole, updateRole, getPermissions,
  getBranding, updateBranding as updateBrandingApi,
  type UserRow, type RoleRow,
} from './rbacApi'
import { useAuth } from '@/shared/lib/auth/AuthContext'
import { DoctorsPage } from '@/features/doctors/DoctorsPage'
import { MedicalAidsPage } from '@/features/medicalAids/MedicalAidsPage'
import { ServicePricingPage } from './ServicePricingPage'
import { PracticePage } from './PracticePage'

// ── Shared style tokens ───────────────────────────────────────────────────────

const inputCls =
  'w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
const ROLE_BADGE =
  'px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'

// ── Permission helpers ────────────────────────────────────────────────────────

const PERMISSION_GROUP_LABELS: Record<string, string> = {
  patients: 'Patients',
  appointments: 'Appointments',
  clinical_notes: 'Clinical Notes',
  inventory: 'Inventory',
  billing: 'Billing',
  reports: 'Reports',
  settings: 'Settings',
}

function groupPermissions(keys: string[]): Record<string, string[]> {
  return keys.reduce<Record<string, string[]>>((acc, key) => {
    const [group] = key.split('.')
    ;(acc[group] ??= []).push(key)
    return acc
  }, {})
}

function permissionLabel(key: string): string {
  return key.split('.').slice(1).join(' ').replace(/_/g, ' ')
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

const ROLES = ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Billing']
const emptyCreate = { firstName: '', lastName: '', email: '', password: '', role: 'Receptionist' }

function UsersTab({ roles }: { roles: RoleRow[] }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: '' })
  const [assignUser, setAssignUser] = useState<UserRow | null>(null)
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([])

  const { data: allUsers = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const users = search
    ? allUsers.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : allUsers

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })

  const create = useMutation({
    mutationFn: () => createUser(createForm),
    onSuccess: () => { setShowCreate(false); setCreateForm(emptyCreate); invalidate() },
  })

  const save = useMutation({
    mutationFn: () => updateUser(editUser!.id, editForm),
    onSuccess: () => { setEditUser(null); invalidate() },
  })

  const assignRoles = useMutation({
    mutationFn: () => assignUserRoles(assignUser!.id, assignedRoleIds),
    onSuccess: () => { setAssignUser(null); invalidate() },
  })

  const toggle = useMutation({
    mutationFn: (u: UserRow) => u.status === 'Active' ? deactivateUser(u.id) : activateUser(u.id),
    onSuccess: invalidate,
  })

  function openEdit(u: UserRow) {
    const [firstName = '', ...rest] = u.fullName.split(' ')
    setEditUser(u)
    setEditForm({ firstName, lastName: rest.join(' '), role: u.role })
  }

  function openAssign(u: UserRow) {
    setAssignUser(u)
    setAssignedRoleIds([])
  }

  const toggleAssignRole = (id: string) =>
    setAssignedRoleIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const canCreate =
    createForm.firstName && createForm.lastName && createForm.email && createForm.password && createForm.role

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <input
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} max-w-sm`}
        />
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add User
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Joined', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {u.fullName}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={ROLE_BADGE}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'Active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => openAssign(u)}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Roles
                      </button>
                      <button
                        onClick={() => openEdit(u)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggle.mutate(u)}
                        disabled={toggle.isPending}
                        className={`text-xs hover:underline ${u.status === 'Active' ? 'text-red-500' : 'text-green-600'}`}
                      >
                        {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add User</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First Name *</label>
                <input
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Last Name *</label>
                <input
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Temporary Password *</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Role *</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                className={inputCls}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {create.isError && <p className="text-sm text-red-500">{String(create.error)}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending || !canCreate}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {create.isPending ? 'Creating…' : 'Create User'}
              </button>
              <button
                onClick={() => { setShowCreate(false); setCreateForm(emptyCreate) }}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit User</h3>
              <p className="text-xs text-gray-400">{editUser.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First Name</label>
                <input
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                className={inputCls}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {save.isError && <p className="text-sm text-red-500">{String(save.error)}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {save.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditUser(null)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Roles Modal */}
      {assignUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Roles</h3>
              <p className="text-xs text-gray-400">
                {assignUser.fullName} · {assignUser.email}
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
              {roles.filter((r) => r.isActive).map((r) => (
                <label
                  key={r.id}
                  className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={assignedRoleIds.includes(r.id)}
                    onChange={() => toggleAssignRole(r.id)}
                    className="mt-0.5 rounded border-gray-300"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.name}</p>
                    {r.description && <p className="text-xs text-gray-400">{r.description}</p>}
                  </div>
                </label>
              ))}
            </div>
            {assignRoles.isError && (
              <p className="text-sm text-red-500">{String(assignRoles.error)}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => assignRoles.mutate()}
                disabled={assignRoles.isPending || assignedRoleIds.length === 0}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {assignRoles.isPending ? 'Saving…' : 'Save Roles'}
              </button>
              <button
                onClick={() => setAssignUser(null)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Roles Tab ─────────────────────────────────────────────────────────────────

const emptyRole = { name: '', description: '', permissions: [] as string[], isActive: true }

function RolesTab({ allPermissions }: { allPermissions: string[] }) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(emptyRole)
  const [editRole, setEditRole] = useState<RoleRow | null>(null)
  const [editForm, setEditForm] = useState(emptyRole)

  const { data: roles = [], isLoading } = useQuery({ queryKey: ['roles'], queryFn: getRoles })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['roles'] })

  const create = useMutation({
    mutationFn: () => createRole({ name: createForm.name, description: createForm.description || null, permissions: createForm.permissions }),
    onSuccess: () => { setShowCreate(false); setCreateForm(emptyRole); invalidate() },
  })

  const save = useMutation({
    mutationFn: () =>
      updateRole(editRole!.id, {
        name: editForm.name,
        description: editForm.description || null,
        permissions: editForm.permissions,
        isActive: editForm.isActive,
      }),
    onSuccess: () => { setEditRole(null); invalidate() },
  })

  function openEdit(r: RoleRow) {
    setEditRole(r)
    setEditForm({ name: r.name, description: r.description ?? '', permissions: [...r.permissions], isActive: r.isActive })
  }

  const grouped = groupPermissions(allPermissions)

  const togglePermCreate = (key: string) =>
    setCreateForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }))

  const togglePermEdit = (key: string) =>
    setEditForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }))

  function PermissionGrid({
    selected,
    onToggle,
  }: {
    selected: string[]
    onToggle: (key: string) => void
  }) {
    return (
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {Object.entries(grouped).map(([group, keys]) => (
          <div key={group}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {PERMISSION_GROUP_LABELS[group] ?? group}
            </p>
            <div className="space-y-1">
              {keys.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(key)}
                    onChange={() => onToggle(key)}
                    className="rounded border-gray-300"
                  />
                  <span className="capitalize text-gray-700 dark:text-gray-300">
                    {permissionLabel(key)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + New Role
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="grid gap-3">
          {roles.map((r) => (
            <div
              key={r.id}
              className={`bg-white dark:bg-gray-900 rounded-lg border p-4 ${
                r.isActive
                  ? 'border-gray-200 dark:border-gray-800'
                  : 'border-gray-100 dark:border-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{r.name}</h4>
                    {r.isSystem && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        System
                      </span>
                    )}
                    {!r.isActive && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                  )}
                </div>
                <button
                  onClick={() => openEdit(r)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-4"
                >
                  Edit
                </button>
              </div>
              {r.permissions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.permissions.map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Role</h3>
            <div>
              <label className={labelCls}>Role Name *</label>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
                placeholder="e.g. Lab Technician"
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                className={inputCls}
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className={labelCls}>Permissions</label>
              <PermissionGrid selected={createForm.permissions} onToggle={togglePermCreate} />
            </div>
            {create.isError && <p className="text-sm text-red-500">{String(create.error)}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending || !createForm.name}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {create.isPending ? 'Creating…' : 'Create Role'}
              </button>
              <button
                onClick={() => { setShowCreate(false); setCreateForm(emptyRole) }}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Role</h3>
            <div>
              <label className={labelCls}>Role Name *</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={editForm.isActive ? 'Active' : 'Inactive'}
                onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.value === 'Active' }))}
                className={inputCls}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Permissions</label>
              <PermissionGrid selected={editForm.permissions} onToggle={togglePermEdit} />
            </div>
            {save.isError && <p className="text-sm text-red-500">{String(save.error)}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => save.mutate()}
                disabled={save.isPending || !editForm.name}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {save.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditRole(null)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Branding Tab ──────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9',
  '#1d4ed8', '#111827',
]

function BrandingTab() {
  const { user, updateBranding } = useAuth()
  const qc = useQueryClient()

  const { data: branding } = useQuery({ queryKey: ['branding'], queryFn: getBranding })

  const [primaryColor, setPrimaryColor] = useState(user?.primaryColor ?? '#3b82f6')
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.logoBase64 ?? null)
  // null = unchanged, '' = clear, '<data:...>' = new file
  const [logoBase64, setLogoBase64] = useState<string | null>(null)

  // Keep a ref so onSuccess always reads the latest value without stale closure
  const logoBase64Ref = useRef(logoBase64)
  useEffect(() => { logoBase64Ref.current = logoBase64 }, [logoBase64])

  // Sync logo preview from API (covers sessions that pre-date branding)
  useEffect(() => {
    if (branding?.logoBase64 && !logoBase64) {
      setLogoPreview(branding.logoBase64)
    }
  }, [branding?.logoBase64, logoBase64])

  // Sync initial color from API
  useEffect(() => {
    if (branding?.primaryColor) {
      setPrimaryColor(branding.primaryColor)
    }
  }, [branding?.primaryColor])

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2_000_000) { alert('Logo must be under 2 MB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setLogoPreview(result)
      setLogoBase64(result)
    }
    reader.readAsDataURL(file)
  }

  const save = useMutation({
    mutationFn: () => {
      const current = logoBase64Ref.current
      return updateBrandingApi({
        primaryColor,
        // null = clear, undefined = keep existing (omitted from JSON), string = new logo
        logoBase64: current === '' ? null : (current ?? undefined),
      })
    },
    onSuccess: () => {
      const current = logoBase64Ref.current
      // Determine what logo is now in effect after save
      const resolvedLogo =
        current === '' ? null
        : current !== null ? current
        : branding?.logoBase64 ?? user?.logoBase64 ?? null
      updateBranding(primaryColor, resolvedLogo)
      qc.invalidateQueries({ queryKey: ['branding'] })
    },
  })

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Branding</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Customise how your practice appears in the app.
        </p>
      </div>

      {/* Logo */}
      <div className="space-y-3">
        <label className={labelCls}>Practice Logo</label>
        <div className="flex items-center gap-6">
          <div className="shrink-0 flex flex-col items-center gap-2">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
              />
            ) : (
              <div className="h-20 w-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <span className="text-xs text-gray-400 text-center px-2">No logo</span>
              </div>
            )}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[96px] text-center">
              {user?.practiceName}
            </span>
          </div>
          <div className="space-y-2">
            <label className="cursor-pointer inline-flex px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Upload logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleFile}
                className="sr-only"
              />
            </label>
            {logoPreview && (
              <button
                onClick={() => { setLogoPreview(null); setLogoBase64('') }}
                className="block text-xs text-red-500 hover:underline"
              >
                Remove logo
              </button>
            )}
            <p className="text-xs text-gray-400">PNG, SVG or JPEG · max 2 MB</p>
          </div>
        </div>
      </div>

      {/* Primary colour */}
      <div className="space-y-3">
        <label className={labelCls}>Primary Colour</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setPrimaryColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                primaryColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
              }`}
              style={{ background: c }}
            />
          ))}
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border border-gray-300 dark:border-gray-600 p-0.5 bg-transparent"
            title="Custom colour"
          />
        </div>
        <p className="text-xs text-gray-400">
          Selected: <code className="font-mono">{primaryColor}</code>
        </p>
      </div>

      {/* Live preview */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
          Preview — Sidebar header
        </div>
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
          <div className="flex flex-col items-center gap-1.5 py-3 px-4 border border-gray-100 dark:border-gray-800 rounded-lg">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ background: primaryColor }}
              >
                {user?.practiceName?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate">
              {user?.practiceName}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ background: primaryColor }}
            >
              Primary button
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-sm font-medium border"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              Outline button
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: primaryColor }} />
            <span className="text-gray-700 dark:text-gray-300">Active nav item</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
        style={{ background: primaryColor }}
      >
        {save.isPending ? 'Saving…' : 'Save Branding'}
      </button>
      {save.isError && <p className="text-xs text-red-500 mt-2">{String(save.error)}</p>}
      {save.isSuccess && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
          Branding saved — changes apply immediately.
        </p>
      )}
    </div>
  )
}

// ── Tab groups ────────────────────────────────────────────────────────────────

type Tab = 'users' | 'roles' | 'staff' | 'medical-aids' | 'service-pricing' | 'practice' | 'branding'

const TAB_GROUPS: { label: string; tabs: { id: Tab; label: string }[] }[] = [
  {
    label: 'Access',
    tabs: [
      { id: 'users', label: 'Users' },
      { id: 'roles', label: 'Roles & Permissions' },
    ],
  },
  {
    label: 'Clinical',
    tabs: [
      { id: 'staff', label: 'Staff & Doctors' },
      { id: 'medical-aids', label: 'Medical Aid Schemes' },
    ],
  },
  {
    label: 'Billing',
    tabs: [{ id: 'service-pricing', label: 'Service Pricing' }],
  },
  {
    label: 'Practice',
    tabs: [
      { id: 'practice', label: 'Practice Details' },
      { id: 'branding', label: 'Branding' },
    ],
  },
]

// ── SettingsPage ──────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('users')

  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: getRoles })
  const { data: allPermissions = [] } = useQuery({ queryKey: ['permissions'], queryFn: getPermissions })

  const tabCls = (t: Tab) =>
    `px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
      tab === t
        ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm border border-gray-200 dark:border-gray-800'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
    }`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Users, roles, clinical staff and practice configuration
        </p>
      </div>

      <div className="flex flex-wrap gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
        {TAB_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
              {group.label}
            </span>
            <div className="flex flex-wrap gap-1">
              {group.tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={tabCls(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {tab === 'users'           && <UsersTab roles={roles} />}
      {tab === 'roles'           && <RolesTab allPermissions={allPermissions} />}
      {tab === 'staff'           && <DoctorsPage />}
      {tab === 'medical-aids'    && <MedicalAidsPage />}
      {tab === 'service-pricing' && <ServicePricingPage />}
      {tab === 'practice'        && <PracticePage />}
      {tab === 'branding'        && <BrandingTab />}
    </div>
  )
}
