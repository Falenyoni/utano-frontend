import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRevenueSummary, getVisitsByDoctor } from '../billing/billingApi'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(Math.round(n))
}

function pct(num: number, den: number) {
  if (den === 0) return '0%'
  return `${Math.round((num / den) * 100)}%`
}

function monthLabel(iso: string) {
  const [y, m] = iso.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-ZA', {
    month: 'short', year: '2-digit',
  })
}

function lastNMonthKeys(n: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

function isoDateRange(months: number) {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: now.toISOString().slice(0, 10),
  }
}

// ── Shared chart components ───────────────────────────────────────────────────

function BarChart({
  data,
}: {
  data: { label: string; value: number; value2?: number; projected?: boolean }[]
}) {
  const max = Math.max(...data.flatMap((d) => [d.value, d.value2 ?? 0]), 1)
  return (
    <div className="flex items-end gap-1 h-36">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group relative">
          <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute -top-5">
            {fmtShort(d.value)}
          </span>
          <div className="w-full flex items-end gap-px" style={{ height: '100%' }}>
            <div
              className="flex-1 rounded-t-sm"
              style={{
                height: `${Math.max((d.value / max) * 100, d.value ? 2 : 0)}%`,
                background: d.projected
                  ? 'repeating-linear-gradient(45deg,#6366f1,#6366f1 2px,#a5b4fc 2px,#a5b4fc 6px)'
                  : 'var(--color-primary, #3b82f6)',
                opacity: d.value === 0 ? 0.15 : 0.85,
              }}
            />
            {d.value2 !== undefined && (
              <div
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${Math.max((d.value2 / max) * 100, d.value2 ? 2 : 0)}%`,
                  background: '#22c55e',
                  opacity: d.value2 === 0 ? 0.15 : 0.7,
                }}
              />
            )}
          </div>
          <span className="text-[9px] text-gray-500 dark:text-gray-500 whitespace-nowrap">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function MiniBar({
  value,
  max,
  color = 'var(--color-primary, #3b82f6)',
}: {
  value: number
  max: number
  color?: string
}) {
  return (
    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min((value / Math.max(max, 1)) * 100, 100)}%`, background: color }}
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  color = 'blue',
}: {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red'
}) {
  const accent: Record<string, string> = {
    blue:   'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900',
    green:  'bg-green-50 dark:bg-green-950/40 border-green-100 dark:border-green-900',
    amber:  'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900',
    purple: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900',
    red:    'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900',
  }
  return (
    <div className={`rounded-xl border p-4 ${accent[color]}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function Slider({
  label, value, min, max, step, onChange, format,
}: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; format: (v: number) => string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-blue-600 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'trends' | 'playground'

export function FinancialPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [rangeMonths, setRangeMonths] = useState(12)

  const range = useMemo(() => isoDateRange(rangeMonths), [rangeMonths])

  const { data: summary, isLoading } = useQuery({
    queryKey: ['revenue-summary', range],
    queryFn: () => getRevenueSummary(range),
  })

  const { data: byDoctor = [] } = useQuery({
    queryKey: ['visits-by-doctor', range],
    queryFn: () => getVisitsByDoctor(range),
  })

  const months12 = useMemo(() => lastNMonthKeys(12), [])

  // Build a map from the API's byMonth array for quick lookup
  const monthMap = useMemo(() => {
    const m: Record<string, { invoiced: number; collected: number }> = {}
    summary?.byMonth?.forEach((row) => {
      const key = row.month.slice(0, 7) // normalise to YYYY-MM
      m[key] = { invoiced: row.invoiced, collected: row.collected }
    })
    return m
  }, [summary])

  // Avg monthly collected over last 6 months (for playground baseline)
  const avg6MonthCollected = useMemo(() => {
    const last6 = lastNMonthKeys(6)
    const withData = last6.filter((k) => (monthMap[k]?.collected ?? 0) > 0)
    if (!withData.length) return (summary?.totalCollected ?? 0) / Math.max(rangeMonths, 1)
    return withData.reduce((s, k) => s + (monthMap[k]?.collected ?? 0), 0) / withData.length
  }, [monthMap, summary, rangeMonths])

  const collectionRate = summary && summary.totalInvoiced > 0
    ? Math.round((summary.totalCollected / summary.totalInvoiced) * 100)
    : 0

  // ── Playground state ──────────────────────────────────────────────────────
  const [growthRate, setGrowthRate]       = useState(5)
  const [projectMonths, setProjectMonths] = useState(12)
  const [staffCost, setStaffCost]         = useState(18_000)
  const [numStaff, setNumStaff]           = useState(1)
  const [patientsPerStaff, setPatientsPerStaff] = useState(80)
  const [revenuePerPatient, setRevenuePerPatient] = useState(
    summary && summary.paidCount > 0
      ? Math.round(summary.totalCollected / summary.paidCount)
      : 850
  )

  const projections = useMemo(() => {
    const rows: { month: string; revenue: number; cumulative: number }[] = []
    let base = avg6MonthCollected
    let cum = 0
    const now = new Date()
    for (let i = 1; i <= projectMonths; i++) {
      base = base * (1 + growthRate / 100)
      cum += base
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      rows.push({
        month: d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }),
        revenue: base,
        cumulative: cum,
      })
    }
    return rows
  }, [avg6MonthCollected, growthRate, projectMonths])

  const totalProjectedRev  = projections.at(-1)?.cumulative ?? 0
  const monthlyStaffCost   = numStaff * staffCost
  const addedMonthlyRev    = numStaff * patientsPerStaff * revenuePerPatient
  const netMonthly         = addedMonthlyRev - monthlyStaffCost

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'trends',     label: 'Trends' },
    { id: 'playground', label: 'Playground' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Financial</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Revenue performance and scenario planning
          </p>
        </div>
        <select
          value={rangeMonths}
          onChange={(e) => setRangeMonths(Number(e.target.value))}
          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
          <option value={24}>Last 24 months</option>
        </select>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      )}

      {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
      {!isLoading && tab === 'overview' && (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Invoiced"
              value={`R ${fmtShort(summary?.totalInvoiced ?? 0)}`}
              sub={`${summary?.invoiceCount ?? 0} invoices`}
              color="blue"
            />
            <KpiCard
              label="Total Collected"
              value={`R ${fmtShort(summary?.totalCollected ?? 0)}`}
              sub={`${summary?.paidCount ?? 0} paid`}
              color="green"
            />
            <KpiCard
              label="Outstanding"
              value={`R ${fmtShort(summary?.totalOutstanding ?? 0)}`}
              sub={`${summary?.outstandingCount ?? 0} unpaid`}
              color="amber"
            />
            <KpiCard
              label="Collection Rate"
              value={`${collectionRate}%`}
              sub="collected / invoiced"
              color={collectionRate >= 80 ? 'green' : collectionRate >= 60 ? 'amber' : 'red'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly overview chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Revenue at a Glance
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'var(--color-primary, #3b82f6)' }} />
                    Invoiced
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block bg-green-500" />
                    Collected
                  </span>
                </div>
              </div>
              <BarChart
                data={months12.map((k) => ({
                  label: monthLabel(k),
                  value: monthMap[k]?.invoiced ?? 0,
                  value2: monthMap[k]?.collected ?? 0,
                }))}
              />
            </div>

            {/* Doctor performance */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Visits by Doctor
              </h3>
              {byDoctor.length === 0 ? (
                <p className="text-sm text-gray-400">No data for this period</p>
              ) : (
                <div className="space-y-3">
                  {byDoctor.map((d) => (
                    <div key={d.doctorName} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {d.doctorName}
                        </span>
                        <span className="text-gray-500 tabular-nums">
                          {d.total} visits · {d.completed} completed
                        </span>
                      </div>
                      <MiniBar value={d.completed} max={byDoctor[0].total} color="#22c55e" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Outstanding invoices summary */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Collection Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  label: 'Invoiced',
                  value: summary?.totalInvoiced ?? 0,
                  color: 'var(--color-primary, #3b82f6)',
                },
                { label: 'Collected', value: summary?.totalCollected ?? 0, color: '#22c55e' },
                { label: 'Outstanding', value: summary?.totalOutstanding ?? 0, color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{label}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      R {fmt(value)}
                    </span>
                  </div>
                  <MiniBar
                    value={value}
                    max={Math.max(summary?.totalInvoiced ?? 0, 1)}
                    color={color}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TRENDS ───────────────────────────────────────────────────────────── */}
      {!isLoading && tab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Monthly Revenue
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Invoiced (blue) vs collected (green) · last 12 months
                </p>
              </div>
            </div>
            <BarChart
              data={months12.map((k) => ({
                label: monthLabel(k),
                value: monthMap[k]?.invoiced ?? 0,
                value2: monthMap[k]?.collected ?? 0,
              }))}
            />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  {['Month', 'Invoiced', 'Collected', 'Outstanding', 'Collection Rate'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {[...months12].reverse().map((k) => {
                  const inv  = monthMap[k]?.invoiced  ?? 0
                  const col  = monthMap[k]?.collected ?? 0
                  const outs = Math.max(inv - col, 0)
                  const rate = inv > 0 ? Math.round((col / inv) * 100) : null
                  const isNow = k === months12[months12.length - 1]
                  return (
                    <tr
                      key={k}
                      className={isNow ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}
                    >
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium">
                        {monthLabel(k)}
                        {isNow && (
                          <span className="ml-2 text-xs text-blue-500">current</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">
                        {inv > 0 ? `R ${fmt(inv)}` : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-green-700 dark:text-green-400 font-medium">
                        {col > 0 ? `R ${fmt(col)}` : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-amber-700 dark:text-amber-400">
                        {outs > 0 ? `R ${fmt(outs)}` : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-gray-500">
                        {rate != null ? (
                          <span className={rate >= 80 ? 'text-green-600 dark:text-green-400 font-medium' : rate >= 60 ? 'text-amber-600' : 'text-red-500'}>
                            {rate}%
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
              {months12.length} months shown
            </div>
          </div>
        </div>
      )}

      {/* ── PLAYGROUND ───────────────────────────────────────────────────────── */}
      {!isLoading && tab === 'playground' && (
        <div className="space-y-6">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
            Projections are estimates based on your historical collection data. Adjust the sliders to model different scenarios.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Revenue projections */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-5">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Revenue Projections
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Based on avg monthly collection of{' '}
                  <strong>R {fmtShort(avg6MonthCollected)}</strong> (last 6 months)
                </p>
              </div>

              <Slider
                label="Monthly growth rate"
                value={growthRate} min={0} max={30} step={0.5}
                onChange={setGrowthRate}
                format={(v) => `${v}%`}
              />
              <Slider
                label="Projection horizon"
                value={projectMonths} min={3} max={24} step={1}
                onChange={setProjectMonths}
                format={(v) => `${v} months`}
              />

              <BarChart
                data={projections.map((r) => ({
                  label: r.month,
                  value: r.revenue,
                  projected: true,
                }))}
              />

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Projected total</p>
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                    R {fmtShort(totalProjectedRev)}
                  </p>
                  <p className="text-xs text-gray-400">over {projectMonths} months</p>
                </div>
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Month {projectMonths} revenue</p>
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                    R {fmtShort(projections.at(-1)?.revenue ?? 0)}
                  </p>
                  <p className="text-xs text-gray-400">at {growthRate}% / month</p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      {['Month', 'Revenue', 'Cumulative'].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {projections.map((r) => (
                      <tr key={r.month}>
                        <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{r.month}</td>
                        <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                          R {fmt(r.revenue)}
                        </td>
                        <td className="px-3 py-1.5 text-indigo-600 dark:text-indigo-400 tabular-nums">
                          R {fmt(r.cumulative)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff expansion ROI */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-5">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Staff Expansion ROI
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Should you hire more clinical staff? Your avg revenue per paid invoice is{' '}
                  <strong>
                    R{' '}
                    {fmtShort(
                      summary && summary.paidCount > 0
                        ? Math.round(summary.totalCollected / summary.paidCount)
                        : 0,
                    )}
                  </strong>
                </p>
              </div>

              <Slider
                label="Staff to hire"
                value={numStaff} min={1} max={10} step={1}
                onChange={setNumStaff}
                format={(v) => `${v} staff`}
              />
              <Slider
                label="Monthly salary / staff member"
                value={staffCost} min={8_000} max={80_000} step={1_000}
                onChange={setStaffCost}
                format={(v) => `R ${fmtShort(v)}`}
              />
              <Slider
                label="Patients seen / staff / month"
                value={patientsPerStaff} min={10} max={400} step={10}
                onChange={setPatientsPerStaff}
                format={(v) => `${v} patients`}
              />
              <Slider
                label="Avg revenue per patient visit"
                value={revenuePerPatient} min={100} max={5_000} step={50}
                onChange={setRevenuePerPatient}
                format={(v) => `R ${fmtShort(v)}`}
              />

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Monthly impact
                </h4>
                {[
                  {
                    label: 'Added revenue',
                    value: `R ${fmt(addedMonthlyRev)}`,
                    color: 'text-green-600 dark:text-green-400',
                    bold: false,
                  },
                  {
                    label: 'Added salary cost',
                    value: `− R ${fmt(monthlyStaffCost)}`,
                    color: 'text-red-500 dark:text-red-400',
                    bold: false,
                  },
                  {
                    label: 'Net monthly',
                    value: `R ${fmt(netMonthly)}`,
                    color: netMonthly >= 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400',
                    bold: true,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{row.label}</span>
                    <span className={`tabular-nums ${row.bold ? 'font-bold' : 'font-medium'} ${row.color}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4 space-y-2 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Annual salary spend</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    R {fmt(monthlyStaffCost * 12)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Annual added revenue</span>
                  <span className="font-semibold text-green-600 dark:text-green-400 tabular-nums">
                    R {fmt(addedMonthlyRev * 12)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Annual net</span>
                  <span
                    className={`font-bold tabular-nums ${
                      netMonthly * 12 >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}
                  >
                    R {fmt(netMonthly * 12)}
                  </span>
                </div>
              </div>

              {netMonthly > 0 ? (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2 text-xs text-green-800 dark:text-green-300">
                  At {patientsPerStaff} patients/staff/month, hiring {numStaff} staff member
                  {numStaff > 1 ? 's' : ''} generates a net{' '}
                  <strong>R {fmt(netMonthly)}/month</strong> increase. Worth considering.
                </div>
              ) : (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-800 dark:text-red-300">
                  At current parameters the cost exceeds the projected revenue. Increase patient
                  volume or revenue per patient to make this viable.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
