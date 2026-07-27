import { useAuth } from '@/shared/lib/auth/AuthContext'

const STARTER_FEATURES = [
  'Appointments & scheduling',
  'Patient records',
  'Basic billing & invoicing',
  'Waiting room management',
  'Up to 5 staff accounts',
  'Email support',
]

const PROFESSIONAL_FEATURES = [
  'Everything in Starter',
  'Clinical notes & consultations',
  'Dispensary & inventory',
  'Medical aid claims',
  'Reports & analytics',
  'Unlimited staff accounts',
  'Branding customisation',
  'Priority support',
]

export function SubscriptionPage() {
  const { subscription, user } = useAuth()

  if (!subscription || !user) return null

  const trialEndFormatted = subscription.trialEndsAt
    ? subscription.trialEndsAt.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const statusLabel: Record<string, string> = {
    Trial: 'Free Trial',
    Active: 'Active',
    PastDue: 'Past Due',
    Cancelled: 'Cancelled',
  }

  const statusColor: Record<string, string> = {
    Trial: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    Active: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400',
    PastDue: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400',
    Cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Subscription</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Your current plan and available tiers
        </p>
      </div>

      {/* Current plan summary */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Current plan</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {subscription.tier}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              statusColor[subscription.status] ?? statusColor.Cancelled
            }`}
          >
            {statusLabel[subscription.status] ?? subscription.status}
          </span>
        </div>

        {subscription.status === 'Trial' && trialEndFormatted && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {subscription.isTrialActive ? (
              <>
                Trial ends{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {trialEndFormatted}
                </span>
                {subscription.trialDaysLeft !== null && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    ({subscription.trialDaysLeft} day{subscription.trialDaysLeft !== 1 ? 's' : ''} left)
                  </span>
                )}
              </>
            ) : (
              <span className="text-red-600 dark:text-red-400">Trial expired on {trialEndFormatted}</span>
            )}
          </div>
        )}

        {subscription.status === 'Active' && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your subscription is active. Contact us to change your plan.
          </p>
        )}

        <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            To upgrade, downgrade, or manage billing contact{' '}
            <a
              href="mailto:support@utano.app"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              support@utano.app
            </a>
          </p>
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">Available plans</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlanCard
            name="Starter"
            price={40}
            features={STARTER_FEATURES}
            isCurrent={subscription.tier === 'Starter'}
          />
          <PlanCard
            name="Professional"
            price={75}
            features={PROFESSIONAL_FEATURES}
            isCurrent={subscription.tier === 'Professional'}
            highlight
          />
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  name,
  price,
  features,
  isCurrent,
  highlight = false,
}: {
  name: string
  price: number
  features: string[]
  isCurrent: boolean
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-5 space-y-4 relative ${
        highlight
          ? 'border-blue-500 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
      }`}
    >
      {highlight && (
        <span className="absolute top-4 right-4 text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
          Recommended
        </span>
      )}

      {isCurrent && (
        <span className="absolute top-4 left-4 text-xs font-semibold bg-green-600 text-white px-2 py-0.5 rounded-full">
          Current
        </span>
      )}

      <div className={isCurrent ? 'pt-5' : ''}>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{name}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">${price}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">/ month</span>
        </div>
      </div>

      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <svg
              className="w-4 h-4 mt-0.5 shrink-0 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
