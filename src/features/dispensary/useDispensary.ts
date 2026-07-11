import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dispensePrescriptionFromQueue, getDispensaryQueue } from './dispensaryApi'

export function useDispensaryQueue() {
  return useQuery({
    queryKey: ['dispensary'],
    queryFn: getDispensaryQueue,
    refetchInterval: 30_000,
  })
}

export function useDispenserDispense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ visitId, prescriptionId, quantityOverride }: { visitId: string; prescriptionId: string; quantityOverride?: number }) =>
      dispensePrescriptionFromQueue(visitId, prescriptionId, quantityOverride),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispensary'] })
      qc.invalidateQueries({ queryKey: ['stock-items'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
