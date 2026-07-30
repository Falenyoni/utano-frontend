import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/shared/lib/auth/AuthContext'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { changePassword } from '@/features/auth/authApi'
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications/useNotifications'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [showChangePw, setShowChangePw] = useState(false)
  const [showNotifPrefs, setShowNotifPrefs] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user?.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <>
      <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            className="md:hidden p-2 -ml-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{user?.fullName}</p>
            {user && (
              <p className="text-xs leading-tight" style={{ color: 'var(--color-primary)' }}>
                {user.roles.length > 0 ? user.roles.join(', ') : user.role}
              </p>
            )}
          </div>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="User menu"
              className="h-8 w-8 rounded-full text-white flex items-center justify-center text-sm font-semibold shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              style={{ background: 'var(--color-primary)' }}
            >
              {initials}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); setShowChangePw(true) }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  Change Password
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setShowNotifPrefs(true) }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  Notification Preferences
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showChangePw && (
        <ChangePasswordModal onClose={() => setShowChangePw(false)} />
      )}

      {showNotifPrefs && (
        <NotificationPreferencesModal onClose={() => setShowNotifPrefs(false)} />
      )}
    </>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Change Password</h4>

        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-green-600 dark:text-green-400">Password changed successfully.</p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                required
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                required
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Min 8 chars, uppercase, lowercase, number.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !form.currentPassword || !form.newPassword || !form.confirmPassword}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
              >
                {loading ? 'Saving…' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function NotificationPreferencesModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useNotificationPreferences()
  const updatePreferences = useUpdateNotificationPreferences()

  const [inAppEnabled, setInAppEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!data) return
    setInAppEnabled(data.inAppEnabled)
    setEmailEnabled(data.emailEnabled)
    setSmsEnabled(data.smsEnabled)
    setWhatsAppEnabled(data.whatsAppEnabled)
  }, [data])

  async function handleSave() {
    setSaved(false)
    await updatePreferences.mutateAsync({ inAppEnabled, emailEnabled, smsEnabled, whatsAppEnabled })
    setSaved(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Notification Preferences</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Choose how you'd like to be notified about appointments assigned to you.
        </p>

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : (
          <div className="space-y-3">
            <PreferenceToggle
              label="In-app"
              description="Bell icon notifications while you're using Utano."
              checked={inAppEnabled}
              onChange={setInAppEnabled}
            />
            <PreferenceToggle
              label="Email"
              description="Coming soon."
              checked={emailEnabled}
              onChange={setEmailEnabled}
              disabled
            />
            <PreferenceToggle
              label="SMS"
              description="Coming soon."
              checked={smsEnabled}
              onChange={setSmsEnabled}
              disabled
            />
            <PreferenceToggle
              label="WhatsApp"
              description="Coming soon."
              checked={whatsAppEnabled}
              onChange={setWhatsAppEnabled}
              disabled
            />
          </div>
        )}

        {saved && !updatePreferences.isPending && (
          <p className="text-sm text-green-600 dark:text-green-400">Preferences saved.</p>
        )}
        {updatePreferences.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">Failed to save preferences.</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || updatePreferences.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
          >
            {updatePreferences.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
      />
      <span>
        <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
        <span className="block text-xs text-gray-400 dark:text-gray-500">{description}</span>
      </span>
    </label>
  )
}
