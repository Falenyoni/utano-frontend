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
    mutationFn: ({ visitId, prescriptionId }: { visitId: string; prescriptionId: string }) =>
      dispensePrescriptionFromQueue(visitId, prescriptionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispensary'] })
      qc.invalidateQueries({ queryKey: ['stock-items'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
