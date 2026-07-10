import { apiFetch } from '@/shared/lib/api/apiFetch'
import type { PatientFormValues } from './patientSchema'

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


export interface CreatePatientRequest {
  firstName: string
  lastName: string
  middleName: string | null
  dateOfBirth: string
  gender: string
  nationalId: string
  contacts: Array<{
    type: string
    phoneNumber: string
    email: string | null
    isPrimary: boolean
  }>
  addresses: Array<{
    type: string
    street: string
    suburb: string
    city: string
    country: string
    isPrimary: boolean
  }>
}

export interface Contact {
  id: string
  type: string
  phoneNumber: string
  email: string | null
  isPrimary: boolean
}

export interface Address {
  id: string
  type: string
  street: string
  suburb: string
  city: string
  country: string
  isPrimary: boolean
}

export interface PatientDetail {
  id: string
  fullName: string
  nationalId: string
  dateOfBirth: string
  gender: string
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  contacts: Contact[]
  addresses: Address[]
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

export async function getPatientById(id: string): Promise<PatientDetail> {
  const response = await apiFetch(`/api/patients/${id}`, { method: 'GET' })
  if (!response.ok) throw new Error('Failed to fetch patient')
  return response.json()
}

export function toCreatePatientRequest(values: PatientFormValues): CreatePatientRequest {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    middleName: values.middleName || null,
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    nationalId: values.nationalId,
    contacts: [
      {
        type: 'Mobile',
        phoneNumber: values.contact.phoneNumber,
        email: values.contact.email || null,
        isPrimary: true,
      },
    ],
    addresses: [
      {
        type: 'Residential',
        street: values.address.street,
        suburb: values.address.suburb,
        city: values.address.city,
        country: values.address.country,
        isPrimary: true,
      },
    ],
  }
}

export async function createPatient(values: PatientFormValues): Promise<Patient> {
  const response = await apiFetch('/api/patients', {
    method: 'POST',
    body: JSON.stringify(toCreatePatientRequest(values)),
  })

  if (!response.ok) {
    throw new Error('Failed to create patient')
  }

  return response.json()
}

export interface UpdatePatientRequest {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  notes: string | null
}

export async function updatePatient(request: UpdatePatientRequest): Promise<void> {
  const response = await apiFetch(`/api/patients/${request.id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
  if (!response.ok) throw new Error('Failed to update patient')
}

export async function deactivatePatient(id: string): Promise<void> {
  const response = await apiFetch(`/api/patients/${id}/deactivate`, { method: 'PUT' })
  if (!response.ok) throw new Error('Failed to deactivate patient')
}

export async function activatePatient(id: string): Promise<void> {
  const response = await apiFetch(`/api/patients/${id}/activate`, { method: 'PUT' })
  if (!response.ok) throw new Error('Failed to activate patient')
}