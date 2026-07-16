import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  type RoleRow,
} from './rbacApi'

const PERMISSION_GROUPS: Record<string, string> = {
  patients: 'Patients',
  appointments: 'Appointments',
  clinical_notes: 'Clinical Notes',
  inventory: 'Inventory',
  billing: 'Billing',
  reports: 'Reports',
  settings: 'Settings',
}

function groupPermissions(keys: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const key of keys) {
    const prefix = key.split('.')[0]
    if (!groups[prefix]) groups[prefix] = []
    groups[prefix].push(key)
  }
  return groups
}

function permissionLabel(key: string): string {
  return key.split('.')[1]?.replace(/_/g, ' ') ?? key
}

function PermissionGrid({
  allPermissions,
  selected,
  onChange,
  readOnly,
}: {
  allPermissions: string[]
  selected: string[]
  onChange?: (keys: string[]) => void
  readOnly?: boolean
}) {
  const groups = groupPermissions(allPermissions)
  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([group, keys]) => (
        <div key={group}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
            {PERMISSION_GROUPS[group] ?? group}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {keys.map((key) => (
              <label
                key={key}
                className={`flex items-center gap-1.5 text-sm ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={selected.includes(key)}
                  onChange={(e) => {
                    if (!onChange) return
                    onChange(
                      e.target.checked ? [...selected, key] : selected.filter((k) => k !== key),
                    )
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
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

const emptyForm = { name: '', description: '', permissions: [] as string[] }

export function RolesPage() {
  const qc = useQueryClient()
  const { data: roles = [], isLoading } = useQuery({ queryKey: ['roles'], queryFn: getRoles })
  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions,
  })

  const [showCreate, setShowCreate] = useState(false)
  const [editRole, setEditRole] = useState<RoleRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createRole({ name: form.name, description: form.description || null, permissions: form.permissions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setShowCreate(false)
      setForm(emptyForm)
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRole(editRole!.id, {
        name: editForm.name,
        description: editForm.description || null,
        permissions: editForm.permissions,
        isActive: editForm.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setEditRole(null)
    },
  })

  function openEdit(r: RoleRow) {
    setEditRole(r)
    setEditForm({
      name: r.name,
      description: r.description ?? '',
      permissions: [...r.permissions],
      isActive: r.isActive,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Roles &amp; Permissions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Define roles and control what each role can access
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          New Role
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {roles.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{r.name}</span>
                    {r.isSystem && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded font-medium">
                        System
                      </span>
                    )}
                    {!r.isActive && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{r.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.permissions.map((p) => (
                      <span
                        key={p}
                        className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(r)}
                  className="shrink-0 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">New Role</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Lab Technician"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permissions
                </label>
                <PermissionGrid
                  allPermissions={allPermissions}
                  selected={form.permissions}
                  onChange={(keys) => setForm({ ...form, permissions: keys })}
                />
              </div>
            </div>
            {createMutation.error && (
              <p className="text-sm text-red-600">{(createMutation.error as Error).message}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowCreate(false); setForm(emptyForm) }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={!form.name.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
              >
                {createMutation.isPending ? 'Creating…' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
              Edit — {editRole.name}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={editForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                  className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permissions
                </label>
                <PermissionGrid
                  allPermissions={allPermissions}
                  selected={editForm.permissions}
                  onChange={(keys) => setEditForm({ ...editForm, permissions: keys })}
                />
              </div>
            </div>
            {updateMutation.error && (
              <p className="text-sm text-red-600">{(updateMutation.error as Error).message}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditRole(null)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={!editForm.name.trim() || updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
