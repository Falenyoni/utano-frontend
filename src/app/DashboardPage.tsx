import { usePatients } from '@/features/patients/usePatients'

interface StatCardProps {
  label: string
  value: string
  hint?: string
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</div>}
    </div>
  )
}

export function DashboardPage() {
  const { data: totalData } = usePatients({ page: 1, pageSize: 1 })
  const { data: activeData } = usePatients({ page: 1, pageSize: 1, status: 'Active' })

  const totalCount = totalData?.totalCount
  const activeCount = activeData?.totalCount
  const inactiveCount =
    totalCount !== undefined && activeCount !== undefined ? totalCount - activeCount : undefined

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview for Acme Medical Practice
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Patients"
          value={totalCount !== undefined ? String(totalCount) : '—'}
          hint={
            activeCount !== undefined && inactiveCount !== undefined
              ? `${activeCount} active · ${inactiveCount} inactive`
              : 'Loading...'
          }
        />
        <StatCard label="Today's Appointments" value="—" hint="Not yet connected" />
        <StatCard label="Pending Sync" value="—" hint="Not yet connected" />
        <StatCard label="Active Staff" value="—" hint="Not yet connected" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Recent Activity
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Activity feed will appear here once connected to real data.
        </p>
      </div>
    </div>
  )
}