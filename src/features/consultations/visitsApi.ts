import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface VisitSummary {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  visitDate: string
  diagnosis: string | null
  status: string
  createdAt: string
}

export interface VisitDetail {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  visitDate: string
  department: string | null
  bloodPressureSystolic: number | null
  bloodPressureDiastolic: number | null
  weightKg: number | null
  heightCm: number | null
  temperatureCelsius: number | null
  pulseRate: number | null
  oxygenSaturation: number | null
  chiefComplaint: string | null
  symptoms: string | null
  diagnosis: string | null
  treatment: string | null
  prescription: string | null
  notes: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface PagedVisits {
  data: VisitSummary[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface OpenVisitRequest {
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  visitDate: string
  department?: string | null
  appointmentId?: string
  patientGender?: string
  patientDateOfBirth?: string
}

export interface TriageVisitRequest {
  bloodPressureSystolic: number | null
  bloodPressureDiastolic: number | null
  weightKg: number | null
  heightCm: number | null
  temperatureCelsius: number | null
  pulseRate: number | null
  oxygenSaturation: number | null
  chiefComplaint: string | null
}

export interface UpdateVisitRequest {
  chiefComplaint: string | null
  symptoms: string | null
  diagnosis: string | null
  treatment: string | null
  prescription: string | null
  notes: string | null
  department: string | null
}

export async function getVisits(params: { patientId?: string; doctorId?: string; date?: string; page?: number; pageSize?: number }): Promise<PagedVisits> {
  const q = new URLSearchParams()
  if (params.patientId) q.set('patientId', params.patientId)
  if (params.doctorId) q.set('doctorId', params.doctorId)
  if (params.date) q.set('date', params.date)
  q.set('page', String(params.page ?? 1))
  q.set('pageSize', String(params.pageSize ?? 20))
  const res = await apiFetch(`/api/visits?${q}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch visits')
  return res.json()
}

export async function getVisitById(id: string): Promise<VisitDetail> {
  const res = await apiFetch(`/api/visits/${id}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch visit')
  return res.json()
}

export async function openVisit(request: OpenVisitRequest): Promise<{ id: string }> {
  const res = await apiFetch('/api/visits', { method: 'POST', body: JSON.stringify(request) })
  if (!res.ok) throw new Error('Failed to open visit')
  return res.json()
}

export async function updateVisit(id: string, request: UpdateVisitRequest): Promise<void> {
  const res = await apiFetch(`/api/visits/${id}`, { method: 'PUT', body: JSON.stringify(request) })
  if (!res.ok) throw new Error('Failed to update visit')
}

export async function triageVisit(id: string, request: TriageVisitRequest): Promise<void> {
  const res = await apiFetch(`/api/visits/${id}/triage`, { method: 'PUT', body: JSON.stringify(request) })
  if (!res.ok) throw new Error('Failed to save triage')
}

export async function completeVisit(id: string): Promise<void> {
  const res = await apiFetch(`/api/visits/${id}/complete`, { method: 'PUT' })
  if (!res.ok) throw new Error('Failed to complete visit')
}
