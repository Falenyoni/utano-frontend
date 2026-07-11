import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useInvoice, useAddLineItem, useRemoveLineItem, useIssueInvoice, useVoidInvoice, useRecordPayment, useCreatePaymentPlan } from './useBilling'
import type { InstallmentRow } from './billingApi'

const PAYMENT_METHODS = ['Cash', 'EcoCash', 'ZIPIT', 'ZimSwitch', 'Card', 'MedicalAid', 'BankTransfer']
const LINE_ITEM_TYPES = ['Consultation', 'Medication', 'Procedure', 'Laboratory', 'Other']
const PLAN_FREQUENCIES = ['Weekly', 'Biweekly', 'Monthly']

const statusColor: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  PartiallyPaid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Paid: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Void: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
}

const claimStatusColor: Record<string, string> = {
  None: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const installmentStatusColor: Record<string, string> = {
  Pending: 'text-gray-500 dark:text-gray-400',
  Paid: 'text-green-600 dark:text-green-400',
  Overdue: 'text-red-500 dark:text-red-400',
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-ZW', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}

const inputCls =
  'w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: invoice, isLoading } = useInvoice(id!)

  const addLineItem = useAddLineItem(id!)
  const removeLineItem = useRemoveLineItem(id!)
  const issueInvoice = useIssueInvoice()
  const voidInvoice = useVoidInvoice()
  const recordPayment = useRecordPayment(id!)
  const createPaymentPlan = useCreatePaymentPlan(id!)

  const [showAddLine, setShowAddLine] = useState(false)
  const [lineType, setLineType] = useState('Consultation')
  const [lineDesc, setLineDesc] = useState('')
  const [lineQty, setLineQty] = useState('1')
  const [linePrice, setLinePrice] = useState('')
  const [lineDiscount, setLineDiscount] = useState('0')
  const [lineError, setLineError] = useState('')

  const [showPayment, setShowPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Cash')
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [payInstallmentId, setPayInstallmentId] = useState('')
  const [payError, setPayError] = useState('')

  const [showPlan, setShowPlan] = useState(false)
  const [planCount, setPlanCount] = useState('3')
  const [planFreq, setPlanFreq] = useState('Monthly')
  const [planStart, setPlanStart] = useState(new Date().toISOString().slice(0, 10))
  const [planNotes, setPlanNotes] = useState('')
  const [planError, setPlanError] = useState('')
  const [planPreview, setPlanPreview] = useState<{ perInstallment: number } | null>(null)

  function handleAddLine(e: React.FormEvent) {
    e.preventDefault()
    setLineError('')
    if (!lineDesc.trim()) { setLineError('Description is required'); return }
    const price = Number(linePrice)
    if (!price || price <= 0) { setLineError('Enter a valid price'); return }
    addLineItem.mutate(
      { type: lineType, description: lineDesc, quantity: Number(lineQty), unitPrice: price, discountPercent: Number(lineDiscount) },
      {
        onSuccess: () => { setShowAddLine(false); setLineDesc(''); setLinePrice(''); setLineQty('1'); setLineDiscount('0') },
        onError: (err) => setLineError(err.message),
      },
    )
  }

  function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    setPayError('')
    const amount = Number(payAmount)
    if (!amount || amount <= 0) { setPayError('Enter a valid amount'); return }
    recordPayment.mutate(
      { amount, method: payMethod, reference: payRef || null, notes: payNotes || null, installmentId: payInstallmentId || null },
      {
        onSuccess: () => { setShowPayment(false); setPayAmount(''); setPayRef(''); setPayNotes(''); setPayInstallmentId('') },
        onError: (err) => setPayError(err.message),
      },
    )
  }

  function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault()
    setPlanError('')
    const count = Number(planCount)
    if (count < 2 || count > 24) { setPlanError('Installments must be 2–24'); return }
    createPaymentPlan.mutate(
      { installmentCount: count, frequency: planFreq, startDate: planStart, notes: planNotes || null },
      {
        onSuccess: (r) => { setPlanPreview(r); setShowPlan(false) },
        onError: (err) => setPlanError(err.message),
      },
    )
  }

  if (isLoading) return <div className="p-6 text-gray-400 dark:text-gray-500">Loading...</div>
  if (!invoice) return <div className="p-6 text-red-500 dark:text-red-400">Invoice not found.</div>

  const canEdit = invoice.status === 'Draft'
  const canPay = invoice.status === 'Issued' || invoice.status === 'PartiallyPaid'
  const pendingInstallments = invoice.paymentPlan?.installments.filter(
    (i: InstallmentRow) => i.status === 'Pending' || i.status === 'Overdue'
  ) ?? []

  const medAidPaymentsTotal = invoice.payments
    .filter((p) => p.method === 'MedicalAid')
    .reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/billing" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">← Billing</Link>
          <h1 className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">{invoice.invoiceNumber}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[invoice.status] ?? statusColor.Draft}`}>
              {invoice.status}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{invoice.patientName}</span>
            {invoice.doctorName && <span className="text-sm text-gray-400 dark:text-gray-500">· {invoice.doctorName}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <button onClick={() => issueInvoice.mutate(invoice.id)}
              disabled={issueInvoice.isPending || invoice.lineItems.length === 0}
              className="text-sm px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Issue Invoice
            </button>
          )}
          {canPay && (
            <button onClick={() => setShowPayment(true)}
              className="text-sm px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Record Payment
            </button>
          )}
          {(invoice.status === 'Draft' || invoice.status === 'Issued') && (
            <button
              onClick={() => { if (confirm('Void this invoice?')) voidInvoice.mutate(invoice.id) }}
              className="text-sm px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900"
            >
              Void
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">Total</p>
          <p className="text-xl font-bold mt-1 text-gray-900 dark:text-gray-100">{formatCurrency(invoice.totalAmount)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">Paid</p>
          <p className="text-xl font-bold mt-1 text-green-600 dark:text-green-400">{formatCurrency(invoice.amountPaid)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">Balance Due</p>
          <p className={`text-xl font-bold mt-1 ${invoice.balanceDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {formatCurrency(invoice.balanceDue)}
          </p>
          {invoice.dueDate && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Medical Aid Section */}
      {invoice.medicalAidId && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Medical Aid</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${claimStatusColor[invoice.medAidClaimStatus] ?? claimStatusColor.None}`}>
              {invoice.medAidClaimStatus === 'None' ? 'No Claim' : invoice.medAidClaimStatus}
            </span>
          </div>
          <div className="px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Scheme</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{invoice.medicalAidName}</span>
            </div>
            {invoice.medAidClaimAmount > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Claim Amount</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(invoice.medAidClaimAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Patient Portion</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(invoice.totalAmount - invoice.medAidClaimAmount)}</span>
                </div>
                {medAidPaymentsTotal > 0 && (
                  <>
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-2" />
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Med Aid Paid</span>
                      <span className="text-green-600 dark:text-green-400">{formatCurrency(medAidPaymentsTotal)}</span>
                    </div>
                    {invoice.medAidClaimAmount - medAidPaymentsTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Shortfall</span>
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {formatCurrency(invoice.medAidClaimAmount - medAidPaymentsTotal)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {invoice.medAidClaimStatus === 'None' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
                No claim submitted yet. Go to{' '}
                <Link to="/claims" className="text-blue-600 dark:text-blue-400 hover:underline">Claims</Link>{' '}
                to submit.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Line Items</h2>
          {canEdit && (
            <button onClick={() => setShowAddLine(true)}
              className="text-sm px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800">
              + Add Item
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Unit Price</th>
              <th className="px-4 py-3 font-medium text-right">Disc%</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              {canEdit && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.length === 0 && (
              <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">No line items yet</td></tr>
            )}
            {invoice.lineItems.map((li) => (
              <tr key={li.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{li.description}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{li.type}</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{li.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{formatCurrency(li.unitPrice)}</td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{li.discountPercent > 0 ? `${li.discountPercent}%` : '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">{formatCurrency(li.amount)}</td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <button onClick={() => removeLineItem.mutate(li.id)}
                      className="text-xs text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400">Remove</button>
                  </td>
                )}
              </tr>
            ))}
            {invoice.lineItems.length > 0 && (
              <tr className="bg-gray-50 dark:bg-gray-800 font-medium">
                <td colSpan={5} className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">Total</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{formatCurrency(invoice.totalAmount)}</td>
                {canEdit && <td></td>}
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Payment Plan */}
      {invoice.paymentPlan ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Payment Plan</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              invoice.paymentPlan.status === 'Completed'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            }`}>
              {invoice.paymentPlan.status}
            </span>
          </div>
          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
            {invoice.paymentPlan.installmentCount} installments · {invoice.paymentPlan.frequency} ·
            Paid {formatCurrency(invoice.paymentPlan.amountPaid)} of {formatCurrency(invoice.paymentPlan.totalAmount)}
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Paid</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canPay && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {invoice.paymentPlan.installments.map((inst: InstallmentRow) => (
                <tr key={inst.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inst.number}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{new Date(inst.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{formatCurrency(inst.amount)}</td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{formatCurrency(inst.paidAmount)}</td>
                  <td className={`px-4 py-3 font-medium text-sm ${installmentStatusColor[inst.status] ?? 'text-gray-500'}`}>
                    {inst.status}
                  </td>
                  {canPay && (
                    <td className="px-4 py-3">
                      {inst.status !== 'Paid' && (
                        <button
                          onClick={() => {
                            setPayInstallmentId(inst.id)
                            setPayAmount(String(inst.amount - inst.paidAmount))
                            setShowPayment(true)
                          }}
                          className="text-xs px-2 py-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900"
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        canPay && invoice.balanceDue > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Payment Plan</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Allow the patient to pay in installments</p>
            </div>
            <button onClick={() => setShowPlan(true)}
              className="text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              Create Plan
            </button>
          </div>
        )
      )}

      {/* Payments History */}
      {invoice.payments.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Payments</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{p.method}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.reference ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">{p.fiscalReceiptNumber ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Add Line Item Modal */}
      {showAddLine && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-md mx-4 sm:mx-0">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Line Item</h2>
            <form onSubmit={handleAddLine} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
                <select value={lineType} onChange={(e) => setLineType(e.target.value)} className={inputCls}>
                  {LINE_ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description *</label>
                <input value={lineDesc} onChange={(e) => setLineDesc(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Qty</label>
                  <input type="number" min={1} value={lineQty} onChange={(e) => setLineQty(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Unit Price *</label>
                  <input type="number" min={0} step="0.01" value={linePrice} onChange={(e) => setLinePrice(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Disc%</label>
                  <input type="number" min={0} max={100} value={lineDiscount} onChange={(e) => setLineDiscount(e.target.value)} className={inputCls} />
                </div>
              </div>
              {linePrice && lineQty && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Amount: {formatCurrency(Number(lineQty) * Number(linePrice) * (1 - Number(lineDiscount) / 100))}
                </p>
              )}
              {lineError && <p className="text-red-500 dark:text-red-400 text-sm">{lineError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAddLine(false)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancel
                </button>
                <button type="submit" disabled={addLineItem.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                  {addLineItem.isPending ? 'Saving...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-sm mx-4 sm:mx-0">
            <h2 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">Record Payment</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Balance due: {formatCurrency(invoice.balanceDue)}</p>
            <form onSubmit={handlePayment} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount (USD) *</label>
                <input type="number" min={0.01} step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={inputCls}>
                  {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reference / Transaction ID</label>
                <input value={payRef} onChange={(e) => setPayRef(e.target.value)} className={inputCls} />
              </div>
              {pendingInstallments.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Apply to Installment</label>
                  <select value={payInstallmentId} onChange={(e) => setPayInstallmentId(e.target.value)} className={inputCls}>
                    <option value="">— General payment —</option>
                    {pendingInstallments.map((i: InstallmentRow) => (
                      <option key={i.id} value={i.id}>
                        #{i.number} due {new Date(i.dueDate).toLocaleDateString()} ({formatCurrency(i.amount - i.paidAmount)} remaining)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</label>
                <input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className={inputCls} />
              </div>
              {payError && <p className="text-red-500 dark:text-red-400 text-sm">{payError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowPayment(false); setPayInstallmentId('') }}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancel
                </button>
                <button type="submit" disabled={recordPayment.isPending}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">
                  {recordPayment.isPending ? 'Saving...' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Payment Plan Modal */}
      {showPlan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-sm mx-4 sm:mx-0">
            <h2 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">Create Payment Plan</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Balance: {formatCurrency(invoice.balanceDue)}</p>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Installments (2–24)</label>
                  <input type="number" min={2} max={24} value={planCount}
                    onChange={(e) => {
                      setPlanCount(e.target.value)
                      const n = Number(e.target.value)
                      if (n >= 2 && n <= 24) {
                        setPlanPreview({ perInstallment: Math.floor((invoice.balanceDue / n) * 100) / 100 })
                      }
                    }}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Frequency</label>
                  <select value={planFreq} onChange={(e) => setPlanFreq(e.target.value)} className={inputCls}>
                    {PLAN_FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">First Payment Date</label>
                <input type="date" value={planStart} onChange={(e) => setPlanStart(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</label>
                <input value={planNotes} onChange={(e) => setPlanNotes(e.target.value)} className={inputCls} />
              </div>
              {planPreview && (
                <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-2 rounded-lg">
                  ~{formatCurrency(planPreview.perInstallment)} per installment
                </p>
              )}
              {planError && <p className="text-red-500 dark:text-red-400 text-sm">{planError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowPlan(false)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancel
                </button>
                <button type="submit" disabled={createPaymentPlan.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                  {createPaymentPlan.isPending ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
