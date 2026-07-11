import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { usePatient } from './usePatient'
import { useVisits } from '@/features/consultations/useVisits'
import { useDoctors } from '@/features/appointments/useAppointments'

const STATUS_COLORS: Record<string, string> = {
  InProgress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Triaged: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

export function PatientVisitsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: patient } = usePatient(id!)
  const { data: doctors } = useDoctors()

  const [doctorId, setDoctorId] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useVisits({ patientId: id, doctorId: doctorId || undefined, page, pageSize: 20 })

  function handleDoctorChange(val: string) {
    setDoctorId(val)
    setPage(1)
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link to={`/patients/${id}`} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
          ← {patient?.fullName ?? 'Patient'}
        </Link>
        <h2 className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">Visit History</h2>
        {data && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{data.totalCount} visit{data.totalCount !== 1 ? 's' : ''}</p>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Doctor</label>
          <select
            value={doctorId}
            onChange={(e) => handleDoctorChange(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-sm"
          >
            <option value="">All doctors</option>
            {doctors?.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading && <p className="p-4 text-sm text-gray-400">Loading...</p>}

        {!isLoading && data?.data.length === 0 && (
          <p className="p-4 text-sm text-gray-400">No visits found.</p>
        )}

        {data && data.data.length > 0 && (
          <>
            {/* Mobile cards */}
            <ul className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {data.data.map((v) => (
                <li
                  key={v.id}
                  onClick={() => navigate(`/consultations/${v.id}`)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{v.visitDate}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{v.doctorName}</p>
                    {v.diagnosis && <p className="text-xs text-gray-400 dark:text-gray-500">{v.diagnosis}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[v.status] ?? ''}`}>
                    {v.status}
                  </span>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Doctor</th>
                    <th className="px-4 py-3 font-medium">Diagnosis</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/consultations/${v.id}`)}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{v.visitDate}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{v.doctorName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{v.diagnosis ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[v.status] ?? ''}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(data.hasPreviousPage || data.hasNextPage) && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {data.page} of {data.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!data.hasPreviousPage}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.hasNextPage}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
