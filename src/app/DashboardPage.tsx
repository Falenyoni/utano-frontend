import { Link } from 'react-router'
import { usePatients } from '@/features/patients/usePatients'
import { useAppointments } from '@/features/appointments/useAppointments'
import { useVisits } from '@/features/consultations/useVisits'
import { useQuery } from '@tanstack/react-query'
import { getInvoices } from '@/features/billing/billingApi'
import { getStockItems } from '@/features/inventory/inventoryApi'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function StatCard({
  label, value, sub, to, color = 'text-gray-900 dark:text-gray-100',
}: {
  label: string
  value: string | number | undefined
  sub?: string
  to?: string
  color?: string
}) {
  const content = (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-1 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-400',
  Confirmed: 'bg-indigo-400',
  InProgress: 'bg-yellow-400',
  Completed: 'bg-green-500',
  Cancelled: 'bg-red-400',
  NoShow: 'bg-orange-400',
}

const STATUS_LABELS: Record<string, string> = {
  Scheduled: 'Waiting',
  Confirmed: 'Confirmed',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  NoShow: 'No Show',
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0 text-right">{d.label}</span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 overflow-hidden">
            <div
              className={`h-full rounded-full ${d.color} transition-all duration-500`}
              style={{ width: `${(d.value / max) * 100}%`, minWidth: d.value > 0 ? '1.5rem' : 0 }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

function currentTimeStr() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`
}

export function DashboardPage() {
  const today = todayISO()

  const { data: totalPatients } = usePatients({ page: 1, pageSize: 1 })
  const { data: activePatients } = usePatients({ page: 1, pageSize: 1, status: 'Active' })
  const { data: todayAppts } = useAppointments({ date: today, pageSize: 200 })
  const { data: waitingAppts } = useAppointments({ date: today, status: 'Scheduled', pageSize: 1 })
  const { data: inProgressAppts } = useAppointments({ date: today, status: 'InProgress', pageSize: 1 })
  const { data: todayVisits } = useVisits({ date: today, pageSize: 5 })
  const { data: outstandingInvoices } = useQuery({
    queryKey: ['invoices', 'outstanding'],
    queryFn: () => getInvoices({ status: 'Issued', pageSize: 1 }),
  })
  const { data: lowStock } = useQuery({
    queryKey: ['stock-items', 'low-stock'],
    queryFn: () => getStockItems({ lowStockOnly: true, activeOnly: true, pageSize: 1 }),
  })

  const totalCount = totalPatients?.totalCount
  const activeCount = activePatients?.totalCount

  // Appointment status breakdown for chart
  const statusCounts: Record<string, number> = {}
  for (const appt of todayAppts?.data ?? []) {
    statusCounts[appt.status] = (statusCounts[appt.status] ?? 0) + 1
  }
  const chartData = ['Scheduled', 'InProgress', 'Completed', 'Cancelled', 'NoShow']
    .filter((s) => (statusCounts[s] ?? 0) > 0 || s === 'Scheduled')
    .map((s) => ({
      label: STATUS_LABELS[s],
      value: statusCounts[s] ?? 0,
      color: STATUS_COLORS[s],
    }))

  // Overdue: scheduled/confirmed appointments whose start time has passed
  const nowStr = currentTimeStr()
  const overdueCount = (todayAppts?.data ?? []).filter(
    (a) => (a.status === 'Scheduled' || a.status === 'Confirmed') && a.startTime < nowStr,
  ).length
  const noShowCount = statusCounts['NoShow'] ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{today}</p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Patients"
          value={totalCount}
          sub={activeCount !== undefined ? `${activeCount} active` : undefined}
          to="/patients"
        />
        <StatCard
          label="Today's Appointments"
          value={todayAppts?.totalCount}
          sub={todayAppts ? `${Object.keys(statusCounts).length} statuses` : undefined}
          to="/appointments"
        />
        <StatCard
          label="Waiting Now"
          value={waitingAppts?.totalCount}
          sub={inProgressAppts?.totalCount ? `${inProgressAppts.totalCount} with doctor` : 'None in progress'}
          to="/waiting-room"
          color={(waitingAppts?.totalCount ?? 0) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}
        />
        <StatCard
          label="Today's Visits"
          value={todayVisits?.totalCount}
          sub="Consultations opened"
          to="/consultations"
        />
      </div>

      {/* Alert stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Overdue"
          value={overdueCount}
          sub="Scheduled but time has passed"
          to="/appointments"
          color={overdueCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-gray-100'}
        />
        <StatCard
          label="No Shows"
          value={noShowCount}
          sub="Today"
          to="/appointments"
          color={noShowCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}
        />
        <StatCard
          label="Outstanding Invoices"
          value={outstandingInvoices?.totalCount}
          sub="Issued, awaiting payment"
          to="/billing"
          color={(outstandingInvoices?.totalCount ?? 0) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}
        />
        <StatCard
          label="Low Stock Items"
          value={lowStock?.totalCount}
          sub="Below reorder level"
          to="/inventory"
          color={(lowStock?.totalCount ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment breakdown chart */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Today's Appointments by Status</h3>
          {(todayAppts?.totalCount ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">No appointments today.</p>
          ) : (
            <BarChart data={chartData} />
          )}
        </div>

        {/* Recent visits */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Today's Visits</h3>
            <Link to="/consultations" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
          </div>
          {(todayVisits?.data.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">No visits recorded today.</p>
          ) : (
            <ul className="space-y-2">
              {todayVisits?.data.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{v.patientName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{v.doctorName}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    v.status === 'Completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {v.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
