import type { ReactNode } from 'react'
import { useFeatures } from './FeaturesContext'

export function FeatureGuard({ feature, children }: { feature: string; children: ReactNode }) {
  const { hasFeature } = useFeatures()
  if (!hasFeature(feature)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Feature Not Available</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
          This feature is not enabled for your practice. Contact your administrator to upgrade.
        </p>
      </div>
    )
  }
  return <>{children}</>
}
