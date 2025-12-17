import type { Patient, PatientCondition, PatientContextData, VisitWithAppointment } from '@/data/mock-data'
import type { FocusedSection } from '@/app/appointments/[id]/components'

// Re-export for convenience
export type { FocusedSection }

// =============================================================================
// Component Props
// =============================================================================

export interface PatientContextAdaptiveProps {
  patient: Patient
  conditions: PatientCondition[]
  contextData?: PatientContextData
  focusedSection: FocusedSection
  appointmentId: string
  visitHistory?: VisitWithAppointment[]
  onConditionStatusChange?: (conditionId: string, status: string) => void
  onAddCondition?: (condition: Partial<PatientCondition>) => void
  onUpdateMedications?: (medications: string[]) => void
  onUpdateAllergies?: (allergies: string[]) => void
}

// Shared props for all context views
export interface ContextViewProps {
  patient: Patient
  conditions: PatientCondition[]
  contextData?: PatientContextData
  visitHistory?: VisitWithAppointment[]
  onConditionStatusChange?: (conditionId: string, status: string) => void
}

// =============================================================================
// Condition Types
// =============================================================================

export const CONDITION_STATUSES = ['ACTIVE', 'IMPROVING', 'WORSENING', 'STABLE', 'RESOLVED'] as const
export type ConditionStatus = typeof CONDITION_STATUSES[number]

export const CONDITION_STATUS_COLORS: Record<ConditionStatus, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-blue-100', text: 'text-blue-700' },
  IMPROVING: { bg: 'bg-green-100', text: 'text-green-700' },
  WORSENING: { bg: 'bg-red-100', text: 'text-red-700' },
  STABLE: { bg: 'bg-slate-100', text: 'text-slate-600' },
  RESOLVED: { bg: 'bg-slate-100', text: 'text-slate-500' },
}

// =============================================================================
// Historical Data Types
// =============================================================================

export interface SubjectiveHistory {
  visitId: string
  visitDate: Date
  content: string
  chiefComplaint?: string
}

export interface VitalsHistory {
  visitId: string
  visitDate: Date
  bp?: string
  hr?: string
  temp?: string
}

export interface TonguePulseHistory {
  visitId: string
  visitDate: Date
  tongue?: string
  pulse?: string
}

export interface TCMPattern {
  pattern: string
  visitIds: string[]
  lastUsed: Date
}

export interface ICDCode {
  code: string
  description: string
  visitIds: string[]
}

export interface TreatmentHistory {
  visitId: string
  visitDate: Date
  points: string[]
  duration?: number
  usedEstim: boolean
}

export interface PainScoreEntry {
  visitId: string
  visitDate: Date
  score: number
}
