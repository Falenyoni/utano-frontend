import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getInvoices, getRevenueSummary, getVisitsByDoctor, getVisitDemographics } from '@/features/billing/billingApi'
import { getStockItems } from '@/features/inventory/inventoryApi'

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function firstOfMonth(offsetMonths = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offsetMonths, 1)
  return d.toISOString().split('T')[0]
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ── Revenue Summary ──────────────────────────────────────────────────────────

function RevenueReport() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth(-2))
  const [dateTo, setDateTo] = useState(today())

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-revenue', dateFrom, dateTo],
    queryFn: () => getRevenueSummary({ dateFrom, dateTo }),
  })

  const maxBar = Math.max(...(data?.byMonth.map((m) => m.invoiced) ?? [1]), 1)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Run
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Invoiced', value: fmt(data.totalInvoiced), color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Collected', value: fmt(data.totalCollected), color: 'text-green-600 dark:text-green-400' },
              { label: 'Outstanding', value: fmt(data.totalOutstanding), color: 'text-yellow-600 dark:text-yellow-400' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {data.invoiceCount} invoices · {data.paidCount} paid · {data.outstandingCount} outstanding
          </div>

          {data.byMonth.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">By Month</p>
              {data.byMonth.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0">{m.month}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                        <div
                          className="h-3 bg-blue-500 rounded-full"
                          style={{ width: `${(m.invoiced / maxBar) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-20 text-right">{fmt(m.invoiced)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                        <div
                          className="h-3 bg-green-500 rounded-full"
                          style={{ width: `${(m.collected / maxBar) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-20 text-right">{fmt(m.collected)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 pt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-blue-500 rounded inline-block" /> Invoiced</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-green-500 rounded inline-block" /> Collected</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Outstanding Balances ─────────────────────────────────────────────────────

function OutstandingReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-outstanding'],
    queryFn: () => getInvoices({ outstanding: true, pageSize: 50 }),
  })

  const invoices = data?.data ?? []
  const total = invoices.reduce((s, i) => s + i.balanceDue, 0)

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      {!isLoading && invoices.length === 0 && (
        <p className="text-sm text-gray-400">No outstanding invoices.</p>
      )}
      {invoices.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Total outstanding: <span className="text-yellow-600 dark:text-yellow-400">{fmt(total)}</span>
            <span className="text-gray-400 font-normal ml-2">({invoices.length} invoices)</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-1 font-medium pr-4">Invoice</th>
                  <th className="pb-1 font-medium pr-4">Patient</th>
                  <th className="pb-1 font-medium pr-4">Date</th>
                  <th className="pb-1 font-medium text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-1.5 pr-4">
                      <Link to={`/billing/${inv.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-4 text-gray-900 dark:text-gray-100">{inv.patientName}</td>
                    <td className="py-1.5 pr-4 text-gray-500 dark:text-gray-400">{inv.invoiceDate}</td>
                    <td className="py-1.5 text-right text-yellow-600 dark:text-yellow-400 font-medium">{fmt(inv.balanceDue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── Visits by Doctor ─────────────────────────────────────────────────────────

function VisitsByDoctorReport() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth(-1))
  const [dateTo, setDateTo] = useState(today())

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-visits-doctor', dateFrom, dateTo],
    queryFn: () => getVisitsByDoctor({ dateFrom, dateTo }),
  })

  const maxVal = Math.max(...(data?.map((r) => r.total) ?? [1]), 1)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Run
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      {data && data.length === 0 && <p className="text-sm text-gray-400">No visits in this period.</p>}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((row) => (
            <div key={row.doctorName} className="flex items-center gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300 w-36 shrink-0 truncate">{row.doctorName}</span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full flex items-center px-2 transition-all"
                  style={{ width: `${(row.total / maxVal) * 100}%`, minWidth: '2rem' }}
                >
                  <span className="text-white text-xs font-medium">{row.total}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 w-32 text-right shrink-0">
                {row.completed} done · {row.inProgress} active
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Visit Demographics ────────────────────────────────────────────────────────

function DemographicsReport() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth(-2))
  const [dateTo, setDateTo] = useState(today())

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-demographics', dateFrom, dateTo],
    queryFn: () => getVisitDemographics({ dateFrom, dateTo }),
  })

  function pct(n: number, total: number) {
    return total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`
  }

  const totalVisits = data
    ? data.overallGender.male + data.overallGender.female + data.overallGender.other + data.overallGender.unknown
    : 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm" />
        </div>
        <button onClick={() => refetch()} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          Run
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      {data && totalVisits === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">No visits in this period.</p>
      )}

      {data && totalVisits > 0 && (
        <>
          {/* Overall Gender */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Gender Breakdown — {totalVisits} visits
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Male', value: data.overallGender.male, color: 'bg-blue-500' },
                { label: 'Female', value: data.overallGender.female, color: 'bg-pink-500' },
                { label: 'Other', value: data.overallGender.other, color: 'bg-purple-500' },
                { label: 'Unknown', value: data.overallGender.unknown, color: 'bg-gray-400' },
              ].map((g) => (
                <div key={g.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${g.color}`} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{g.label}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{g.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{pct(g.value, totalVisits)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Age Groups */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Age Groups</p>
            <div className="space-y-1.5">
              {[
                { label: 'Under 18', value: data.overallAgeGroups.under18 },
                { label: '18–35', value: data.overallAgeGroups.age18to35 },
                { label: '36–50', value: data.overallAgeGroups.age36to50 },
                { label: '51–65', value: data.overallAgeGroups.age51to65 },
                { label: 'Over 65', value: data.overallAgeGroups.over65 },
                { label: 'Unknown', value: data.overallAgeGroups.unknown },
              ].filter((a) => a.value > 0).map((a) => (
                <div key={a.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0">{a.label}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                    <div className="h-3 bg-indigo-500 rounded-full" style={{ width: pct(a.value, totalVisits) }} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">{a.value} ({pct(a.value, totalVisits)})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per Doctor */}
          {data.byDoctor.length > 1 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">By Doctor</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-left">
                      <th className="pb-1 font-medium pr-4">Doctor</th>
                      <th className="pb-1 font-medium text-right pr-3">Total</th>
                      <th className="pb-1 font-medium text-right pr-3">Male</th>
                      <th className="pb-1 font-medium text-right pr-3">Female</th>
                      <th className="pb-1 font-medium text-right pr-3">&lt;18</th>
                      <th className="pb-1 font-medium text-right pr-3">18–35</th>
                      <th className="pb-1 font-medium text-right pr-3">36–50</th>
                      <th className="pb-1 font-medium text-right pr-3">51–65</th>
                      <th className="pb-1 font-medium text-right">65+</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byDoctor.map((row) => (
                      <tr key={row.doctorName} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="py-1.5 pr-4 text-gray-900 dark:text-gray-100 font-medium">{row.doctorName}</td>
                        <td className="py-1.5 pr-3 text-right text-gray-900 dark:text-gray-100">{row.total}</td>
                        <td className="py-1.5 pr-3 text-right text-blue-600 dark:text-blue-400">{row.gender.male}</td>
                        <td className="py-1.5 pr-3 text-right text-pink-600 dark:text-pink-400">{row.gender.female}</td>
                        <td className="py-1.5 pr-3 text-right text-gray-500 dark:text-gray-400">{row.ageGroups.under18}</td>
                        <td className="py-1.5 pr-3 text-right text-gray-500 dark:text-gray-400">{row.ageGroups.age18to35}</td>
                        <td className="py-1.5 pr-3 text-right text-gray-500 dark:text-gray-400">{row.ageGroups.age36to50}</td>
                        <td className="py-1.5 pr-3 text-right text-gray-500 dark:text-gray-400">{row.ageGroups.age51to65}</td>
                        <td className="py-1.5 text-right text-gray-500 dark:text-gray-400">{row.ageGroups.over65}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Low Stock Alert ──────────────────────────────────────────────────────────

function LowStockReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-low-stock'],
    queryFn: () => getStockItems({ lowStockOnly: true, activeOnly: true, pageSize: 100 }),
  })

  const items = data?.data ?? []

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      {!isLoading && items.length === 0 && (
        <p className="text-sm text-green-600 dark:text-green-400">All stock levels are healthy.</p>
      )}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-1 font-medium pr-4">Item</th>
                <th className="pb-1 font-medium pr-4">Category</th>
                <th className="pb-1 font-medium text-right pr-4">On Hand</th>
                <th className="pb-1 font-medium text-right">Reorder Level</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-1.5 pr-4">
                    <Link to={`/inventory/${item.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {item.name}
                    </Link>
                  </td>
                  <td className="py-1.5 pr-4 text-gray-500 dark:text-gray-400">{item.category}</td>
                  <td className="py-1.5 pr-4 text-right text-red-600 dark:text-red-400 font-medium">
                    {item.quantityOnHand} {item.unit}
                  </td>
                  <td className="py-1.5 text-right text-gray-500 dark:text-gray-400">
                    {item.reorderLevel} {item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const REPORTS = [
  { id: 'revenue', label: 'Revenue Summary', component: <RevenueReport /> },
  { id: 'outstanding', label: 'Outstanding Balances', component: <OutstandingReport /> },
  { id: 'visits-doctor', label: 'Visits by Doctor', component: <VisitsByDoctorReport /> },
  { id: 'demographics', label: 'Patient Demographics', component: <DemographicsReport /> },
  { id: 'low-stock', label: 'Low Stock Alert', component: <LowStockReport /> },
]

export function ReportsPage() {
  const [active, setActive] = useState('revenue')
  const report = REPORTS.find((r) => r.id === active)!

  return (
    <div className="flex gap-6 min-h-full">
      <nav className="w-48 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 px-2">Reports</p>
        <ul className="space-y-1">
          {REPORTS.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setActive(r.id)}
                className={`w-full text-left block rounded-md px-3 py-2 text-sm font-medium ${
                  active === r.id
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-1 min-w-0">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{report.label}</h2>
          {report.component}
        </div>
      </div>
    </div>
  )
}
