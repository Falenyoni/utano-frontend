import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { createPractice } from './setupApi'

interface Field {
  label: string
  key: string
  type?: string
  placeholder?: string
}

const PRACTICE_FIELDS: Field[] = [
  { label: 'Practice Name', key: 'name', placeholder: 'e.g. Westgate Clinic' },
  { label: 'Contact Email', key: 'contactEmail', type: 'email', placeholder: 'admin@clinic.co.zw' },
  { label: 'Contact Phone', key: 'contactPhone', placeholder: '+263 77 123 4567' },
  { label: 'Physical Address', key: 'physicalAddress', placeholder: '14 Westgate Drive, Harare' },
]

const ADMIN_FIELDS: Field[] = [
  { label: 'First Name', key: 'adminFirstName' },
  { label: 'Last Name', key: 'adminLastName' },
  { label: 'Email', key: 'adminEmail', type: 'email' },
  { label: 'Password', key: 'adminPassword', type: 'password' },
]

type FormState = {
  name: string
  contactEmail: string
  contactPhone: string
  physicalAddress: string
  adminFirstName: string
  adminLastName: string
  adminEmail: string
  adminPassword: string
}

const EMPTY: FormState = {
  name: '', contactEmail: '', contactPhone: '', physicalAddress: '',
  adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: '',
}

export function SetupPage() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ practiceId: string; practiceName: string } | null>(null)

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createPractice(form, apiKey)
      setSuccess({ practiceId: result.practiceId, practiceName: result.practiceName })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-md space-y-4">
          <div className="text-green-600 text-4xl text-center">✓</div>
          <h1 className="text-xl font-bold text-gray-900 text-center">Practice Created</h1>
          <div className="bg-gray-50 rounded-md p-4 text-sm space-y-2">
            <div>
              <span className="text-gray-500">Practice</span>
              <p className="font-medium text-gray-900">{success.practiceName}</p>
            </div>
            <div>
              <span className="text-gray-500">Practice ID</span>
              <p className="font-mono text-xs text-gray-700 break-all">{success.practiceId}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            The admin can now log in with their email and password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-8 space-y-6"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Register New Practice</h1>
          <p className="text-sm text-gray-500 mt-1">Creates the practice and its first admin account.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Practice Details</h2>
          <div className="grid grid-cols-2 gap-3">
            {PRACTICE_FIELDS.map(({ label, key, type, placeholder }) => (
              <div key={key} className={key === 'physicalAddress' ? 'col-span-2' : ''}>
                <label className={labelClass}>{label}</label>
                <input
                  type={type ?? 'text'}
                  value={form[key as keyof FormState]}
                  onChange={(e) => set(key as keyof FormState, e.target.value)}
                  placeholder={placeholder}
                  className={inputClass}
                  required
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Admin Account</h2>
          <div className="grid grid-cols-2 gap-3">
            {ADMIN_FIELDS.map(({ label, key, type }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input
                  type={type ?? 'text'}
                  value={form[key as keyof FormState]}
                  onChange={(e) => set(key as keyof FormState, e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-t border-gray-100 pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Authorization</h2>
          <div>
            <label className={labelClass}>Admin API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter the setup API key"
              className={inputClass}
              required
            />
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Practice'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
