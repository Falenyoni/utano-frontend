import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMedicalAids,
  addMedicalAid,
  activateMedicalAid,
  deactivateMedicalAid,
} from './medicalAidsApi'

export function useMedicalAids() {
  return useQuery({
    queryKey: ['medical-aids'],
    queryFn: getMedicalAids,
  })
}

export function useAddMedicalAid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, code }: { name: string; code: string }) => addMedicalAid(name, code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical-aids'] }),
  })
}

export function useToggleMedicalAid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activate }: { id: string; activate: boolean }) =>
      activate ? activateMedicalAid(id) : deactivateMedicalAid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical-aids'] }),
  })
}
