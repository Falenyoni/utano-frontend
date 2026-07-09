import { useState } from 'react'
import { usePatients } from './usePatients'

export function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = usePatients({ searchTerm, page, pageSize: 20 })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
        <p className="text-sm text-gray-500 mt-1">
          {data ? `${data.totalCount} total` : 'Loading patient records...'}
        </p>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setPage(1) // reset to page 1 whenever the search changes
        }}
        placeholder="Search by name or national ID..."
        className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading && (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        )}

        {error && (
          <div className="p-6 text-sm text-red-600">
            Failed to load patients. Please try again.
          </div>
        )}

        {data && data.data.length === 0 && (
          <div className="p-6 text-sm text-gray-400">No patients found.</div>
        )}

        {data && data.data.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">National ID</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-900">{patient.fullName}</td>
                  <td className="px-4 py-2 text-gray-600">{patient.nationalId}</td>
                  <td className="px-4 py-2 text-gray-600">{patient.status}</td>
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
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasNextPage}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}