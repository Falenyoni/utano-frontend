import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVisits, getVisitById, openVisit, updateVisit, triageVisit, completeVisit, type OpenVisitRequest, type UpdateVisitRequest, type TriageVisitRequest } from './visitsApi'

export function useVisits(params: { patientId?: string; doctorId?: string; date?: string; page?: number; pageSize?: number }) {
  return useQuery({ queryKey: ['visits', params], queryFn: () => getVisits(params) })
}

export function useVisit(id: string) {
  return useQuery({ queryKey: ['visits', id], queryFn: () => getVisitById(id), enabled: !!id })
}

export function useOpenVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: OpenVisitRequest) => openVisit(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  })
}

export function useUpdateVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...req }: { id: string } & UpdateVisitRequest) => updateVisit(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  })
}

export function useTriageVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...req }: { id: string } & TriageVisitRequest) => triageVisit(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  })
}

export function useCompleteVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => completeVisit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  })
}
