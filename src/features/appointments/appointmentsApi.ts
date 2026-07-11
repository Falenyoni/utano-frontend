import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface AppointmentSummary {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  appointmentDate: string
  startTime: string
  endTime: string
  type: string
  status: string
  notes: string | null
  createdAt: string
}

export interface AppointmentDetail extends AppointmentSummary {
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
}

export interface PagedAppointments {
  data: AppointmentSummary[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface GetAppointmentsParams {
  date?: string
  patientId?: string
  doctorId?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface BookAppointmentRequest {
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  appointmentDate: string
  startTime: string
  endTime: string
  type: string
  notes?: string | null
}

export interface Doctor {
  id: string
  fullName: string
  email: string
}

export async function getDoctors(): Promise<Doctor[]> {
  const res = await apiFetch('/api/users/doctors', { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch doctors')
  return res.json()
}

export async function getAppointments(params: GetAppointmentsParams): Promise<PagedAppointments> {
  const query = new URLSearchParams()
  if (params.date) query.set('date', params.date)
  if (params.patientId) query.set('patientId', params.patientId)
  if (params.doctorId) query.set('doctorId', params.doctorId)
  if (params.status) query.set('status', params.status)
  query.set('page', String(params.page ?? 1))
  query.set('pageSize', String(params.pageSize ?? 20))

  const res = await apiFetch(`/api/appointments?${query.toString()}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch appointments')
  return res.json()
}

export async function getAppointmentById(id: string): Promise<AppointmentDetail> {
  const res = await apiFetch(`/api/appointments/${id}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch appointment')
  return res.json()
}

export async function bookAppointment(request: BookAppointmentRequest): Promise<AppointmentDetail> {
  const res = await apiFetch('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.detail ?? 'Failed to book appointment')
  }
  return res.json()
}

export async function cancelAppointment(id: string, reason: string): Promise<void> {
  const res = await apiFetch(`/api/appointments/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error('Failed to cancel appointment')
}

export async function rescheduleAppointment(
  id: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
): Promise<void> {
  const res = await apiFetch(`/api/appointments/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify({ newDate, newStartTime, newEndTime }),
  })
  if (!res.ok) throw new Error('Failed to reschedule appointment')
}
