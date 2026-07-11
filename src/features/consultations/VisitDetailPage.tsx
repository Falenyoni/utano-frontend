import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useVisit, useTriageVisit, useUpdateVisit, useCompleteVisit } from './useVisits'
import { usePrescriptions, useAddPrescription, useRemovePrescription } from './usePrescriptions'
import { useStockItems } from '@/features/inventory/useInventory'
import type { TriageVisitRequest, UpdateVisitRequest } from './visitsApi'
import type { PrescriptionRow } from './prescriptionsApi'
import type { StockItemSummary } from '@/features/inventory/inventoryApi'

const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'
const inputClass = 'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
const textareaClass = `${inputClass} resize-none`

const statusColors: Record<string, string> = {
  InProgress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Triaged: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{value ?? '—'}</p>
    </div>
  )
}

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl p-4 sm:p-6 space-y-4 mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function AddPrescriptionModal({ visitId, onClose }: { visitId: string; onClose: () => void }) {
  const [stockSearch, setStockSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<StockItemSummary | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [dosageInstructions, setDosageInstructions] = useState('')
  const [error, setError] = useState('')

  const { data: stockData } = useStockItems({ search: stockSearch, activeOnly: true, pageSize: 10 })
  const addPrescription = useAddPrescription(visitId)

  function handleSelectItem(item: StockItemSummary) {
    setSelectedItem(item)
    setStockSearch('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selectedItem) { setError('Select a medication from inventory'); return }
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) { setError('Quantity must be greater than 0'); return }

    try {
      await addPrescription.mutateAsync({
        stockItemId: selectedItem.id,
        quantity: qty,
        dosageInstructions: dosageInstructions.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add prescription')
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Add Prescription</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className={labelClass}>Medication</label>
          {selectedItem ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedItem.name}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">
                  {selectedItem.quantityOnHand} {selectedItem.unit} in stock
                  {selectedItem.isLowStock && <span className="ml-1 text-amber-500">· Low stock</span>}
                </span>
              </div>
              <button type="button" onClick={() => setSelectedItem(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-2">Change</button>
            </div>
          ) : (
            <div className="relative">
              <input value={stockSearch} onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Search by name..." className={inputClass} autoComplete="off" autoFocus />
              {stockSearch && stockData && stockData.data.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {stockData.data.map((item) => (
                    <button key={item.id} type="button" onClick={() => handleSelectItem(item)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-gray-900 dark:text-gray-100">{item.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">
                        {item.quantityOnHand} {item.unit}
                        {item.isLowStock && <span className="ml-1 text-amber-500">Low stock</span>}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Quantity</label>
          <input type="number" step="0.5" min="0.5" value={quantity}
            onChange={(e) => setQuantity(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Dosage Instructions (optional)</label>
          <textarea value={dosageInstructions} onChange={(e) => setDosageInstructions(e.target.value)}
            rows={2} placeholder="e.g. Take 1 tablet twice daily after meals for 7 days" className={textareaClass} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={addPrescription.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50">
            {addPrescription.isPending ? 'Adding...' : 'Add Prescription'}
          </button>
          <button type="button" onClick={onClose}
            className="border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            Cancel
          </button>
        </div>
      </form>
    </ModalBackdrop>
  )
}

function PrescriptionsSection({ visitId, isCompleted }: { visitId: string; isCompleted: boolean }) {
  const [showAdd, setShowAdd] = useState(false)
  const { data: prescriptions, isLoading } = usePrescriptions(visitId)
  const remove = useRemovePrescription(visitId)

  async function handleRemove(p: PrescriptionRow) {
    if (!confirm(`Remove prescription for "${p.description}"?`)) return
    await remove.mutateAsync(p.id)
  }

  return (
    <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
      {showAdd && <AddPrescriptionModal visitId={visitId} onClose={() => setShowAdd(false)} />}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prescriptions</h3>
        {!isCompleted && (
          <button onClick={() => setShowAdd(true)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">+ Add</button>
        )}
      </div>
      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      {!isLoading && (!prescriptions || prescriptions.length === 0) && (
        <p className="text-sm text-gray-400">No prescriptions recorded.</p>
      )}
      {prescriptions && prescriptions.length > 0 && (
        <div className="space-y-2">
          {prescriptions.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="flex-1 min-w-0 text-sm space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{p.description}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                    p.status === 'Dispensed' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                    : p.status === 'PartiallyDispensed' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                    : p.status === 'External' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}>
                    {p.status === 'PartiallyDispensed' ? 'Partial' : p.status}
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  Qty: {p.quantity}
                  {p.quantityDispensed != null && p.quantityDispensed < p.quantity &&
                    ` · ${p.quantityDispensed} dispensed, ${p.quantity - p.quantityDispensed} external`}
                </div>
                {p.dosageInstructions && (
                  <div className="text-gray-500 dark:text-gray-400 text-xs italic">{p.dosageInstructions}</div>
                )}
              </div>
              {!isCompleted && p.status === 'Pending' && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleRemove(p)} disabled={remove.isPending}
                    className="text-xs border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 px-2 py-1 rounded disabled:opacity-50">
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function VisitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: visit, isLoading, error } = useVisit(id!)
  const triageVisit = useTriageVisit()
  const updateVisit = useUpdateVisit()
  const completeVisit = useCompleteVisit()

  const [editingTriage, setEditingTriage] = useState(false)
  const [triageForm, setTriageForm] = useState<TriageVisitRequest>({
    bloodPressureSystolic: null, bloodPressureDiastolic: null,
    weightKg: null, heightCm: null,
    temperatureCelsius: null, pulseRate: null, oxygenSaturation: null,
    chiefComplaint: null,
  })

  const [editingNotes, setEditingNotes] = useState(false)
  const [notesForm, setNotesForm] = useState<UpdateVisitRequest>({
    chiefComplaint: null, symptoms: null, diagnosis: null,
    treatment: null, prescription: null, notes: null, department: null,
  })

  function startEditTriage() {
    if (!visit) return
    setTriageForm({
      bloodPressureSystolic: visit.bloodPressureSystolic,
      bloodPressureDiastolic: visit.bloodPressureDiastolic,
      weightKg: visit.weightKg,
      heightCm: visit.heightCm,
      temperatureCelsius: visit.temperatureCelsius,
      pulseRate: visit.pulseRate,
      oxygenSaturation: visit.oxygenSaturation,
      chiefComplaint: visit.chiefComplaint,
    })
    setEditingTriage(true)
  }

  function startEditNotes() {
    if (!visit) return
    setNotesForm({
      chiefComplaint: visit.chiefComplaint,
      symptoms: visit.symptoms,
      diagnosis: visit.diagnosis,
      treatment: visit.treatment,
      prescription: visit.prescription,
      notes: visit.notes,
      department: visit.department,
    })
    setEditingNotes(true)
  }

  function numOrNull(val: string) {
    const n = parseFloat(val)
    return isNaN(n) ? null : n
  }

  async function handleSaveTriage() {
    if (!id) return
    await triageVisit.mutateAsync({ id, ...triageForm })
    setEditingTriage(false)
  }

  async function handleSaveNotes() {
    if (!id) return
    await updateVisit.mutateAsync({ id, ...notesForm })
    setEditingNotes(false)
  }

  async function handleComplete() {
    if (!id) return
    await completeVisit.mutateAsync(id)
  }

  if (isLoading) return <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
  if (error || !visit) return <div className="p-6 text-sm text-red-600 dark:text-red-400">Failed to load visit.</div>

  const isCompleted = visit.status === 'Completed'

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{visit.patientName}</h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {visit.visitDate} · {visit.doctorName}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[visit.status] ?? statusColors.InProgress}`}>
              {visit.status === 'InProgress' ? 'In Progress' : visit.status}
            </span>
          </div>
        </div>
        <button onClick={() => navigate('/consultations')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          ← Back
        </button>
      </div>

      {/* Triage section — Nurse */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Triage</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">— Nurse</span>
            {(visit.status === 'Triaged' || visit.status === 'Completed') && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                Triaged
              </span>
            )}
          </div>
          {!editingTriage && !isCompleted && (
            <button onClick={startEditTriage} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              {visit.status === 'InProgress' ? 'Record Vitals' : 'Edit'}
            </button>
          )}
        </div>

        {!editingTriage ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Blood Pressure"
                value={visit.bloodPressureSystolic && visit.bloodPressureDiastolic
                  ? `${visit.bloodPressureSystolic}/${visit.bloodPressureDiastolic} mmHg` : null} />
              <Field label="Weight" value={visit.weightKg ? `${visit.weightKg} kg` : null} />
              <Field label="Height" value={visit.heightCm ? `${visit.heightCm} cm` : null} />
              <Field label="Temperature" value={visit.temperatureCelsius ? `${visit.temperatureCelsius} °C` : null} />
              <Field label="Pulse Rate" value={visit.pulseRate ? `${visit.pulseRate} bpm` : null} />
              <Field label="O₂ Saturation" value={visit.oxygenSaturation ? `${visit.oxygenSaturation}%` : null} />
            </div>
            <Field label="Chief Complaint" value={visit.chiefComplaint} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Systolic (mmHg)</label>
                <input type="number" value={triageForm.bloodPressureSystolic ?? ''} className={inputClass}
                  onChange={(e) => setTriageForm((f) => ({ ...f, bloodPressureSystolic: numOrNull(e.target.value) as number | null }))} />
              </div>
              <div>
                <label className={labelClass}>Diastolic (mmHg)</label>
                <input type="number" value={triageForm.bloodPressureDiastolic ?? ''} className={inputClass}
                  onChange={(e) => setTriageForm((f) => ({ ...f, bloodPressureDiastolic: numOrNull(e.target.value) as number | null }))} />
              </div>
              <div>
                <label className={labelClass}>Weight (kg)</label>
                <input type="number" step="0.1" value={triageForm.weightKg ?? ''} className={inputClass}
                  onChange={(e) => setTriageForm((f) => ({ ...f, weightKg: numOrNull(e.target.value) }))} />
              </div>
              <div>
                <label className={labelClass}>Height (cm)</label>
                <input type="number" step="0.1" value={triageForm.heightCm ?? ''} className={inputClass}
                  onChange={(e) => setTriageForm((f) => ({ ...f, heightCm: numOrNull(e.target.value) }))} />
              </div>
              <div>
                <label className={labelClass}>Temperature (°C)</label>
                <input type="number" step="0.1" value={triageForm.temperatureCelsius ?? ''} className={inputClass}
                  onChange={(e) => setTriageForm((f) => ({ ...f, temperatureCelsius: numOrNull(e.target.value) }))} />
              </div>
              <div>
                <label className={labelClass}>Pulse Rate (bpm)</label>
                <input type="number" value={triageForm.pulseRate ?? ''} className={inputClass}
                  onChange={(e) => setTriageForm((f) => ({ ...f, pulseRate: numOrNull(e.target.value) as number | null }))} />
              </div>
              <div>
                <label className={labelClass}>O₂ Saturation (%)</label>
                <input type="number" step="0.1" value={triageForm.oxygenSaturation ?? ''} className={inputClass}
                  onChange={(e) => setTriageForm((f) => ({ ...f, oxygenSaturation: numOrNull(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Chief Complaint</label>
              <textarea rows={2} value={triageForm.chiefComplaint ?? ''} className={textareaClass}
                onChange={(e) => setTriageForm((f) => ({ ...f, chiefComplaint: e.target.value || null }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveTriage} disabled={triageVisit.isPending}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {triageVisit.isPending ? 'Saving...' : 'Save Triage'}
              </button>
              <button onClick={() => setEditingTriage(false)}
                className="border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Consultation section — Doctor */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Consultation</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">— Doctor</span>
          </div>
          {!editingNotes && !isCompleted && (
            <button onClick={startEditNotes} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
          )}
        </div>

        {!editingNotes ? (
          <div className="space-y-3">
            <Field label="Department" value={visit.department} />
            <Field label="Symptoms" value={visit.symptoms} />
            <Field label="Diagnosis" value={visit.diagnosis} />
            <Field label="Treatment" value={visit.treatment} />
            <Field label="General Prescription Notes" value={visit.prescription} />
            <Field label="Notes" value={visit.notes} />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Department</label>
              <input value={notesForm.department ?? ''} className={inputClass}
                placeholder="e.g. Outpatient, Emergency, ICU"
                onChange={(e) => setNotesForm((f) => ({ ...f, department: e.target.value || null }))} />
            </div>
            {([
              ['symptoms', 'Symptoms'],
              ['diagnosis', 'Diagnosis'],
              ['treatment', 'Treatment'],
              ['prescription', 'General Prescription Notes'],
              ['notes', 'Notes'],
            ] as const).map(([key, lbl]) => (
              <div key={key}>
                <label className={labelClass}>{lbl}</label>
                <textarea rows={2} value={notesForm[key] ?? ''} className={textareaClass}
                  onChange={(e) => setNotesForm((f) => ({ ...f, [key]: e.target.value || null }))} />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={handleSaveNotes} disabled={updateVisit.isPending}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {updateVisit.isPending ? 'Saving...' : 'Save Notes'}
              </button>
              <button onClick={() => setEditingNotes(false)}
                className="border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Prescriptions */}
      <PrescriptionsSection visitId={id!} isCompleted={isCompleted} />

      {/* Complete Visit */}
      {!isCompleted && !editingTriage && !editingNotes && (
        <div className="flex items-center gap-4">
          <button onClick={handleComplete} disabled={completeVisit.isPending}
            className="bg-green-600 hover:bg-green-700 text-white rounded-md px-5 py-2 text-sm font-medium disabled:opacity-50">
            {completeVisit.isPending ? 'Completing...' : 'Complete Visit'}
          </button>
          {visit.status === 'InProgress' && (
            <p className="text-xs text-amber-600 dark:text-amber-400">Triage not yet recorded</p>
          )}
        </div>
      )}
    </div>
  )
}
