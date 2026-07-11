import { useState } from 'react'
import { useAuditLog } from './useAuditLog'

const PAGE_SIZE = 50

const ENTITY_TYPES = ['', 'Visit', 'Patient', 'Invoice', 'Prescription', 'StockItem']
const ACTIONS = ['', 'Triaged', 'Completed', 'Created', 'Updated', 'Deleted', 'Dispensed']

export function AuditLogPage() {
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useAuditLog({
    entityType: entityType || undefined,
    action: action || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  function resetFilters() {
    setEntityType('')
    setAction('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const selectClass = 'rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
  const inputClass = `${selectClass} w-36`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Immutable record of clinical and system events
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 flex flex-wrap items-center gap-3">
        <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1) }} className={selectClass}>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{t || 'All types'}</option>
          ))}
        </select>
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} className={selectClass}>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a || 'All actions'}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className={inputClass} />
        </div>
        {(entityType || action || dateFrom || dateTo) && (
          <button onClick={resetFilters} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            Clear filters
          </button>
        )}
        {data && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
            {data.totalCount.toLocaleString()} events
          </span>
        )}
      </div>

      {isLoading && (
        <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Loading...</div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 py-8 text-center">Failed to load audit log.</div>
      )}

      {data && data.data.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 py-12 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">No audit events match your filters.</p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono text-xs">
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.userName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {row.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        row.action === 'Completed'
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                          : row.action === 'Triaged'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                          : row.action === 'Deleted'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                      }`}>
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {row.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs truncate max-w-[10rem]">
                      {row.entityId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
              >
                Previous
              </button>
              <span>Page {data.page} of {data.totalPages}</span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
