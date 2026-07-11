import { useEffect, useState } from 'react'
import { useDispensaryQueue, useDispenserDispense } from './useDispensary'
import type { DispensaryRow } from './dispensaryApi'

function defaultQty(row: DispensaryRow) {
  return Math.min(row.quantityOnHand, row.quantity)
}

function btnLabel(qty: number, prescribed: number) {
  if (qty <= 0) return 'Mark External'
  if (qty < prescribed) return `Dispense ${qty} of ${prescribed}`
  return 'Dispense'
}

function btnClass(qty: number, prescribed: number) {
  if (qty <= 0)
    return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
  if (qty < prescribed) return 'bg-amber-500 hover:bg-amber-600 text-white'
  return 'bg-green-600 hover:bg-green-700 text-white'
}

export function DispensaryPage() {
  const { data, isLoading, error, refetch } = useDispensaryQueue()
  const dispense = useDispenserDispense()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [processingAll, setProcessingAll] = useState(false)
  const [dispenseError, setDispenseError] = useState<string | null>(null)

  // Initialise / reset quantities when queue data loads
  useEffect(() => {
    if (!data) return
    setQuantities((prev) => {
      const next: Record<string, number> = {}
      for (const row of data) {
        // Keep existing edited value if present, otherwise set default
        next[row.prescriptionId] = prev[row.prescriptionId] ?? defaultQty(row)
      }
      return next
    })
  }, [data])

  function setQty(id: string, value: number, max: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, Math.min(value, max)) }))
  }

  async function handleDispense(row: DispensaryRow) {
    setDispenseError(null)
    setProcessingId(row.prescriptionId)
    const qty = quantities[row.prescriptionId] ?? defaultQty(row)
    try {
      await dispense.mutateAsync({
        visitId: row.visitId,
        prescriptionId: row.prescriptionId,
        quantityOverride: qty <= 0 ? 0 : qty,
      })
    } catch (err) {
      setDispenseError(err instanceof Error ? err.message : 'Failed to dispense')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleProcessAll() {
    if (!data || data.length === 0) return
    setDispenseError(null)
    setProcessingAll(true)
    for (const row of data) {
      const qty = quantities[row.prescriptionId] ?? defaultQty(row)
      try {
        await dispense.mutateAsync({
          visitId: row.visitId,
          prescriptionId: row.prescriptionId,
          quantityOverride: qty <= 0 ? 0 : qty,
        })
      } catch (err) {
        setDispenseError(err instanceof Error ? err.message : `Failed on ${row.description}`)
        break
      }
    }
    setProcessingAll(false)
  }

  const pendingCount = data?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dispensary Queue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Adjust quantities before dispensing. Zero = mark as external.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => refetch()}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Refresh
          </button>
          {pendingCount > 1 && (
            <button
              onClick={handleProcessAll}
              disabled={processingAll}
              className="text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
            >
              {processingAll ? 'Processing...' : `Process All (${pendingCount})`}
            </button>
          )}
        </div>
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
          <p className="text-gray-400 dark:text-gray-500 text-sm">No pending prescriptions.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {data.map((row) => {
              const max = Math.min(row.quantityOnHand, row.quantity)
              const qty = quantities[row.prescriptionId] ?? defaultQty(row)
              const busy = processingId === row.prescriptionId || processingAll
              return (
                <div
                  key={row.prescriptionId}
                  className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{row.patientName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {row.doctorName} · {row.visitDate}
                    </p>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{row.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Prescribed: {row.quantity} {row.unit}</span>
                    <span
                      className={
                        row.quantityOnHand === 0
                          ? 'text-red-500 dark:text-red-400'
                          : row.quantityOnHand < row.quantity
                          ? 'text-amber-500 dark:text-amber-400'
                          : 'text-green-600 dark:text-green-400'
                      }
                    >
                      In stock: {row.quantityOnHand} {row.unit}
                    </span>
                  </div>
                  {row.dosageInstructions && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">{row.dosageInstructions}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Qty to dispense</label>
                      <input
                        type="number"
                        min={0}
                        max={max}
                        value={qty}
                        disabled={row.quantityOnHand === 0 || busy}
                        onChange={(e) => setQty(row.prescriptionId, Number(e.target.value), max)}
                        className="w-20 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                      />
                    </div>
                    <button
                      onClick={() => handleDispense(row)}
                      disabled={busy}
                      className={`ml-auto text-sm font-medium px-4 py-2 rounded disabled:opacity-50 ${btnClass(qty, row.quantity)}`}
                    >
                      {busy ? '...' : btnLabel(qty, row.quantity)}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Doctor · Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Medication</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Prescribed</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">In Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Qty to dispense
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Instructions</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.map((row) => {
                  const max = Math.min(row.quantityOnHand, row.quantity)
                  const qty = quantities[row.prescriptionId] ?? defaultQty(row)
                  const busy = processingId === row.prescriptionId || processingAll
                  return (
                    <tr key={row.prescriptionId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.patientName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                        <div>{row.doctorName}</div>
                        <div>{row.visitDate}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.description}</td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                        {row.quantity} {row.unit}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          row.quantityOnHand === 0
                            ? 'text-red-500 dark:text-red-400'
                            : row.quantityOnHand < row.quantity
                            ? 'text-amber-500 dark:text-amber-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {row.quantityOnHand} {row.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={max}
                          value={qty}
                          disabled={row.quantityOnHand === 0 || busy}
                          onChange={(e) => setQty(row.prescriptionId, Number(e.target.value), max)}
                          className="w-20 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs">
                        <span className="italic text-xs">{row.dosageInstructions ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDispense(row)}
                          disabled={busy}
                          className={`text-xs font-medium px-3 py-1.5 rounded disabled:opacity-50 whitespace-nowrap ${btnClass(qty, row.quantity)}`}
                        >
                          {busy ? 'Processing...' : btnLabel(qty, row.quantity)}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
