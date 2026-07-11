import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useStockItem, useReceiveStock, useAdjustStock, useDeactivateStockItem } from './useInventory'

const TXN_COLOR: Record<string, string> = {
  Received: 'text-green-600',
  Dispensed: 'text-blue-600',
  Adjusted: 'text-yellow-600',
  Returned: 'text-purple-600',
  Expired: 'text-red-500',
  Damaged: 'text-red-500',
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-ZW', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

export default function StockItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading } = useStockItem(id!)

  const [receiveQty, setReceiveQty] = useState('')
  const [receiveCost, setReceiveCost] = useState('')
  const [receiveNotes, setReceiveNotes] = useState('')
  const [showReceive, setShowReceive] = useState(false)

  const [adjustQty, setAdjustQty] = useState('')
  const [adjustNotes, setAdjustNotes] = useState('')
  const [showAdjust, setShowAdjust] = useState(false)

  const receiveMutation = useReceiveStock()
  const adjustMutation = useAdjustStock()
  const deactivateMutation = useDeactivateStockItem()

  function handleReceive(e: React.FormEvent) {
    e.preventDefault()
    const qty = Number(receiveQty)
    if (!qty || qty <= 0) return
    receiveMutation.mutate(
      { id: id!, quantity: qty, unitCost: receiveCost ? Number(receiveCost) : undefined, notes: receiveNotes || undefined },
      { onSuccess: () => { setShowReceive(false); setReceiveQty(''); setReceiveCost(''); setReceiveNotes('') } },
    )
  }

  function handleAdjust(e: React.FormEvent) {
    e.preventDefault()
    const qty = Number(adjustQty)
    if (qty === 0) return
    adjustMutation.mutate(
      { id: id!, quantity: qty, notes: adjustNotes || undefined },
      { onSuccess: () => { setShowAdjust(false); setAdjustQty(''); setAdjustNotes('') } },
    )
  }

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>
  if (!item) return <div className="p-6 text-red-500">Item not found.</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/inventory" className="text-sm text-gray-400 hover:text-gray-600">← Inventory</Link>
          <h1 className="text-2xl font-bold mt-1">{item.name}</h1>
          <div className="flex gap-2 mt-1 text-sm text-gray-500">
            {item.sku && <span>SKU: {item.sku}</span>}
            <span>·</span>
            <span>{item.category}</span>
            <span>·</span>
            <span>{item.unit}</span>
            {!item.isActive && <span className="text-red-500 font-medium">· Inactive</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReceive(true)}
            className="text-sm px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100">
            Receive Stock
          </button>
          <button onClick={() => setShowAdjust(true)}
            className="text-sm px-3 py-2 bg-gray-50 border rounded-lg hover:bg-gray-100">
            Adjust
          </button>
          {item.isActive && (
            <button
              onClick={() => { if (confirm('Deactivate this item?')) deactivateMutation.mutate(item.id) }}
              className="text-sm px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100"
            >
              Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'In Stock', value: item.quantityOnHand, highlight: item.isLowStock ? 'text-orange-600' : 'text-gray-900' },
          { label: 'Reorder Level', value: item.reorderLevel, highlight: 'text-gray-900' },
          { label: 'Selling Price', value: formatCurrency(item.sellingPrice), highlight: 'text-gray-900' },
          { label: 'Cost Price', value: formatCurrency(item.costPrice), highlight: 'text-gray-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.highlight}`}>{s.value}</p>
            {s.label === 'In Stock' && item.isLowStock && (
              <p className="text-xs text-orange-500 mt-0.5">Below reorder level</p>
            )}
          </div>
        ))}
      </div>

      {item.description && (
        <div className="bg-white border rounded-xl p-4 text-sm text-gray-600">{item.description}</div>
      )}

      {/* Transaction History */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-800">Recent Transactions</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-left">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Before</th>
              <th className="px-4 py-3 font-medium text-right">After</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              <th className="px-4 py-3 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody>
            {item.recentTransactions.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No transactions yet</td></tr>
            )}
            {item.recentTransactions.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
                <td className={`px-4 py-3 font-medium ${TXN_COLOR[t.type] ?? 'text-gray-700'}`}>{t.type}</td>
                <td className="px-4 py-3 text-right font-medium">{t.quantity > 0 ? `+${t.quantity}` : t.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-500">{t.quantityBefore}</td>
                <td className="px-4 py-3 text-right text-gray-800">{t.quantityAfter}</td>
                <td className="px-4 py-3 text-gray-500">{t.notes ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{t.referenceType ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receive Modal */}
      {showReceive && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Receive Stock — {item.name}</h2>
            <form onSubmit={handleReceive} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantity *</label>
                <input type="number" min={1} value={receiveQty} onChange={(e) => setReceiveQty(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Unit Cost (USD)</label>
                <input type="number" min={0} step="0.01" value={receiveCost} onChange={(e) => setReceiveCost(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <input value={receiveNotes} onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowReceive(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={receiveMutation.isPending}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">
                  {receiveMutation.isPending ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-1">Adjust Stock — {item.name}</h2>
            <p className="text-xs text-gray-400 mb-4">Current stock: {item.quantityOnHand}. Positive to add, negative to remove.</p>
            <form onSubmit={handleAdjust} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantity Adjustment *</label>
                <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Reason *</label>
                <input value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAdjust(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={adjustMutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                  {adjustMutation.isPending ? 'Saving...' : 'Adjust'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
