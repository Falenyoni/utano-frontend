import { useQuery } from '@tanstack/react-query'
import { getPatients, type GetPatientsParams } from './patientsApi'

export function usePatients(params: GetPatientsParams) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => getPatients(params),
  })
}
