import { useState } from 'react'
import { Link } from 'react-router'
import { useAddStockItem, useAdjustStock, useReceiveStock, useStockItems } from './useInventory'
import type { AddStockItemRequest } from './inventoryApi'

const CATEGORIES = ['Medication', 'Consumable', 'Equipment', 'Laboratory', 'Other']

const categoryColor: Record<string, string> = {
  Medication: 'bg-blue-100 text-blue-800',
  Consumable: 'bg-green-100 text-green-800',
  Equipment: 'bg-purple-100 text-purple-800',
  Laboratory: 'bg-yellow-100 text-yellow-800',
  Other: 'bg-gray-100 text-gray-700',
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-ZW', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

const blankItem: AddStockItemRequest = {
  name: '', sku: '', description: '', category: 'Medication',
  unit: 'Units', sellingPrice: 0, costPrice: 0, reorderLevel: 0,
}

export function InventoryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddStockItemRequest>(blankItem)
  const [addError, setAddError] = useState('')

  const [receiveId, setReceiveId] = useState<string | null>(null)
  const [receiveQty, setReceiveQty] = useState('')
  const [receiveCost, setReceiveCost] = useState('')
  const [receiveNotes, setReceiveNotes] = useState('')

  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustNotes, setAdjustNotes] = useState('')

  const { data, isLoading } = useStockItems({ search, category, lowStockOnly, activeOnly: true, page, pageSize: 20 })
  const addMutation = useAddStockItem()
  const receiveMutation = useReceiveStock()
  const adjustMutation = useAdjustStock()

  const items = data?.data ?? []
  const lowStockCount = items.filter((i) => i.isLowStock).length

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    if (!form.name.trim()) { setAddError('Name is required'); return }
    addMutation.mutate(form, {
      onSuccess: () => { setShowAdd(false); setForm(blankItem) },
      onError: (err) => setAddError(err.message),
    })
  }

  function handleReceive(e: React.FormEvent) {
    e.preventDefault()
    if (!receiveId) return
    const qty = Number(receiveQty)
    if (!qty || qty <= 0) return
    receiveMutation.mutate(
      { id: receiveId, quantity: qty, unitCost: receiveCost ? Number(receiveCost) : undefined, notes: receiveNotes || undefined },
      { onSuccess: () => { setReceiveId(null); setReceiveQty(''); setReceiveCost(''); setReceiveNotes('') } },
    )
  }

  function handleAdjust(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustId) return
    const qty = Number(adjustQty)
    if (qty === 0) return
    adjustMutation.mutate(
      { id: adjustId, quantity: qty, notes: adjustNotes || undefined },
      { onSuccess: () => { setAdjustId(null); setAdjustQty(''); setAdjustNotes('') } },
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          {lowStockCount > 0 && (
            <p className="text-sm text-orange-600 mt-0.5">
              {lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock
            </p>
          )}
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddError('') }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name or SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1) }} />
          Low stock only
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium text-right">In Stock</th>
              <th className="px-4 py-3 font-medium text-right">Selling Price</th>
              <th className="px-4 py-3 font-medium text-right">Cost Price</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No items found</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/inventory/${item.id}`} className="font-medium text-blue-600 hover:underline">
                    {item.name}
                  </Link>
                  {item.isLowStock && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Low</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{item.sku ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[item.category] ?? categoryColor.Other}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                <td className={`px-4 py-3 text-right font-medium ${item.isLowStock ? 'text-orange-600' : 'text-gray-800'}`}>
                  {item.quantityOnHand}
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.sellingPrice)}</td>
                <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(item.costPrice)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setReceiveId(item.id); setReceiveQty(''); setReceiveCost(''); setReceiveNotes('') }}
                      className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200"
                    >
                      Receive
                    </button>
                    <button
                      onClick={() => { setAdjustId(item.id); setAdjustQty(''); setAdjustNotes('') }}
                      className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 border border-gray-200"
                    >
                      Adjust
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {data.page} of {data.totalPages} ({data.totalCount} items)</span>
          <div className="flex gap-2">
            <button disabled={!data.hasPreviousPage} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button disabled={!data.hasNextPage} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Add Stock Item</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">SKU</label>
                  <input value={form.sku ?? ''} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Unit</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reorder Level</label>
                  <input type="number" min={0} value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Selling Price (USD)</label>
                  <input type="number" min={0} step="0.01" value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cost Price (USD)</label>
                  <input type="number" min={0} step="0.01" value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <textarea value={form.description ?? ''} rows={2}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </div>
              {addError && <p className="text-red-500 text-sm">{addError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={addMutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                  {addMutation.isPending ? 'Saving...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {receiveId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Receive Stock</h2>
            <form onSubmit={handleReceive} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantity Received *</label>
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
                <button type="button" onClick={() => setReceiveId(null)}
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

      {/* Adjust Stock Modal */}
      {adjustId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-1">Adjust Stock</h2>
            <p className="text-xs text-gray-400 mb-4">Positive to add, negative to remove</p>
            <form onSubmit={handleAdjust} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantity Adjustment *</label>
                <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Reason / Notes *</label>
                <input value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setAdjustId(null)}
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
