import { useState } from 'react'
import { useDispensaryQueue, useDispenserDispense } from './useDispensary'
import type { DispensaryRow } from './dispensaryApi'

export function DispensaryPage() {
  const { data, isLoading, error, refetch } = useDispensaryQueue()
  const dispense = useDispenserDispense()
  const [dispensingId, setDispensingId] = useState<string | null>(null)
  const [dispenseError, setDispenseError] = useState<string | null>(null)

  async function handleDispense(row: DispensaryRow) {
    setDispenseError(null)
    setDispensingId(row.prescriptionId)
    try {
      await dispense.mutateAsync({ visitId: row.visitId, prescriptionId: row.prescriptionId })
    } catch (err) {
      setDispenseError(err instanceof Error ? err.message : 'Failed to dispense')
    } finally {
      setDispensingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dispensary Queue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Pending prescriptions waiting to be dispensed from stock
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      {dispenseError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md px-4 py-3 text-sm">
          {dispenseError}
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Loading queue...</div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 py-8 text-center">
          Failed to load dispensary queue.
        </div>
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 py-16 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No pending prescriptions to dispense.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Patient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Visit Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Doctor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Item</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Qty</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Instructions</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.map((row) => (
                <tr key={row.prescriptionId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.patientName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.visitDate}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.doctorName}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900 dark:text-gray-100">{row.description}</div>
                    {row.stockItemName && row.stockItemName !== row.description && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">{row.stockItemName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.quantity}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs">
                    <span className="italic text-xs">{row.dosageInstructions ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDispense(row)}
                      disabled={dispensingId === row.prescriptionId}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded disabled:opacity-50 whitespace-nowrap"
                    >
                      {dispensingId === row.prescriptionId ? 'Dispensing...' : 'Dispense'}
                    </button>
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
