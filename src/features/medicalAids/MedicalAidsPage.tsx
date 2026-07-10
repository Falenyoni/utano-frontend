import { useState } from 'react'
import { useMedicalAids, useAddMedicalAid, useToggleMedicalAid } from './useMedicalAids'

export function MedicalAidsPage() {
  const { data: aids, isLoading, error } = useMedicalAids()
  const addMutation = useAddMedicalAid()
  const toggleMutation = useToggleMedicalAid()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    try {
      await addMutation.mutateAsync({ name: name.trim(), code: code.trim().toUpperCase() })
      setName('')
      setCode('')
      setShowForm(false)
    } catch {
      setFormError('Failed to add medical aid. Code may already exist.')
    }
  }

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading...</div>
  if (error) return <div className="p-6 text-sm text-red-600">Failed to load medical aids.</div>

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Medical Aid Schemes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage which schemes patients can select during registration.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Scheme
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
        >
          <h2 className="text-sm font-medium text-gray-700">New Medical Aid Scheme</h2>
          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. PSMAS"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. PSMAS"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm uppercase"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(null) }}
              className="text-sm text-gray-600 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {addMutation.isPending ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {aids?.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">
                  No medical aid schemes added yet.
                </td>
              </tr>
            )}
            {aids?.map((aid) => (
              <tr key={aid.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{aid.name}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{aid.code}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      aid.isActive
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {aid.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      toggleMutation.mutate({ id: aid.id, activate: !aid.isActive })
                    }
                    disabled={toggleMutation.isPending}
                    className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {aid.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
