import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface Patient {
  id: string
  fullName: string
  nationalId: string
  status: string
  // add more fields here as your backend returns them
}

export interface PagedPatients {
  data: Patient[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface GetPatientsParams {
  searchTerm?: string
  status?: string
  page?: number
  pageSize?: number
}

export async function getPatients(params: GetPatientsParams): Promise<PagedPatients> {
  const query = new URLSearchParams()

  if (params.searchTerm) query.set('searchTerm', params.searchTerm)
  if (params.status) query.set('status', params.status)
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 20))

  const response = await apiFetch(`/api/patients?${query.toString()}`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch patients')
  }

  return response.json()
}