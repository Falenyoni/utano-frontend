import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addLineItem, createInvoice, createPaymentPlan, getInvoice, getInvoices,
  issueInvoice, recordPayment, removeLineItem, voidInvoice,
} from './billingApi'

export function useInvoices(params: Parameters<typeof getInvoices>[0]) {
  return useQuery({ queryKey: ['invoices', params], queryFn: () => getInvoices(params) })
}

export function useInvoice(id: string) {
  return useQuery({ queryKey: ['invoice', id], queryFn: () => getInvoice(id), enabled: !!id })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createInvoice, onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }) })
}

export function useAddLineItem(invoiceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: Parameters<typeof addLineItem>[1]) => addLineItem(invoiceId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice', invoiceId] }),
  })
}

export function useRemoveLineItem(invoiceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lineItemId: string) => removeLineItem(invoiceId, lineItemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice', invoiceId] }),
  })
}

export function useIssueInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: issueInvoice,
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ['invoice', id] }); qc.invalidateQueries({ queryKey: ['invoices'] }) },
  })
}

export function useVoidInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: voidInvoice,
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ['invoice', id] }); qc.invalidateQueries({ queryKey: ['invoices'] }) },
  })
}

export function useRecordPayment(invoiceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: Parameters<typeof recordPayment>[1]) => recordPayment(invoiceId, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoice', invoiceId] }); qc.invalidateQueries({ queryKey: ['invoices'] }) },
  })
}

export function useCreatePaymentPlan(invoiceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: Parameters<typeof createPaymentPlan>[1]) => createPaymentPlan(invoiceId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice', invoiceId] }),
  })
}
