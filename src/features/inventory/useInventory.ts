import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addStockItem, adjustStock, deactivateStockItem, getStockItem,
  getStockItems, receiveStock, updateStockItem,
  type GetStockItemsParams,
} from './inventoryApi'

export function useStockItems(params: GetStockItemsParams) {
  return useQuery({ queryKey: ['stock-items', params], queryFn: () => getStockItems(params) })
}

export function useStockItem(id: string) {
  return useQuery({ queryKey: ['stock-item', id], queryFn: () => getStockItem(id), enabled: !!id })
}

export function useAddStockItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addStockItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-items'] }),
  })
}

export function useUpdateStockItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...req }: { id: string } & Parameters<typeof updateStockItem>[1]) =>
      updateStockItem(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-items'] }); qc.invalidateQueries({ queryKey: ['stock-item'] }) },
  })
}

export function useReceiveStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity, unitCost, notes }: { id: string; quantity: number; unitCost?: number; notes?: string }) =>
      receiveStock(id, quantity, unitCost, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-items'] }); qc.invalidateQueries({ queryKey: ['stock-item'] }) },
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity, notes }: { id: string; quantity: number; notes?: string }) =>
      adjustStock(id, quantity, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-items'] }); qc.invalidateQueries({ queryKey: ['stock-item'] }) },
  })
}

export function useDeactivateStockItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deactivateStockItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-items'] }),
  })
}
