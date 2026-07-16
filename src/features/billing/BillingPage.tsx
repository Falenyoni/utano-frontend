import { useState, useEffect, useRef } from 'react'
import { useInvoices, useCreateInvoice } from './useBilling'
import { getPatients, getPatientById } from '@/features/patients/patientsApi'
import { useMedicalAids } from '@/features/medicalAids/useMedicalAids'
import { InvoiceDetailModal } from './InvoiceDetailModal'

const STATUSES = ['Draft', 'Issued', 'PartiallyPaid', 'Paid', 'Void']

const statusColor: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  PartiallyPaid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Paid: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Void: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-ZW', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

const inputCls =
  'border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300'

function NewInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const createInvoice = useCreateInvoice()
  const { data: allAids } = useMedicalAids()

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; fullName: string }[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedPatientName, setSelectedPatientName] = useState('')
  const [medicalAidId, setMedicalAidId] = useState('')
  const [medicalAidName, setMedicalAidName] = useState('')
  const [loadingPatient, setLoadingPatient] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (search.length < 2) { setSearchResults([]); setShowDropdown(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await getPatients({ searchTerm: search, pageSize: 8 })
      setSearchResults(res.data.map((p) => ({ id: p.id, fullName: p.fullName })))
      setShowDropdown(true)
    }, 300)
  }, [search])

  async function selectPatient(id: string, name: string) {
    setSelectedPatientId(id)
    setSelectedPatientName(name)
    setSearch(name)
    setShowDropdown(false)
    setLoadingPatient(true)
    try {
      const detail = await getPatientById(id)
      setMedicalAidId(detail.medicalAidId ?? '')
      setMedicalAidName(detail.medicalAidName ?? '')
    } finally {
      setLoadingPatient(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatientId) return
    const result = await createInvoice.mutateAsync({
      patientId: selectedPatientId,
      patientName: selectedPatientName,
      medicalAidId: medicalAidId || null,
      medicalAidName: medicalAidName || null,
    })
    onClose()
    onCreated(result.id)
  }

  const activeAids = allAids?.filter((a) => a.isActive) ?? []

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">New Invoice</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient</label>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedPatientId(''); setMedicalAidId(''); setMedicalAidName('') }}
              placeholder="Type patient name..."
              className={inputCls}
              autoComplete="off"
            />
            {showDropdown && searchResults.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => selectPatient(p.id, p.fullName)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {p.fullName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedPatientId && !loadingPatient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Medical Aid <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <select
                value={medicalAidId}
                onChange={(e) => {
                  const aid = activeAids.find((a) => a.id === e.target.value)
                  setMedicalAidId(e.target.value)
                  setMedicalAidName(aid?.name ?? '')
                }}
                className={inputCls}
              >
                <option value="">Cash / No Medical Aid</option>
                {activeAids.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {loadingPatient && (
            <p className="text-xs text-gray-400">Loading patient details...</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={!selectedPatientId || createInvoice.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function BillingPage() {
  const [patientName, setPatientName] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [showNewInvoice, setShowNewInvoice] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  const { data, isLoading } = useInvoices({ patientName, status, dateFrom, dateTo, page, pageSize: 20 })
  const invoices = data?.data ?? []

  const totalOutstanding = invoices.reduce(
    (s, i) => s + (i.status !== 'Void' && i.status !== 'Paid' ? i.balanceDue : 0), 0
  )

  return (
    <div className="space-y-4">
      {showNewInvoice && <NewInvoiceModal onClose={() => setShowNewInvoice(false)} onCreated={(id) => setSelectedInvoiceId(id)} />}
      {selectedInvoiceId && <InvoiceDetailModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Billing</h1>
          {data && data.totalCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {data.totalCount} invoice{data.totalCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {totalOutstanding > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-500">Outstanding (this view)</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalOutstanding)}</p>
            </div>
          )}
          <button
            onClick={() => setShowNewInvoice(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
          >
            + New Invoice
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search patient..."
          value={patientName}
          onChange={(e) => { setPatientName(e.target.value); setPage(1) }}
          className={`${inputCls} w-full sm:w-48`}
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className={inputCls}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className={inputCls} />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className={inputCls} />
        {(patientName || status || dateFrom || dateTo) && (
          <button
            onClick={() => { setPatientName(''); setStatus(''); setDateFrom(''); setDateTo(''); setPage(1) }}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Mobile cards */}
      {!isLoading && invoices.length > 0 && (
        <div className="sm:hidden space-y-2">
          {invoices.map((inv) => {
            const today = new Date().toISOString().slice(0, 10)
            const isOverdue = inv.status !== 'Paid' && inv.status !== 'Void' && inv.dueDate < today
            return (
              <button key={inv.id} onClick={() => setSelectedInvoiceId(inv.id)}
                className="w-full text-left bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 space-y-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{inv.patientName}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[inv.status] ?? statusColor.Draft}`}>
                    {inv.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{new Date(inv.invoiceDate).toLocaleDateString()}</span>
                  <span className={`font-medium ${inv.balanceDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                    {formatCurrency(inv.balanceDue)} due
                    {isOverdue && <span className="ml-1 text-red-500">(overdue)</span>}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-left">
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
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">Loading...</td></tr>
            )}
            {!isLoading && invoices.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No invoices found</td></tr>
            )}
            {invoices.map((inv) => {
              const today = new Date().toISOString().slice(0, 10)
              const isOverdue = inv.status !== 'Paid' && inv.status !== 'Void' && inv.dueDate < today
              return (
                <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedInvoiceId(inv.id)} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {inv.invoiceNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {inv.patientName}
                    {inv.medicalAidId && (
                      <span className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                        {inv.medicalAidName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inv.doctorName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[inv.status] ?? statusColor.Draft}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap ${isOverdue ? 'text-red-500 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {new Date(inv.dueDate).toLocaleDateString()}
                    {isOverdue && <span className="ml-1 text-xs">(overdue)</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{formatCurrency(inv.amountPaid)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${inv.balanceDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {formatCurrency(inv.balanceDue)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* end desktop table */}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Page {data.page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={!data.hasPreviousPage} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
              Prev
            </button>
            <button disabled={!data.hasNextPage} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
