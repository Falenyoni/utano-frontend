import { useState } from 'react'
import { useAuth } from './AuthContext'

export function TrialBanner() {
  const { subscription } = useAuth()

  if (!subscription || subscription.status !== 'Trial' || !subscription.isTrialActive) return null

  const days = subscription.trialDaysLeft ?? 0
  const urgent = days <= 7

  return (
    <div
      className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium ${
        urgent ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
      }`}
    >
      <span>
        {days === 0
          ? 'Your trial expires today.'
          : `Your free trial ends in ${days} day${days === 1 ? '' : 's'}.`}
      </span>
      <span className="opacity-75">·</span>
      <a href="mailto:support@utano.app" className="underline underline-offset-2 hover:opacity-80">
        Contact us to upgrade
      </a>
    </div>
  )
}

export function TrialExpiredBanner() {
  const { subscription } = useAuth()
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('utano_trial_expired_dismissed') === '1',
  )

  const isExpiredStarter =
    subscription?.status === 'Active' &&
    subscription.tier === 'Starter' &&
    subscription.trialEndsAt !== null &&
    subscription.trialEndsAt < new Date()

  if (!isExpiredStarter || dismissed) return null

  function dismiss() {
    sessionStorage.setItem('utano_trial_expired_dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-2 bg-blue-600 text-white text-xs font-medium">
      <span>
        Your free trial has ended. You're now on the{' '}
        <span className="font-semibold">Starter plan</span>.{' '}
        <a href="mailto:support@utano.app" className="underline underline-offset-2 hover:opacity-80">
          Contact us to upgrade to Professional.
        </a>
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 opacity-75 hover:opacity-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
