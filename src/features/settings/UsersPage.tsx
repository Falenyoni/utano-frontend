import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUsers,
  getRoles,
  createUser,
  assignUserRoles,
  deactivateUser,
  activateUser,
  type UserRow,
  type RoleRow,
} from './rbacApi'

const emptyCreate = { firstName: '', lastName: '', email: '', password: '', role: 'Receptionist' }

export function UsersPage() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: getRoles })

  const [showCreate, setShowCreate] = useState(false)
  const [assignUser, setAssignUser] = useState<UserRow | null>(null)
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([])
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [createError, setCreateError] = useState('')

  const createMutation = useMutation({
    mutationFn: () => createUser(createForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowCreate(false)
      setCreateForm(emptyCreate)
      setCreateError('')
    },
    onError: (e: Error) => setCreateError(e.message),
  })

  const assignMutation = useMutation({
    mutationFn: () => assignUserRoles(assignUser!.id, assignedRoleIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setAssignUser(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (u: UserRow) =>
      u.status === 'Active' ? deactivateUser(u.id) : activateUser(u.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  function openAssign(u: UserRow) {
    setAssignUser(u)
    setAssignedRoleIds([])
  }

  const activeRoles = roles.filter((r) => r.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Users</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage staff accounts and their role assignments
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          Add User
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {u.fullName}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        u.status === 'Active'
                          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openAssign(u)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                      >
                        Assign Roles
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(u)}
                        className="text-gray-500 hover:underline text-xs"
                      >
                        {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Add User</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name *
                </label>
                <input
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temporary Password *
              </label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role *
              </label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Admin">Admin</option>
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Billing">Billing</option>
              </select>
            </div>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowCreate(false); setCreateForm(emptyCreate); setCreateError('') }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={
                  !createForm.firstName || !createForm.lastName || !createForm.email ||
                  !createForm.password || createMutation.isPending
                }
                onClick={() => createMutation.mutate()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
              >
                {createMutation.isPending ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign roles modal */}
      {assignUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
              Assign Roles — {assignUser.fullName}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select roles to assign. This replaces any existing role assignments.
            </p>
            <div className="space-y-2">
              {activeRoles.map((r: RoleRow) => (
                <label key={r.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignedRoleIds.includes(r.id)}
                    onChange={(e) =>
                      setAssignedRoleIds(
                        e.target.checked
                          ? [...assignedRoleIds, r.id]
                          : assignedRoleIds.filter((id) => id !== r.id),
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-800 dark:text-gray-200">{r.name}</span>
                  {r.description && (
                    <span className="text-gray-400 dark:text-gray-500 text-xs">— {r.description}</span>
                  )}
                </label>
              ))}
            </div>
            {assignMutation.error && (
              <p className="text-sm text-red-600">{(assignMutation.error as Error).message}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setAssignUser(null)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={assignedRoleIds.length === 0 || assignMutation.isPending}
                onClick={() => assignMutation.mutate()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
              >
                {assignMutation.isPending ? 'Saving…' : 'Assign Roles'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
