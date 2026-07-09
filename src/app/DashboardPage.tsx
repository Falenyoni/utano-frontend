interface StatCardProps {
  label: string
  value: string
  hint?: string
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  )
}

export function DashboardPage() {


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Overview for Acme Medical Practice
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value="—" hint="Not yet connected" />
        <StatCard label="Today's Appointments" value="—" hint="Not yet connected" />
        <StatCard label="Pending Sync" value="—" hint="Not yet connected" />
        <StatCard label="Active Staff" value="—" hint="Not yet connected" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Recent Activity
        </h3>
        <p className="text-sm text-gray-400">
          Activity feed will appear here once connected to real data.
        </p>
      </div>
    </div>
  )
}