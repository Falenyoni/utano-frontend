import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePatient, deactivatePatient, activatePatient, addContact, updateContact, addAddress, updateAddress } from './patientsApi'

export function useUpdatePatient(patientId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      if (patientId) queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
    },
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

export function useAddContact(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { type: string; phoneNumber: string; email: string | null; isPrimary: boolean }) =>
      addContact(patientId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient', patientId] }),
  })
}

export function useUpdateContact(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contactId, ...body }: { contactId: string; type: string; phoneNumber: string; email: string | null }) =>
      updateContact(patientId, contactId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient', patientId] }),
  })
}

export function useAddAddress(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { type: string; street: string; city: string; country: string; suburb: string | null; isPrimary: boolean }) =>
      addAddress(patientId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient', patientId] }),
  })
}

export function useUpdateAddress(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ addressId, ...body }: { addressId: string; type: string; street: string; city: string; country: string; suburb: string | null }) =>
      updateAddress(patientId, addressId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient', patientId] }),
  })
}