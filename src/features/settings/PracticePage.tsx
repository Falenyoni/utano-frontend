import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPractice, updatePractice, type UpdatePracticeRequest } from './practiceApi'

const inputClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

export function PracticePage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<UpdatePracticeRequest>({
    name: '',
    contactEmail: '',
    contactPhone: '',
    physicalAddress: '',
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: practice, isLoading } = useQuery({
    queryKey: ['practice'],
    queryFn: getPractice,
  })

  useEffect(() => {
    if (practice) {
      setForm({
        name: practice.name,
        contactEmail: practice.contactEmail,
        contactPhone: practice.contactPhone,
        physicalAddress: practice.physicalAddress,
      })
    }
  }, [practice])

  const mutation = useMutation({
    mutationFn: () => updatePractice(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice'] })
      setSaved(true)
      setError(null)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err: Error) => setError(err.message),
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    mutation.mutate()
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500 dark:text-gray-400 p-4">Loading...</div>
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Practice Details</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Update your practice information
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Practice Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="e.g. City Health Clinic"
            />
          </div>
          <div>
            <label className={labelClass}>Contact Email</label>
            <input
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="admin@clinic.com"
            />
          </div>
          <div>
            <label className={labelClass}>Contact Phone</label>
            <input
              name="contactPhone"
              type="tel"
              value={form.contactPhone}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="+27 11 000 0000"
            />
          </div>
          <div>
            <label className={labelClass}>Physical Address</label>
            <textarea
              name="physicalAddress"
              value={form.physicalAddress}
              onChange={handleChange}
              required
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="123 Main Street, Suburb, City, 1234"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Saved successfully
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
