import { useState } from 'react'
import { useMedicalAids, useAddMedicalAid, useToggleMedicalAid, useUpdateMedicalAid } from './useMedicalAids'
import type { MedicalAid } from './medicalAidsApi'

const inputClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

function AddSchemeModal({ onClose }: { onClose: () => void }) {
  const addMutation = useAddMedicalAid()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await addMutation.mutateAsync({ name: name.trim(), code: code.trim().toUpperCase() })
      onClose()
    } catch {
      setError('Failed to add scheme. Code may already exist.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Medical Aid Scheme</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Scheme Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premier Service Medical Aid Society" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Short Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. PSMAS" required className={`${inputClass} uppercase`} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Uppercase letters only — used as unique identifier</p>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={addMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {addMutation.isPending ? 'Adding...' : 'Add Scheme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditSchemeModal({ aid, onClose }: { aid: MedicalAid; onClose: () => void }) {
  const updateMutation = useUpdateMedicalAid()
  const [name, setName] = useState(aid.name)
  const [code, setCode] = useState(aid.code)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await updateMutation.mutateAsync({ id: aid.id, name: name.trim(), code: code.trim().toUpperCase() })
      onClose()
    } catch {
      setError('Failed to update scheme. Code may already be in use.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Medical Aid Scheme</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Scheme Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Short Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              required className={`${inputClass} uppercase`} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Uppercase letters only</p>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function MedicalAidsPage() {
  const { data: aids, isLoading, error } = useMedicalAids()
  const toggleMutation = useToggleMedicalAid()

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<MedicalAid | null>(null)

  if (isLoading) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
  if (error) return <div className="text-sm text-red-600 dark:text-red-400">Failed to load medical aids.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Aid Schemes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Schemes available for patient registration and billing
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Add Scheme
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {(aids?.length ?? 0) === 0 ? (
          <div className="p-6 text-sm text-gray-400 dark:text-gray-500 text-center">
            No schemes added yet. Add one to allow patients to select a medical aid.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Code</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {aids?.map((aid) => (
                <tr key={aid.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{aid.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{aid.code}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      aid.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {aid.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setEditing(aid)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: aid.id, activate: !aid.isActive })}
                        disabled={toggleMutation.isPending}
                        className={`text-xs hover:underline disabled:opacity-50 ${
                          aid.isActive
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {aid.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddSchemeModal onClose={() => setShowAdd(false)} />}
      {editing && <EditSchemeModal aid={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
