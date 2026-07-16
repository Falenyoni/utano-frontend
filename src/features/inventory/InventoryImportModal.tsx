import { BulkUploadModal, type ImportColumn } from '@/shared/components/BulkUploadModal'
import { apiFetch } from '@/shared/lib/api/apiFetch'
import { receiveStock } from './inventoryApi'

const CATEGORIES = ['Medication', 'Consumable', 'Equipment', 'Laboratory', 'Other']

const COLUMNS: ImportColumn[] = [
  { key: 'name',         label: 'Name',          required: true },
  { key: 'category',     label: 'Category',      required: true, hint: CATEGORIES.join(' / ') },
  { key: 'unit',         label: 'Unit',          required: true, hint: 'Tablets / ml / Units / Vials' },
  { key: 'sellingPrice', label: 'Selling Price', required: true, hint: 'e.g. 25.00' },
  { key: 'costPrice',    label: 'Cost Price',    required: true, hint: 'e.g. 15.00' },
  { key: 'initialQty',   label: 'Initial Qty',   hint: 'Starting stock on hand' },
  { key: 'reorderLevel', label: 'Reorder Level', hint: 'defaults to 0' },
  { key: 'sku',          label: 'SKU',           hint: 'optional' },
  { key: 'description',  label: 'Description',   hint: 'optional' },
]

async function importStockItem(row: Record<string, string>) {
  const sellingPrice = parseFloat(row.sellingPrice)
  const costPrice    = parseFloat(row.costPrice)
  const reorderLevel = parseFloat(row.reorderLevel || '0')
  const initialQty   = parseFloat(row.initialQty   || '0')

  if (isNaN(sellingPrice) || isNaN(costPrice)) {
    throw new Error('Selling Price and Cost Price must be valid numbers')
  }

  const normalizedCategory = CATEGORIES.find(
    (c) => c.toLowerCase() === (row.category ?? '').trim().toLowerCase(),
  )
  if (!normalizedCategory) {
    throw new Error(`Invalid category "${row.category}". Must be one of: ${CATEGORIES.join(', ')}`)
  }

  const res = await apiFetch('/api/inventory/stock', {
    method: 'POST',
    body: JSON.stringify({
      name:         row.name,
      sku:          row.sku || null,
      description:  row.description || null,
      category:     normalizedCategory,
      unit:         row.unit,
      sellingPrice,
      costPrice,
      reorderLevel: isNaN(reorderLevel) ? 0 : reorderLevel,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const msg = body?.errors
      ? Object.values(body.errors as Record<string, string[]>).flat().join(', ')
      : body?.title ?? 'Failed to create stock item'
    throw new Error(msg)
  }

  if (initialQty > 0) {
    const { id } = await res.json() as { id: string; name: string }
    await receiveStock(id, initialQty, costPrice, 'Opening stock via import')
  }
}

interface Props { onClose: () => void; onDone: () => void }

export function InventoryImportModal({ onClose, onDone }: Props) {
  return (
    <BulkUploadModal
      title="Import Inventory"
      columns={COLUMNS}
      templateFileName="utano-inventory-template.csv"
      onClose={onClose}
      onSubmitRow={importStockItem}
      onDone={onDone}
      rowLabel={(row) => row.name || 'Item'}
    />
  )
}
