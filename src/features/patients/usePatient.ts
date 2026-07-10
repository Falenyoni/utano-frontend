import { useQuery } from '@tanstack/react-query'
import { getPatientById } from './patientsApi'

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => getPatientById(id),
    enabled: !!id,
  })
}