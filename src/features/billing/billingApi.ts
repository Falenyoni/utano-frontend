import { apiFetch } from '@/shared/lib/api/apiFetch'

export interface InvoiceSummary {
  id: string
  invoiceNumber: string
  patientName: string
  doctorName: string | null
  status: string
  invoiceDate: string
  dueDate: string
  currency: string
  totalAmount: number
  amountPaid: number
  balanceDue: number
  visitId: string | null
  createdAt: string
  medicalAidId: string | null
  medicalAidName: string | null
  medAidClaimAmount: number
  medAidClaimStatus: string
}

export interface LineItemRow {
  id: string
  type: string
  description: string
  quantity: number
  unitPrice: number
  discountPercent: number
  amount: number
  stockItemId: string | null
}

export interface PaymentRow {
  id: string
  paymentDate: string
  amount: number
  method: string
  reference: string | null
  notes: string | null
  fiscalReceiptNumber: string | null
  createdAt: string
}

export interface InstallmentRow {
  id: string
  number: number
  dueDate: string
  amount: number
  paidAmount: number
  status: string
}

export interface PaymentPlanRow {
  id: string
  totalAmount: number
  amountPaid: number
  installmentCount: number
  frequency: string
  status: string
  startDate: string
  installments: InstallmentRow[]
}

export interface InvoiceDetail extends InvoiceSummary {
  patientId: string
  doctorId: string | null
  subTotal: number
  discountAmount: number
  taxAmount: number
  medicalAidId: string | null
  medicalAidName: string | null
  medAidClaimAmount: number
  medAidClaimStatus: string
  notes: string | null
  updatedAt: string
  lineItems: LineItemRow[]
  payments: PaymentRow[]
  paymentPlan: PaymentPlanRow | null
}

