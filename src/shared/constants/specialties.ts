export const SPECIALTIES = [
  'General Practice',
  'Gynaecology',
  'Paediatrics',
  'Dentistry',
  'Optometry',
  'Internal Medicine',
  'Surgery',
  'Orthopaedics',
  'Psychiatry',
  'Dermatology',
  'ENT',
  'Cardiology',
] as const

export type Specialty = (typeof SPECIALTIES)[number]

// ─── Per-specialty field schemas ─────────────────────────────────────────────

export interface GynaecologyData {
  lmp: string
  gravida: string
  para: string
  gestationalAge: string
  obstetricHistory: string
}

export interface DentistryData {
  toothNumbers: string
  procedure: string
  chartingNotes: string
}

export interface OptometryData {
  vaRight: string
  vaLeft: string
  iopRight: string
  iopLeft: string
  refraction: string
  lensPrescription: string
}

export interface PaediatricsData {
  growthPercentile: string
  developmentalMilestones: string
  vaccinationStatus: string
}

export type SpecialtyData =
  | GynaecologyData
  | DentistryData
  | OptometryData
  | PaediatricsData
  | Record<string, string>

export function emptySpecialtyData(specialty: string): Record<string, string> {
  switch (specialty) {
    case 'Gynaecology':
      return { lmp: '', gravida: '', para: '', gestationalAge: '', obstetricHistory: '' }
    case 'Dentistry':
      return { toothNumbers: '', procedure: '', chartingNotes: '' }
    case 'Optometry':
      return { vaRight: '', vaLeft: '', iopRight: '', iopLeft: '', refraction: '', lensPrescription: '' }
    case 'Paediatrics':
      return { growthPercentile: '', developmentalMilestones: '', vaccinationStatus: '' }
    default:
      return {}
  }
}

export function parseSpecialtyData(json: string | null | undefined): Record<string, string> {
  if (!json) return {}
  try {
    return JSON.parse(json) as Record<string, string>
  } catch {
    return {}
  }
}
