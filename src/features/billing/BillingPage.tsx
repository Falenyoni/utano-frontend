import { useState } from 'react'
import { Link } from 'react-router'
import { useInvoices } from './useBilling'

const STATUSES = ['Draft', 'Issued', 'PartiallyPaid', 'Paid', 'Void']

const statusColor: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Issued: 'bg-blue-100 text-blue-700',
  PartiallyPaid: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  Void: 'bg-red-100 text-red-600',
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-ZW', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

export function BillingPage() {
  const [patientName, setPatientName] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useInvoices({ patientName, status, dateFrom, dateTo, page, pageSize: 20 })
  const invoices = data?.data ?? []

  const totalOutstanding = invoices.reduce(
    (s, i) => s + (i.status !== 'Void' && i.status !== 'Paid' ? i.balanceDue : 0), 0
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          {data && data.totalCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.totalCount} invoice{data.totalCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {totalOutstanding > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Outstanding (this view)</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search patient..."
          value={patientName}
          onChange={(e) => { setPatientName(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        {(patientName || status || dateFrom || dateTo) && (
          <button
            onClick={() => { setPatientName(''); setStatus(''); setDateFrom(''); setDateTo(''); setPage(1) }}
            className="text-sm text-gray-400 hover:text-gray-600 px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-left">
              <th className="px-4 py-3 font-medium">Invoice #</th>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Doctor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Paid</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            )}
            {!isLoading && invoices.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No invoices found</td></tr>
            )}
            {invoices.map((inv) => {
              const today = new Date().toISOString().slice(0, 10)
              const isOverdue = inv.status !== 'Paid' && inv.status !== 'Void' && inv.dueDate < today
              return (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/billing/${inv.id}`} className="font-medium text-blue-600 hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{inv.patientName}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.doctorName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[inv.status] ?? statusColor.Draft}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    {new Date(inv.dueDate).toLocaleDateString()}
                    {isOverdue && <span className="ml-1 text-xs">(overdue)</span>}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(inv.amountPaid)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${inv.balanceDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {formatCurrency(inv.balanceDue)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {data.page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={!data.hasPreviousPage} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button disabled={!data.hasNextPage} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