export interface PagedInvoices {
  data: InvoiceSummary[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export async function getInvoices(params: {
  patientName?: string; status?: string
  dateFrom?: string; dateTo?: string; page?: number; pageSize?: number
  hasMedicalAid?: boolean; medAidClaimStatus?: string; outstanding?: boolean
}): Promise<PagedInvoices> {
  const q = new URLSearchParams()
  if (params.patientName) q.set('patientName', params.patientName)
  if (params.status) q.set('status', params.status)
  if (params.dateFrom) q.set('dateFrom', params.dateFrom)
  if (params.dateTo) q.set('dateTo', params.dateTo)
  if (params.hasMedicalAid) q.set('hasMedicalAid', 'true')
  if (params.medAidClaimStatus) q.set('medAidClaimStatus', params.medAidClaimStatus)
  if (params.outstanding) q.set('outstanding', 'true')
  q.set('page', String(params.page ?? 1))
  q.set('pageSize', String(params.pageSize ?? 20))
  const res = await apiFetch(`/api/billing/invoices?${q}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch invoices')
  return res.json()
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
  const res = await apiFetch(`/api/billing/invoices/${id}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch invoice')
  return res.json()
}

export async function createInvoice(req: {
  patientId: string; patientName: string; doctorId?: string | null
  doctorName?: string | null; visitId?: string | null
  currency?: string; medicalAidId?: string | null; medicalAidName?: string | null; notes?: string | null
}): Promise<{ id: string; invoiceNumber: string }> {
  const res = await apiFetch('/api/billing/invoices', { method: 'POST', body: JSON.stringify(req) })
  if (!res.ok) throw new Error('Failed to create invoice')
  return res.json()
}

export async function addLineItem(invoiceId: string, req: {
  type: string; description: string; quantity: number
  unitPrice: number; discountPercent?: number; stockItemId?: string | null
}): Promise<{ lineItemId: string; amount: number; invoiceTotal: number }> {
  const res = await apiFetch(`/api/billing/invoices/${invoiceId}/line-items`, {
    method: 'POST', body: JSON.stringify({ discountPercent: 0, ...req })
  })
  if (!res.ok) throw new Error('Failed to add line item')
  return res.json()
}

export async function removeLineItem(invoiceId: string, lineItemId: string): Promise<void> {
  const res = await apiFetch(`/api/billing/invoices/${invoiceId}/line-items/${lineItemId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to remove line item')
}

export async function issueInvoice(id: string): Promise<void> {
  const res = await apiFetch(`/api/billing/invoices/${id}/issue`, { method: 'PUT' })
  if (!res.ok) throw new Error('Failed to issue invoice')
}

export async function voidInvoice(id: string): Promise<void> {
  const res = await apiFetch(`/api/billing/invoices/${id}/void`, { method: 'PUT' })
  if (!res.ok) throw new Error('Failed to void invoice')
}

export async function recordPayment(invoiceId: string, req: {
  amount: number; method: string; reference?: string | null
  notes?: string | null; installmentId?: string | null
}): Promise<{ paymentId: string; balanceDue: number; invoiceStatus: string }> {
  const res = await apiFetch(`/api/billing/invoices/${invoiceId}/payments`, {
    method: 'POST', body: JSON.stringify(req)
  })
  if (!res.ok) throw new Error('Failed to record payment')
  return res.json()
}

export async function createPaymentPlan(invoiceId: string, req: {
  installmentCount: number; frequency: string; startDate: string; notes?: string | null
}): Promise<{ planId: string; installmentCount: number; totalAmount: number; perInstallment: number }> {
  const res = await apiFetch(`/api/billing/invoices/${invoiceId}/payment-plan`, {
    method: 'POST', body: JSON.stringify(req)
  })
  if (!res.ok) throw new Error('Failed to create payment plan')
  return res.json()
}

export async function submitClaim(invoiceId: string, claimAmount: number): Promise<void> {
  const res = await apiFetch(`/api/billing/invoices/${invoiceId}/submit-claim`, {
    method: 'PUT', body: JSON.stringify({ claimAmount }),
  })
  if (!res.ok) throw new Error('Failed to submit claim')
}

export async function updateClaimStatus(invoiceId: string, status: 'Approved' | 'Rejected'): Promise<void> {
  const res = await apiFetch(`/api/billing/invoices/${invoiceId}/claim-status`, {
    method: 'PUT', body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update claim status')
}

export interface RevenueSummary {
  totalInvoiced: number
  totalCollected: number
  totalOutstanding: number
  invoiceCount: number
  paidCount: number
  outstandingCount: number
  byMonth: { month: string; invoiced: number; collected: number }[]
}

export async function getRevenueSummary(params: { dateFrom?: string; dateTo?: string }): Promise<RevenueSummary> {
  const q = new URLSearchParams()
  if (params.dateFrom) q.set('dateFrom', params.dateFrom)
  if (params.dateTo) q.set('dateTo', params.dateTo)
  const res = await apiFetch(`/api/billing/reports/revenue?${q}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch revenue summary')
  return res.json()
}

export interface VisitsByDoctorRow {
  doctorName: string
  total: number
  completed: number
  inProgress: number
}

export async function getVisitsByDoctor(params: { dateFrom?: string; dateTo?: string }): Promise<VisitsByDoctorRow[]> {
  const q = new URLSearchParams()
  if (params.dateFrom) q.set('dateFrom', params.dateFrom)
  if (params.dateTo) q.set('dateTo', params.dateTo)
  const res = await apiFetch(`/api/clinical/reports/visits-by-doctor?${q}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch visits by doctor')
  return res.json()
}

export interface GenderBreakdown { male: number; female: number; other: number; unknown: number }
export interface AgeGroupBreakdown { under18: number; age18to35: number; age36to50: number; age51to65: number; over65: number; unknown: number }
export interface DoctorDemographicsRow { doctorName: string; total: number; gender: GenderBreakdown; ageGroups: AgeGroupBreakdown }
export interface VisitDemographics {
  overallGender: GenderBreakdown
  overallAgeGroups: AgeGroupBreakdown
  byDoctor: DoctorDemographicsRow[]
}

export async function getVisitDemographics(params: { dateFrom?: string; dateTo?: string }): Promise<VisitDemographics> {
  const q = new URLSearchParams()
  if (params.dateFrom) q.set('dateFrom', params.dateFrom)
  if (params.dateTo) q.set('dateTo', params.dateTo)
  const res = await apiFetch(`/api/clinical/reports/visit-demographics?${q}`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to fetch visit demographics')
  return res.json()
}
