import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface AvailableSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface DayScheduleDto {
  id: string
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  slotDurationMinutes: number
  isActive: boolean
}

export interface ScheduleExceptionDto {
  id: string
  date: string
  type: string
  startTime: string | null
  endTime: string | null
  reason: string | null
}

export interface DoctorScheduleResponse {
  schedule: DayScheduleDto[]
  exceptions: ScheduleExceptionDto[]
}

export interface DayScheduleInput {
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDurationMinutes?: number
  isActive?: boolean
}

export interface AddExceptionRequest {
  date: string
  type: 'Unavailable' | 'ModifiedHours'
  startTime?: string
  endTime?: string
  reason?: string
}

export async function getAvailableSlots(doctorId: string, date: string): Promise<AvailableSlot[]> {
  const res = await apiFetch(`/api/doctors/${doctorId}/available-slots?date=${date}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch available slots')
  return res.json()
}

export async function getDoctorSchedule(doctorId: string): Promise<DoctorScheduleResponse> {
  const res = await apiFetch(`/api/doctors/${doctorId}/schedule`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch doctor schedule')
  return res.json()
}

export async function setDoctorSchedule(doctorId: string, days: DayScheduleInput[]): Promise<void> {
  const res = await apiFetch(`/api/doctors/${doctorId}/schedule`, {
    method: 'PUT',
    body: JSON.stringify({ days }),
  })
  if (!res.ok) throw new Error('Failed to update schedule')
}

export async function addScheduleException(doctorId: string, request: AddExceptionRequest): Promise<string> {
  const res = await apiFetch(`/api/doctors/${doctorId}/schedule/exceptions`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error('Failed to add exception')
  return res.json()
}

export async function removeScheduleException(doctorId: string, exceptionId: string): Promise<void> {
  const res = await apiFetch(`/api/doctors/${doctorId}/schedule/exceptions/${exceptionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to remove exception')
}
