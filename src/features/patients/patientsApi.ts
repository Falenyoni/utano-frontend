import { apiFetch } from '@/shared/lib/api/apiFetch'
import type { PatientFormValues } from './patientSchema'

export interface Patient {
  id: string
  fullName: string
  nationalId: string
  dateOfBirth: string
  gender: string
  status: string
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
    suburb: string | null
    city: string
    country: string
    isPrimary: boolean
  }>
  medicalAidId: string | null
  medicalAidNumber: string | null
  bloodGroup: string | null
  allergies: string | null
  chronicConditions: string | null
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
  suburb: string | null
  city: string
  country: string
  isPrimary: boolean
}

export interface PatientDetail {
  id: string
  fullName: string
  firstName: string
  lastName: string
  middleName: string | null
  nationalId: string
  dateOfBirth: string
  gender: string
  status: string
  notes: string | null
  bloodGroup: string | null
  allergies: string | null
  chronicConditions: string | null
  medicalAidId: string | null
  medicalAidName: string | null
  medicalAidNumber: string | null
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

  const response = await apiFetch(`/api/patients?${query.toString()}`, { method: 'GET' })
  if (!response.ok) throw new Error('Failed to fetch patients')
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
        suburb: values.address.suburb || null,
        city: values.address.city,
        country: values.address.country,
        isPrimary: true,
      },
    ],
    medicalAidId: values.medicalAidId || null,
    medicalAidNumber: values.medicalAidNumber || null,
    bloodGroup: values.bloodGroup || null,
    allergies: values.allergies || null,
    chronicConditions: values.chronicConditions || null,
  }
}

export async function createPatient(values: PatientFormValues): Promise<{ id: string }> {
  const response = await apiFetch('/api/patients', {
    method: 'POST',
    body: JSON.stringify(toCreatePatientRequest(values)),
  })
  if (!response.ok) throw new Error('Failed to create patient')
  return response.json()
}

export interface QuickRegisterRequest {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  nationalId: string
  phoneNumber: string
}

export async function quickRegisterPatient(req: QuickRegisterRequest): Promise<{ id: string; fullName: string }> {
  const response = await apiFetch('/api/patients', {
    method: 'POST',
    body: JSON.stringify({
      firstName: req.firstName,
      lastName: req.lastName,
      middleName: null,
      dateOfBirth: req.dateOfBirth,
      gender: req.gender,
      nationalId: req.nationalId,
      contacts: [{ type: 'Mobile', phoneNumber: req.phoneNumber, email: null, isPrimary: true }],
      addresses: [],
      medicalAidId: null,
      medicalAidNumber: null,
      bloodGroup: null,
      allergies: null,
      chronicConditions: null,
    }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const msg = body?.errors
      ? Object.values(body.errors as Record<string, string[]>).flat().join(', ')
      : 'Failed to register patient'
    throw new Error(msg)
  }
  return response.json()
}

export interface UpdatePatientRequest {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  notes: string | null
  medicalAidId: string | null
  medicalAidNumber: string | null
  bloodGroup: string | null
  allergies: string | null
  chronicConditions: string | null
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

export async function addContact(
  patientId: string,
  body: { type: string; phoneNumber: string; email: string | null; isPrimary: boolean },
): Promise<{ id: string }> {
  const response = await apiFetch(`/api/patients/${patientId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('Failed to add contact')
  return response.json()
}

export async function updateContact(
  patientId: string,
  contactId: string,
  body: { type: string; phoneNumber: string; email: string | null },
): Promise<void> {
  const response = await apiFetch(`/api/patients/${patientId}/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('Failed to update contact')
}

export async function addAddress(
  patientId: string,
  body: { type: string; street: string; city: string; country: string; suburb: string | null; isPrimary: boolean },
): Promise<{ id: string }> {
  const response = await apiFetch(`/api/patients/${patientId}/addresses`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('Failed to add address')
  return response.json()
}

export async function updateAddress(
  patientId: string,
  addressId: string,
  body: { type: string; street: string; city: string; country: string; suburb: string | null },
): Promise<void> {
  const response = await apiFetch(`/api/patients/${patientId}/addresses/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('Failed to update address')
}
