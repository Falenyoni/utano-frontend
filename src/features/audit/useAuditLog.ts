import { useQuery } from '@tanstack/react-query'
import { getAuditLog, type GetAuditLogParams } from './auditApi'

export function useAuditLog(params: GetAuditLogParams) {
  return useQuery({
    queryKey: ['audit-log', params],
    queryFn: () => getAuditLog(params),
  })
}
