import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useVisits } from './useVisits'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

const STATUS_COLORS: Record<string, string> = {
  InProgress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

export function ConsultationsPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useVisits({ date, page })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Consultations</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data ? `${data.totalCount} visit${data.totalCount !== 1 ? 's' : ''}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => navigate('/consultations/new')}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Open Visit
        </button>
      </div>

      <input
        type="date"
        value={date}
        onChange={(e) => { setDate(e.target.value); setPage(1) }}
        className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
      />

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading && <div className="p-6 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-6 text-sm text-red-600">Failed to load visits.</div>}
        {data && data.data.length === 0 && (
          <div className="p-6 text-sm text-gray-400">No visits for this date.</div>
        )}
        {data && data.data.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Patient</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Doctor</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Diagnosis</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((visit) => (
                <tr
                  key={visit.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => navigate(`/consultations/${visit.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{visit.patientName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{visit.doctorName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{visit.diagnosis ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[visit.status] ?? ''}`}>
                      {visit.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/consultations/${visit.id}`) }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.hasPreviousPage} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-500">Page {data.page} of {data.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={!data.hasNextPage} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
