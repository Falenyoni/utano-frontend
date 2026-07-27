import { useAuth } from './AuthContext'

export function TrialBanner() {
  const { subscription } = useAuth()

  if (!subscription || subscription.status !== 'Trial' || !subscription.isTrialActive) return null

  const days = subscription.trialDaysLeft ?? 0
  const urgent = days <= 7

  return (
    <div
      className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium ${
        urgent
          ? 'bg-red-600 text-white'
          : 'bg-amber-500 text-white'
      }`}
    >
      <span>
        {days === 0
          ? 'Your trial expires today.'
          : `Your free trial ends in ${days} day${days === 1 ? '' : 's'}.`}
      </span>
      <span className="opacity-75">·</span>
      <a
        href="mailto:support@utano.app"
        className="underline underline-offset-2 hover:opacity-80"
      >
        Contact us to upgrade
      </a>
    </div>
  )
}
