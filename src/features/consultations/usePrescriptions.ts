import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addPrescription,
  dispensePrescription,
  getPrescriptions,
  removePrescription,
  type AddPrescriptionRequest,
} from './prescriptionsApi'

export function usePrescriptions(visitId: string) {
  return useQuery({
    queryKey: ['prescriptions', visitId],
    queryFn: () => getPrescriptions(visitId),
    enabled: !!visitId,
  })
}

export function useAddPrescription(visitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddPrescriptionRequest) => addPrescription(visitId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions', visitId] }),
  })
}

export function useDispensePrescription(visitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prescriptionId: string) => dispensePrescription(visitId, prescriptionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions', visitId] })
      qc.invalidateQueries({ queryKey: ['stock-items'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useRemovePrescription(visitId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prescriptionId: string) => removePrescription(visitId, prescriptionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions', visitId] }),
  })
}
