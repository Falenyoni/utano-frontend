import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

export function PaywallScreen({ children }: { children: React.ReactNode }) {
  const { subscription, logout } = useAuth()
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const handler = () => setBlocked(true)
    window.addEventListener('utano:subscription_required', handler)
    return () => window.removeEventListener('utano:subscription_required', handler)
  }, [])

  // Also block immediately if we know at login that the subscription is inactive
  const isInactive = subscription && !subscription.isActive

  if (!blocked && !isInactive) return <>{children}</>

  const status = subscription?.status

  const heading =
    status === 'Cancelled' ? 'Subscription Cancelled' :
    status === 'PastDue'   ? 'Payment Overdue' :
                             'Trial Expired'

  const message =
    status === 'Cancelled'
      ? 'Your Utano subscription has been cancelled.'
      : status === 'PastDue'
      ? 'Your last payment failed. Please update your payment details to continue.'
      : 'Your 30-day free trial has ended.'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm w-full max-w-md p-8 space-y-6 text-center">
        <div className="text-5xl">🔒</div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{heading}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Available Plans
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-100">Starter</span>
              <span className="text-gray-500 dark:text-gray-400">$40 / month</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Patients, appointments, consultations · Admin + 3 staff
            </p>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="font-medium text-gray-900 dark:text-gray-100">Professional</span>
              <span className="text-gray-500 dark:text-gray-400">$75 / month</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              All modules · Unlimited users
            </p>
          </div>
        </div>

        <a
          href="mailto:support@utano.app?subject=Subscription%20Enquiry"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
        >
          Contact Us to Subscribe
        </a>

        <button
          onClick={logout}
          className="text-xs text-gray-400 dark:text-gray-500 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
