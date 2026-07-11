import { useQuery } from '@tanstack/react-query'
import { getPatients, type GetPatientsParams } from './patientsApi'

export function usePatients(params: GetPatientsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => getPatients(params),
    enabled: options?.enabled ?? true,
  })
}
