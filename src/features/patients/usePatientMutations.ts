import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePatient, deactivatePatient, activatePatient } from './patientsApi'

export function useUpdatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePatient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useDeactivatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deactivatePatient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useActivatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: activatePatient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  })
}