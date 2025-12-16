'use client'

import { useState, useCallback, useEffect } from 'react'
import { Check, AlertTriangle } from 'lucide-react'
import { ScrollableArea } from './ScrollableArea'
import { useAutoSave } from '@/hooks/useAutoSave'
import { type Patient, type PatientCondition, type PatientContextData } from '@/data/mock-data'

export type { PatientContextData }

// =============================================================================
// Types
// =============================================================================

interface IntakeData {
  chiefComplaint: string
  hpi: string
}

const DEFAULT_INTAKE_DATA: IntakeData = {
  chiefComplaint: '',
  hpi: '',
}

// =============================================================================
// Props
// =============================================================================

interface PatientContextProps {
  patient: Patient
  conditions?: PatientCondition[]
  contextData?: PatientContextData
}

// =============================================================================
// Condition Status Badge
// =============================================================================

const CONDITION_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-blue-100', text: 'text-blue-700' },
  IMPROVING: { bg: 'bg-green-100', text: 'text-green-700' },
  WORSENING: { bg: 'bg-red-100', text: 'text-red-700' },
  STABLE: { bg: 'bg-slate-100', text: 'text-slate-600' },
  RESOLVED: { bg: 'bg-slate-100', text: 'text-slate-500' },
}

function ConditionBadge({ condition }: { condition: PatientCondition }) {
  const colors = CONDITION_STATUS_COLORS[condition.status] || CONDITION_STATUS_COLORS.ACTIVE

  return (
    <div className="flex items-center justify-between gap-1 py-0.5">
      <span className="text-xs text-foreground truncate flex-1">{condition.name}</span>
      <span className={`text-[10px] px-1 py-0.5 rounded ${colors.bg} ${colors.text} flex-shrink-0`}>
        {condition.status.charAt(0) + condition.status.slice(1).toLowerCase()}
      </span>
    </div>
  )
}

// =============================================================================
// Save Status Indicator
// =============================================================================

