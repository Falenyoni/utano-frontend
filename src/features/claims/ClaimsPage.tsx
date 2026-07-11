import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getInvoices, submitClaim, updateClaimStatus } from '@/features/billing/billingApi'

const CLAIM_STATUS_COLORS: Record<string, string> = {
  None: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const CLAIM_STATUS_FILTERS = ['All', 'None', 'Pending', 'Approved', 'Rejected']

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SubmitClaimModal({
  invoiceId,
  invoiceTotal,
  onClose,
}: {
  invoiceId: string
  invoiceTotal: number
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState(String(invoiceTotal))
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => submitClaim(invoiceId, Number(amount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Submit Claim</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Enter the amount to claim from the medical aid. Invoice total is {fmt(invoiceTotal)}.
          </p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setError(null); mutation.mutate() }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Claim Amount (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ClaimsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [submitting, setSubmitting] = useState<{ id: string; total: number } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['claims', statusFilter, search, page],
    queryFn: () =>
      getInvoices({
        hasMedicalAid: true,
        medAidClaimStatus: statusFilter === 'All' ? undefined : statusFilter,
        patientName: search || undefined,
        page,
        pageSize: 20,
      }),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => updateClaimStatus(id, 'Approved'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claims'] }),
  })
  const rejectMutation = useMutation({
    mutationFn: (id: string) => updateClaimStatus(id, 'Rejected'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claims'] }),
  })

  const invoices = data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Aid Claims</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {data ? `${data.totalCount} claim${data.totalCount !== 1 ? 's' : ''}` : 'Track and manage medical aid claim submissions'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search patient..."
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <div className="flex gap-1">
          {CLAIM_STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {s === 'None' ? 'Unsubmitted' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading && (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        )}
        {!isLoading && invoices.length === 0 && (
          <div className="p-6 text-sm text-gray-400 dark:text-gray-500">No medical aid invoices found.</div>
        )}
        {invoices.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Invoice</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Patient</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Scheme</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Total</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Claim Amt</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Claim Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <td className="px-4 py-2">
                    <Link
                      to={`/billing/${inv.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{inv.patientName}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs font-mono">
                    {inv.medicalAidName ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{inv.invoiceDate}</td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100">{fmt(inv.totalAmount)}</td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100">
                    {inv.medAidClaimAmount > 0 ? fmt(inv.medAidClaimAmount) : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CLAIM_STATUS_COLORS[inv.medAidClaimStatus] ?? CLAIM_STATUS_COLORS.None}`}>
                      {inv.medAidClaimStatus === 'None' ? 'Unsubmitted' : inv.medAidClaimStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      {inv.medAidClaimStatus === 'None' && (
                        <button
                          onClick={() => setSubmitting({ id: inv.id, total: inv.totalAmount })}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Submit Claim
                        </button>
                      )}
                      {inv.medAidClaimStatus === 'Pending' && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate(inv.id)}
                            disabled={approveMutation.isPending}
                            className="text-xs text-green-600 dark:text-green-400 hover:underline disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(inv.id)}
                            disabled={rejectMutation.isPending}
                            className="text-xs text-red-500 dark:text-red-400 hover:underline disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {inv.medAidClaimStatus === 'Rejected' && (
                        <button
                          onClick={() => setSubmitting({ id: inv.id, total: inv.totalAmount })}
                          className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                        >
                          Resubmit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && (data.hasPreviousPage || data.hasNextPage) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            Page {data.page} of {data.totalPages} · {data.totalCount} invoices
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!data.hasPreviousPage}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-xs disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasNextPage}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-xs disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {submitting && (
        <SubmitClaimModal
          invoiceId={submitting.id}
          invoiceTotal={submitting.total}
          onClose={() => setSubmitting(null)}
        />
      )}
    </div>
  )
}
