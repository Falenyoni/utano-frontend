import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface AuditLogRow {
  id: string
  userName: string
  entityType: string
  entityId: string
  action: string
  description: string | null
  timestamp: string
}

export interface PagedAuditLog {
  data: AuditLogRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetAuditLogParams {
  entityType?: string
  entityId?: string
  action?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export async function getAuditLog(params: GetAuditLogParams): Promise<PagedAuditLog> {
  const q = new URLSearchParams()
  if (params.entityType) q.set('entityType', params.entityType)
  if (params.entityId) q.set('entityId', params.entityId)
  if (params.action) q.set('action', params.action)
  if (params.dateFrom) q.set('dateFrom', params.dateFrom)
  if (params.dateTo) q.set('dateTo', params.dateTo)
  q.set('page', String(params.page ?? 1))
  q.set('pageSize', String(params.pageSize ?? 50))
  const res = await apiFetch(`/api/admin/audit-log?${q}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch audit log')
  return res.json()
}