function SaveStatus({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  switch (status) {
    case 'saving':
      return (
        <span className="text-xs text-muted-foreground animate-pulse">
          Saving...
        </span>
      )
    case 'saved':
      return (
        <span className="text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Saved
        </span>
      )
    case 'error':
      return (
        <span className="text-xs text-destructive">
          Save failed
        </span>
      )
    default:
      return null
  }
}

// =============================================================================
// Today's Visit Section (Editable)
// =============================================================================

interface TodaysVisitProps {
  patientId: string
  data: IntakeData
  onChange: (data: IntakeData) => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

function TodaysVisitSection({ patientId, data, onChange, saveStatus }: TodaysVisitProps) {
  const handleTextChange = (field: 'chiefComplaint' | 'hpi', value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Section header with save status */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Today's Visit
        </h4>
        <SaveStatus status={saveStatus} />
      </div>

      {/* Chief Complaint */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Chief Complaint</label>
        <input
          type="text"
          value={data.chiefComplaint}
          onChange={(e) => handleTextChange('chiefComplaint', e.target.value)}
          placeholder="Primary reason for visit..."
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* HPI */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">HPI</label>
        <textarea
          value={data.hpi}
          onChange={(e) => handleTextChange('hpi', e.target.value)}
          placeholder="Onset, duration, severity..."
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary transition-colors"
          rows={2}
        />
      </div>
    </div>
  )
}

// =============================================================================
// Patient Background Section (Read-only)
// =============================================================================

interface PatientBackgroundProps {
  patient: Patient
  conditions: PatientCondition[]
  contextData?: PatientContextData
}

function PatientBackgroundSection({ patient, conditions, contextData }: PatientBackgroundProps) {
  const age = Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  const sexDisplay = patient.sex === 'MALE' ? 'M' : patient.sex === 'FEMALE' ? 'F' : null

  // Combine occupation and family into one line
  const lifeContext = [
    contextData?.occupation,
    contextData?.maritalStatus,
    contextData?.children,
  ].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Patient Background
      </h4>

      {/* Quick Glance - condensed */}
      <div className="flex flex-col gap-0.5">
        <div className="text-xs text-foreground">
          {patient.firstName} {patient.lastName}
          <span className="text-muted-foreground"> · {age}y{sexDisplay && `, ${sexDisplay}`}</span>
        </div>
        {lifeContext && (
          <div className="text-xs text-muted-foreground">{lifeContext}</div>
        )}
        {contextData?.stressLevel && (
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${
              contextData.stressLevel === 'High' ? 'bg-red-500' :
              contextData.stressLevel === 'Moderate' ? 'bg-amber-500' : 'bg-green-500'
            }`} />
            <span className="text-xs text-muted-foreground">{contextData.stressLevel} stress</span>
          </div>
        )}
      </div>

      {/* Conditions */}
      {conditions.length > 0 && (
        <div className="flex flex-col gap-1">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Conditions
          </h5>
          <div className="flex flex-col">
            {conditions.map((condition) => (
              <ConditionBadge key={condition.id} condition={condition} />
            ))}
          </div>
        </div>
      )}

      {/* Meds & Allergies - combined */}
      <div className="flex flex-col gap-1">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Meds & Allergies
        </h5>
        {/* Medications inline */}
        {contextData?.currentMedications && contextData.currentMedications.length > 0 ? (
          <div className="text-xs text-foreground">
            {contextData.currentMedications.join(', ')}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground/60 italic">No medications</div>
        )}
        {/* Allergies with warning */}
        {contextData?.allergies && contextData.allergies.length > 0 ? (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span>{contextData.allergies.join(', ')}</span>
          </div>
        ) : (
          <div className="text-xs text-green-600">NKDA</div>
        )}
      </div>

      {/* History - combined Medical + Family */}
      <div className="flex flex-col gap-1">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          History
        </h5>
        {/* Medical history */}
        {contextData?.pastSurgeries && contextData.pastSurgeries.length > 0 ? (
          <div className="text-xs text-foreground">
            {contextData.pastSurgeries.join(', ')}
          </div>
        ) : contextData?.priorDiagnoses && contextData.priorDiagnoses.length > 0 ? (
          <div className="text-xs text-foreground">
            {contextData.priorDiagnoses.join(', ')}
          </div>
        ) : null}
        {/* Family history */}
        {contextData?.familyHistory && contextData.familyHistory.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Family: {contextData.familyHistory.join(', ')}
          </div>
        )}
        {/* Empty state */}
        {(!contextData?.pastSurgeries?.length && !contextData?.priorDiagnoses?.length && !contextData?.familyHistory?.length) && (
          <div className="text-xs text-muted-foreground/60 italic">No significant history</div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Patient Context Component
// =============================================================================

export function PatientContext({ patient, conditions = [], contextData }: PatientContextProps) {
  // Intake form state
  const [intakeData, setIntakeData] = useState<IntakeData>(DEFAULT_INTAKE_DATA)

  // Auto-save intake data
  const { status: intakeSaveStatus } = useAutoSave({
    data: intakeData,
    onSave: async (data) => {
      // For now, just simulate saving (localStorage or API in future)
      localStorage.setItem(`intake-${patient.id}`, JSON.stringify(data))
    },
  })

  // Load saved intake data on mount or when patient changes
  useEffect(() => {
    const saved = localStorage.getItem(`intake-${patient.id}`)
    if (saved) {
      try {
        setIntakeData(JSON.parse(saved))
      } catch (e) {
        // Ignore parse errors, use default
        setIntakeData(DEFAULT_INTAKE_DATA)
      }
    } else {
      setIntakeData(DEFAULT_INTAKE_DATA)
    }
  }, [patient.id])

  const handleIntakeChange = useCallback((data: IntakeData) => {
    setIntakeData(data)
  }, [])

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Scrollable content - both sections */}
      <ScrollableArea className="flex-1 py-3 px-3" deps={[patient.id]} hideScrollbar>
        <div className="flex flex-col gap-4">
          {/* Today's Visit - editable */}
          <TodaysVisitSection
            patientId={patient.id}
            data={intakeData}
            onChange={handleIntakeChange}
            saveStatus={intakeSaveStatus}
          />

          {/* Visual separator */}
          <div className="border-t border-border" />

          {/* Patient Background - read-only */}
          <PatientBackgroundSection
            patient={patient}
            conditions={conditions}
            contextData={contextData}
          />
        </div>
      </ScrollableArea>
    </div>
  )
}
