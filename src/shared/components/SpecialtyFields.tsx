import { useEffect, useState } from 'react'
import { emptySpecialtyData, parseSpecialtyData } from '@/shared/constants/specialties'

interface Props {
  specialty: string
  specialtyData: string | null
  onChange: (json: string) => void
  readOnly?: boolean
}

const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'
const inputClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
const textareaClass = `${inputClass} resize-none`

const SPECIALTY_FIELDS: Record<string, { key: string; label: string; type: 'input' | 'textarea' }[]> = {
  Gynaecology: [
    { key: 'lmp', label: 'Last Menstrual Period (LMP)', type: 'input' },
    { key: 'gravida', label: 'Gravida', type: 'input' },
    { key: 'para', label: 'Para', type: 'input' },
    { key: 'gestationalAge', label: 'Gestational Age (weeks)', type: 'input' },
    { key: 'obstetricHistory', label: 'Obstetric History', type: 'textarea' },
  ],
  Dentistry: [
    { key: 'toothNumbers', label: 'Tooth Number(s)', type: 'input' },
    { key: 'procedure', label: 'Procedure', type: 'input' },
    { key: 'chartingNotes', label: 'Charting Notes', type: 'textarea' },
  ],
  Optometry: [
    { key: 'vaRight', label: 'Visual Acuity — Right', type: 'input' },
    { key: 'vaLeft', label: 'Visual Acuity — Left', type: 'input' },
    { key: 'iopRight', label: 'IOP Right (mmHg)', type: 'input' },
    { key: 'iopLeft', label: 'IOP Left (mmHg)', type: 'input' },
    { key: 'refraction', label: 'Refraction', type: 'textarea' },
    { key: 'lensPrescription', label: 'Lens Prescription', type: 'textarea' },
  ],
  Paediatrics: [
    { key: 'growthPercentile', label: 'Growth Percentile', type: 'input' },
    { key: 'developmentalMilestones', label: 'Developmental Milestones', type: 'textarea' },
    { key: 'vaccinationStatus', label: 'Vaccination Status', type: 'textarea' },
  ],
}

export function SpecialtyFields({ specialty, specialtyData, onChange, readOnly = false }: Props) {
  const fields = SPECIALTY_FIELDS[specialty]
  const [data, setData] = useState<Record<string, string>>(() => ({
    ...emptySpecialtyData(specialty),
    ...parseSpecialtyData(specialtyData),
  }))

  useEffect(() => {
    setData({ ...emptySpecialtyData(specialty), ...parseSpecialtyData(specialtyData) })
  }, [specialty, specialtyData])

  if (!fields || fields.length === 0) return null

  function handleChange(key: string, value: string) {
    const updated = { ...data, [key]: value }
    setData(updated)
    onChange(JSON.stringify(updated))
  }

  if (readOnly) {
    return (
      <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {specialty} Notes
        </p>
        {fields.map((f) => (
          <div key={f.key}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{data[f.key] || '—'}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {specialty} Notes
      </p>
      {fields.map((f) =>
        f.type === 'textarea' ? (
          <div key={f.key}>
            <label className={labelClass}>{f.label}</label>
            <textarea
              rows={2}
              value={data[f.key] ?? ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className={textareaClass}
            />
          </div>
        ) : (
          <div key={f.key}>
            <label className={labelClass}>{f.label}</label>
            <input
              type="text"
              value={data[f.key] ?? ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className={inputClass}
            />
          </div>
        ),
      )}
    </div>
  )
}
