import { useState } from 'react'
import { Link } from 'react-router'
import { usePatients } from './usePatients'

export function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = usePatients({ searchTerm, page, pageSize: 20 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Patients</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data ? `${data.totalCount} total` : 'Loading patient records...'}
          </p>
        </div>

        <Link
          to="/patients/new"
          className="inline-block bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Register Patient
        </Link>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setPage(1)
        }}
        placeholder="Search by name or national ID..."
        className="w-full max-w-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
      />

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading && (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        )}

        {error && (
          <div className="p-6 text-sm text-red-600 dark:text-red-400">
            Failed to load patients. Please try again.
          </div>
        )}

        {data && data.data.length === 0 && (
          <div className="p-6 text-sm text-gray-400 dark:text-gray-500">No patients found.</div>
        )}

        {data && data.data.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">National ID</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500 dark:text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{patient.fullName}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{patient.nationalId}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{patient.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to={`/patients/${patient.id}`}
                      className="inline-block text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-1 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data.hasPreviousPage}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasNextPage}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}