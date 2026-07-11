import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getServiceItems,
  createServiceItem,
  updateServiceItem,
  toggleServiceItem,
  type ServiceItemRow,
  type UpsertServiceItemBody,
} from './serviceItemsApi'

const CATEGORIES = ['Consultation', 'Procedure', 'Other'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_LABELS: Record<Category, string> = {
  Consultation: 'Consultations',
  Procedure: 'Procedures',
  Other: 'Other Services',
}

const APPOINTMENT_TYPE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'Consultation', label: 'General Consultation' },
  { value: 'FollowUp', label: 'Follow-up' },
  { value: 'WalkIn', label: 'Walk-in' },
  { value: 'Procedure', label: 'Procedure appointment' },
  { value: 'Vaccination', label: 'Vaccination' },
  { value: 'LabCollection', label: 'Lab collection' },
]

const EMPTY_FORM: UpsertServiceItemBody = {
  name: '',
  category: 'Consultation',
  defaultPrice: 0,
  nhrplCode: '',
  defaultIcdCode: '',
  appointmentTypeKey: '',
}

function ServiceItemModal({
  item,
  onClose,
  onSave,
  saving,
  error,
}: {
  item: ServiceItemRow | null
  onClose: () => void
  onSave: (body: UpsertServiceItemBody) => void
  saving: boolean
  error: string | null
}) {
  const [form, setForm] = useState<UpsertServiceItemBody>(
    item
      ? {
          name: item.name,
          category: item.category,
          defaultPrice: item.defaultPrice,
          nhrplCode: item.nhrplCode ?? '',
          defaultIcdCode: item.defaultIcdCode ?? '',
          appointmentTypeKey: item.appointmentTypeKey ?? '',
        }
      : { ...EMPTY_FORM },
  )

  function set<K extends keyof UpsertServiceItemBody>(key: K, val: UpsertServiceItemBody[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 sm:mx-0 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {item ? 'Edit Service Item' : 'Add Service Item'}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g. Minor Wound Dressing"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (R)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.defaultPrice}
                onChange={(e) => set('defaultPrice', Number(e.target.value))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NHRPL Code</label>
              <input
                value={form.nhrplCode ?? ''}
                onChange={(e) => set('nhrplCode', e.target.value || null)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="e.g. 0190"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default ICD-10</label>
              <input
                value={form.defaultIcdCode ?? ''}
                onChange={(e) => set('defaultIcdCode', e.target.value || null)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="e.g. Z00.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Auto-add for appointment type
            </label>
            <select
              value={form.appointmentTypeKey ?? ''}
              onChange={(e) => set('appointmentTypeKey', e.target.value || null)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {APPOINTMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              If set, this fee is automatically added to the invoice when that appointment type is opened as a visit.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim() || form.defaultPrice < 0}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-medium"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ServicePricingPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['service-items'], queryFn: getServiceItems })

  const [modal, setModal] = useState<'add' | ServiceItemRow | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const toggle = useMutation({
    mutationFn: ({ id, activate }: { id: string; activate: boolean }) => toggleServiceItem(id, activate),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-items'] }),
  })

  async function handleSave(body: UpsertServiceItemBody) {
    setSaveError(null)
    setSaving(true)
    try {
      if (typeof modal === 'string') {
        await createServiceItem(body)
      } else if (modal) {
        await updateServiceItem(modal.id, body)
      }
      qc.invalidateQueries({ queryKey: ['service-items'] })
      setModal(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const grouped = CATEGORIES.reduce<Record<Category, ServiceItemRow[]>>(
    (acc, cat) => {
      acc[cat] = (data ?? []).filter((s) => s.category === cat)
      return acc
    },
    { Consultation: [], Procedure: [], Other: [] },
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Service Price List</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Consultations, procedures, and other billable services with NHRPL codes and default prices.
          </p>
        </div>
        <button
          onClick={() => { setSaveError(null); setModal('add') }}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          + Add item
        </button>
      </div>

      {isLoading && (
        <div className="text-sm text-gray-400 py-8 text-center">Loading...</div>
      )}

      {!isLoading && CATEGORIES.map((cat) => {
        const items = grouped[cat]
        if (items.length === 0) return null
        return (
          <div key={cat}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">NHRPL</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">ICD-10</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Auto-add for</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Price</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 ${!item.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                        {item.name}
                        {item.isGlobal && (
                          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-normal">system</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                        {item.nhrplCode ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                        {item.defaultIcdCode ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {item.appointmentTypeKey
                          ? APPOINTMENT_TYPE_OPTIONS.find((o) => o.value === item.appointmentTypeKey)?.label ?? item.appointmentTypeKey
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                        R {item.defaultPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSaveError(null); setModal(item) }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggle.mutate({ id: item.id, activate: !item.isActive })}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                          >
                            {item.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {modal !== null && (
        <ServiceItemModal
          item={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
          error={saveError}
        />
      )}
    </div>
  )
}
