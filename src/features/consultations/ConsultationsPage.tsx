import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useVisits } from './useVisits'
import { getPatients } from '@/features/patients/patientsApi'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

const STATUS_COLORS: Record<string, string> = {
  InProgress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Triaged: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

export function ConsultationsPage() {
  const navigate = useNavigate()

  const [date, setDate] = useState(todayISO())
  const [patientId, setPatientId] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<{ id: string; fullName: string }[]>([])
  const [page, setPage] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, error } = useVisits({
    date: patientId ? undefined : date,
    patientId: patientId || undefined,
    page,
  })

  function handlePatientSearch(term: string) {
    setPatientSearch(term)
    setPatientId('')
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (term.length < 2) { setPatientResults([]); return }
    debounceRef.current = setTimeout(async () => {
      const result = await getPatients({ searchTerm: term, pageSize: 6 })
      setPatientResults(result.data)
    }, 300)
  }

  function selectPatient(id: string, name: string) {
    setPatientId(id)
    setPatientSearch(name)
    setPatientResults([])
    setPage(1)
  }

  function clearPatient() {
    setPatientId('')
    setPatientSearch('')
    setPatientResults([])
    setDate(todayISO())
    setPage(1)
  }

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
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
        >
          + Open Visit
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {/* Patient search */}
        <div className="relative">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Patient</label>
          {patientId ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 text-sm">
              <span className="text-gray-900 dark:text-gray-100">{patientSearch}</span>
              <button onClick={clearPatient} className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 text-xs">✕</button>
            </div>
          ) : (
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => handlePatientSearch(e.target.value)}
              placeholder="Search patient..."
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm w-48"
            />
          )}
          {patientResults.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
              {patientResults.map((p) => (
                <li
                  key={p.id}
                  onClick={() => selectPatient(p.id, p.fullName)}
                  className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {p.fullName}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Date filter — hidden when a patient is selected */}
        {!patientId && (
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1) }}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>}
      {error && <div className="text-sm text-red-600 dark:text-red-400">Failed to load visits.</div>}
      {data && data.data.length === 0 && (
        <div className="text-sm text-gray-400 dark:text-gray-500">No visits for this date.</div>
      )}

      {data && data.data.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {data.data.map((visit) => (
              <div
                key={visit.id}
                onClick={() => navigate(`/consultations/${visit.id}`)}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{visit.patientName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{visit.doctorName}</p>
                    {visit.diagnosis && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{visit.diagnosis}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${STATUS_COLORS[visit.status] ?? ''}`}>
                    {visit.status === 'InProgress' ? 'In Progress' : visit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
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
                        {visit.status === 'InProgress' ? 'In Progress' : visit.status}
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
          </div>
        </>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.hasPreviousPage}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {data.page} of {data.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={!data.hasNextPage}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
