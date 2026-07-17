import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getInvoices, getRevenueSummary, getVisitsByDoctor, getVisitDemographics } from '@/features/billing/billingApi'
import { getStockItems } from '@/features/inventory/inventoryApi'

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fc(n: number) {
  return `$${n.toFixed(2)}`
}

function firstOfMonth(offsetMonths = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offsetMonths, 1)
  return d.toISOString().split('T')[0]
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function ExportButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 shrink-0"
    >
      ↓ Export PDF
    </button>
  )
}

// ── Revenue Summary ──────────────────────────────────────────────────────────

function RevenueReport() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth(-2))
  const [dateTo, setDateTo] = useState(today())

  const { data, isLoading } = useQuery({
    queryKey: ['report-revenue', dateFrom, dateTo],
    queryFn: () => getRevenueSummary({ dateFrom, dateTo }),
  })

  const maxBar = Math.max(...(data?.byMonth.map((m) => m.invoiced) ?? [1]), 1)

  function exportPdf() {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Revenue Summary', 14, 18)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 26)
    doc.setTextColor(0)

    autoTable(doc, {
      startY: 32,
      head: [['Metric', 'Amount']],
      body: [
        ['Total Invoiced', fc(data.totalInvoiced)],
        ['Collected', fc(data.totalCollected)],
        ['Outstanding', fc(data.totalOutstanding)],
      ],
      columnStyles: { 1: { halign: 'right' } },
      styles: { fontSize: 10 },
    })

    const y1 = ((doc as any).lastAutoTable?.finalY ?? 60) + 10

    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`${data.invoiceCount} invoices · ${data.paidCount} paid · ${data.outstandingCount} outstanding`, 14, y1)
    doc.setTextColor(0)

    if (data.byMonth.length > 0) {
      autoTable(doc, {
        startY: y1 + 8,
        head: [['Month', 'Invoiced', 'Collected']],
        body: data.byMonth.map((m) => [m.month, fc(m.invoiced), fc(m.collected)]),
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
        styles: { fontSize: 9 },
      })
    }

    doc.save(`revenue-summary-${dateFrom}-${dateTo}.pdf`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
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
        </div>
        <ExportButton onClick={exportPdf} disabled={!data} />
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

  function exportPdf() {
    if (!invoices.length) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Outstanding Balances', 14, 18)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`${invoices.length} invoices · Total outstanding: ${fc(total)}`, 14, 26)
    doc.setTextColor(0)

    autoTable(doc, {
      startY: 32,
      head: [['Invoice #', 'Patient', 'Date', 'Balance Due']],
      body: invoices.map((inv) => [inv.invoiceNumber, inv.patientName, inv.invoiceDate, fc(inv.balanceDue)]),
      columnStyles: { 3: { halign: 'right' } },
      styles: { fontSize: 9 },
    })

    doc.save(`outstanding-balances-${today()}.pdf`)
  }

  return (
    <div className="space-y-3">
      {!isLoading && (
        <div className="flex justify-end">
          <ExportButton onClick={exportPdf} disabled={invoices.length === 0} />
        </div>
      )}
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

  const { data, isLoading } = useQuery({
    queryKey: ['report-visits-doctor', dateFrom, dateTo],
    queryFn: () => getVisitsByDoctor({ dateFrom, dateTo }),
  })

  const maxVal = Math.max(...(data?.map((r) => r.total) ?? [1]), 1)

  function exportPdf() {
    if (!data || !data.length) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Visits by Doctor', 14, 18)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 26)
    doc.setTextColor(0)

    autoTable(doc, {
      startY: 32,
      head: [['Doctor', 'Total', 'Completed', 'In Progress']],
      body: data.map((r) => [r.doctorName, r.total, r.completed, r.inProgress]),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      styles: { fontSize: 9 },
    })

    doc.save(`visits-by-doctor-${dateFrom}-${dateTo}.pdf`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
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
        </div>
        <ExportButton onClick={exportPdf} disabled={!data || data.length === 0} />
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      {data && data.length === 0 && <p className="text-sm text-gray-400">No visits in this period.</p>}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((row) => (
            <div key={row.doctorName} className="flex items-center gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300 w-24 sm:w-36 shrink-0 truncate">{row.doctorName}</span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full flex items-center px-2 transition-all"
                  style={{ width: `${(row.total / maxVal) * 100}%`, minWidth: '2rem' }}
                >
                  <span className="text-white text-xs font-medium">{row.total}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 w-20 sm:w-32 text-right shrink-0">
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

  const { data, isLoading } = useQuery({
    queryKey: ['report-demographics', dateFrom, dateTo],
    queryFn: () => getVisitDemographics({ dateFrom, dateTo }),
  })

  function pct(n: number, total: number) {
    return total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`
  }

  const totalVisits = data
    ? data.overallGender.male + data.overallGender.female + data.overallGender.other + data.overallGender.unknown
    : 0

  function exportPdf() {
    if (!data || totalVisits === 0) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Patient Demographics', 14, 18)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Period: ${dateFrom} to ${dateTo} · ${totalVisits} visits`, 14, 26)
    doc.setTextColor(0)

    autoTable(doc, {
      startY: 32,
      head: [['Gender', 'Count', '%']],
      body: [
        ['Male', data.overallGender.male, pct(data.overallGender.male, totalVisits)],
        ['Female', data.overallGender.female, pct(data.overallGender.female, totalVisits)],
        ['Other', data.overallGender.other, pct(data.overallGender.other, totalVisits)],
        ['Unknown', data.overallGender.unknown, pct(data.overallGender.unknown, totalVisits)],
      ],
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      styles: { fontSize: 9 },
    })

    const y1 = ((doc as any).lastAutoTable?.finalY ?? 70) + 10

    autoTable(doc, {
      startY: y1,
      head: [['Age Group', 'Count', '%']],
      body: [
        ['Under 18', data.overallAgeGroups.under18, pct(data.overallAgeGroups.under18, totalVisits)],
        ['18–35', data.overallAgeGroups.age18to35, pct(data.overallAgeGroups.age18to35, totalVisits)],
        ['36–50', data.overallAgeGroups.age36to50, pct(data.overallAgeGroups.age36to50, totalVisits)],
        ['51–65', data.overallAgeGroups.age51to65, pct(data.overallAgeGroups.age51to65, totalVisits)],
        ['Over 65', data.overallAgeGroups.over65, pct(data.overallAgeGroups.over65, totalVisits)],
      ].filter(([, v]) => (v as number) > 0),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      styles: { fontSize: 9 },
    })

    if (data.byDoctor.length > 1) {
      const y2 = ((doc as any).lastAutoTable?.finalY ?? 120) + 10
      autoTable(doc, {
        startY: y2,
        head: [['Doctor', 'Total', 'Male', 'Female', '<18', '18–35', '36–50', '51–65', '65+']],
        body: data.byDoctor.map((r) => [
          r.doctorName, r.total, r.gender.male, r.gender.female,
          r.ageGroups.under18, r.ageGroups.age18to35, r.ageGroups.age36to50,
          r.ageGroups.age51to65, r.ageGroups.over65,
        ]),
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' } },
        styles: { fontSize: 8 },
      })
    }

    doc.save(`patient-demographics-${dateFrom}-${dateTo}.pdf`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
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
        </div>
        <ExportButton onClick={exportPdf} disabled={!data || totalVisits === 0} />
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

  function exportPdf() {
    if (!items.length) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Low Stock Alert', 14, 18)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`${items.length} items below reorder level · ${today()}`, 14, 26)
    doc.setTextColor(0)

    autoTable(doc, {
      startY: 32,
      head: [['Item', 'Category', 'On Hand', 'Reorder Level']],
      body: items.map((item) => [
        item.name,
        item.category,
        `${item.quantityOnHand} ${item.unit}`,
        `${item.reorderLevel} ${item.unit}`,
      ]),
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
      styles: { fontSize: 9 },
    })

    doc.save(`low-stock-${today()}.pdf`)
  }

  return (
    <div className="space-y-3">
      {!isLoading && (
        <div className="flex justify-end">
          <ExportButton onClick={exportPdf} disabled={items.length === 0} />
        </div>
      )}
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
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 min-h-full">
      <nav className="sm:w-48 sm:shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 px-2 hidden sm:block">Reports</p>
        <ul className="flex sm:block gap-1 overflow-x-auto pb-1 sm:pb-0 sm:space-y-1">
          {REPORTS.map((r) => (
            <li key={r.id} className="shrink-0 sm:shrink">
              <button
                onClick={() => setActive(r.id)}
                className={`whitespace-nowrap sm:w-full text-left block rounded-md px-3 py-2 text-sm font-medium ${
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
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{report.label}</h2>
          {report.component}
        </div>
      </div>
    </div>
  )
}
