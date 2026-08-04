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

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'

const labelClass =
  'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

export function SetupPage() {
  const navigate = useNavigate()
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
      const result = await createPractice(form)
      setSuccess({ practiceId: result.practiceId, practiceName: result.practiceName })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 w-full max-w-md space-y-4">
          <div className="text-green-500 text-4xl text-center">✓</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">Practice Created</h1>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm space-y-3">
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">Practice</span>
              <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{success.practiceName}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">Practice ID</span>
              <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all mt-0.5">{success.practiceId}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            The admin can now log in with their email and password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm w-full max-w-lg p-8 space-y-6"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Start your free trial</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">30 days of full Professional access, no card required. Creates your practice and admin account.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Practice Details
          </h2>
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
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Admin Account
          </h2>
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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating…' : 'Create Practice'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
