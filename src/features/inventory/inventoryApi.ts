import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface StockItemSummary {
  id: string
  name: string
  sku: string | null
  category: string
  unit: string
  sellingPrice: number
  costPrice: number
  quantityOnHand: number
  reorderLevel: number
  isLowStock: boolean
  isActive: boolean
}

export interface StockItemDetail extends StockItemSummary {
  description: string | null
  createdAt: string
  updatedAt: string
  recentTransactions: TransactionRow[]
}

export interface TransactionRow {
  id: string
  type: string
  quantity: number
  quantityBefore: number
  quantityAfter: number
  unitCost: number
  notes: string | null
  referenceType: string | null
  createdAt: string
}

export interface PagedStockItems {
  data: StockItemSummary[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface GetStockItemsParams {
  search?: string
  category?: string
  lowStockOnly?: boolean
  activeOnly?: boolean
  page?: number
  pageSize?: number
}

export async function getStockItems(params: GetStockItemsParams): Promise<PagedStockItems> {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.category) q.set('category', params.category)
  if (params.lowStockOnly) q.set('lowStockOnly', 'true')
  if (params.activeOnly !== undefined) q.set('activeOnly', String(params.activeOnly))
  q.set('page', String(params.page ?? 1))
  q.set('pageSize', String(params.pageSize ?? 20))
  const res = await apiFetch(`/api/inventory/stock?${q}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch stock items')
  return res.json()
}

export async function getStockItem(id: string): Promise<StockItemDetail> {
  const res = await apiFetch(`/api/inventory/stock/${id}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch stock item')
  return res.json()
}

export interface AddStockItemRequest {
  name: string
  sku?: string | null
  description?: string | null
  category: string
  unit: string
  sellingPrice: number
  costPrice: number
  reorderLevel: number
}

export async function addStockItem(req: AddStockItemRequest): Promise<{ id: string; name: string }> {
  const res = await apiFetch('/api/inventory/stock', { method: 'POST', body: JSON.stringify(req) })
  if (!res.ok) throw new Error('Failed to add stock item')
  return res.json()
}

export async function updateStockItem(id: string, req: AddStockItemRequest): Promise<void> {
  const res = await apiFetch(`/api/inventory/stock/${id}`, { method: 'PUT', body: JSON.stringify(req) })
  if (!res.ok) throw new Error('Failed to update stock item')
}

export async function receiveStock(id: string, quantity: number, unitCost?: number, notes?: string): Promise<void> {
  const res = await apiFetch(`/api/inventory/stock/${id}/receive`, {
    method: 'POST', body: JSON.stringify({ quantity, unitCost: unitCost ?? null, notes: notes ?? null })
  })
  if (!res.ok) throw new Error('Failed to receive stock')
}

export async function adjustStock(id: string, quantity: number, notes?: string): Promise<void> {
  const res = await apiFetch(`/api/inventory/stock/${id}/adjust`, {
    method: 'POST', body: JSON.stringify({ quantity, notes: notes ?? null })
  })
  if (!res.ok) throw new Error('Failed to adjust stock')
}

export async function deactivateStockItem(id: string): Promise<void> {
  const res = await apiFetch(`/api/inventory/stock/${id}/deactivate`, { method: 'PUT' })
  if (!res.ok) throw new Error('Failed to deactivate stock item')
}
