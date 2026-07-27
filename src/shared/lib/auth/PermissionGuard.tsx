import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'

export function PermissionGuard({ permission, children }: { permission: string | string[]; children: ReactNode }) {
  const { hasPermission } = useAuth()

  const allowed = Array.isArray(permission)
    ? permission.some((p) => hasPermission(p))
    : hasPermission(permission)

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Access Denied</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
          You don't have permission to view this page. Contact your administrator if you need access.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
