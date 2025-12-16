'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Check, AlertTriangle, ChevronDown } from 'lucide-react'
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

interface BackgroundNotes {
  notes: string
}

const DEFAULT_INTAKE_DATA: IntakeData = {
  chiefComplaint: 'Low back pain radiating to left leg. Pain level 3/10. Worse after sitting for long periods.',
  hpi: 'Started 2 weeks ago after helping friend move. No numbness or tingling. Better with movement and heat.',
}

const DEFAULT_BACKGROUND_NOTES: BackgroundNotes = {
  notes: '',
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
// Condition Status Dropdown
// =============================================================================

const CONDITION_STATUSES = ['ACTIVE', 'IMPROVING', 'WORSENING', 'STABLE', 'RESOLVED'] as const

const CONDITION_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-blue-100', text: 'text-blue-700' },
  IMPROVING: { bg: 'bg-green-100', text: 'text-green-700' },
  WORSENING: { bg: 'bg-red-100', text: 'text-red-700' },
  STABLE: { bg: 'bg-slate-100', text: 'text-slate-600' },
  RESOLVED: { bg: 'bg-slate-100', text: 'text-slate-500' },
}

interface ConditionRowProps {
  condition: PatientCondition
  onStatusChange?: (conditionId: string, newStatus: string) => void
}

type ConditionStatus = typeof CONDITION_STATUSES[number]

function ConditionRow({ condition, onStatusChange }: ConditionRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<ConditionStatus>(condition.status as ConditionStatus)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const colors = CONDITION_STATUS_COLORS[currentStatus] || CONDITION_STATUS_COLORS.ACTIVE

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleStatusSelect = (status: ConditionStatus) => {
    setCurrentStatus(status)
    setIsOpen(false)
    onStatusChange?.(condition.id, status)
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-foreground truncate flex-1">{condition.name}</span>
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity`}
        >
          {currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase()}
          <ChevronDown className="h-2.5 w-2.5" />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[100px]">
            {CONDITION_STATUSES.map((status) => {
              const statusColors = CONDITION_STATUS_COLORS[status]
              return (
                <button
                  key={status}
                  onClick={() => handleStatusSelect(status)}
                  className={`w-full text-left px-2 py-1 text-[10px] hover:bg-muted transition-colors ${
                    status === currentStatus ? 'font-medium' : ''
                  }`}
                >
                  <span className={`inline-block px-1 py-0.5 rounded ${statusColors.bg} ${statusColors.text}`}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
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
// Today's Visit Section (Read-Only, Highlightable)
// =============================================================================

interface TodaysVisitProps {
  data: IntakeData
}

function TodaysVisitSection({ data }: TodaysVisitProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex flex-col gap-0.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Today's Visit
        </h4>
        <span className="text-[10px] text-muted-foreground/70">
          From patient intake
        </span>
      </div>

      {/* Chief Complaint - Read-only, highlightable */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Chief Complaint</label>
        <div className="rounded-md bg-muted/30 px-2 py-1.5 text-sm text-foreground cursor-text select-text">
          {data.chiefComplaint || <span className="text-muted-foreground/50 italic">Not provided</span>}
        </div>
      </div>

      {/* HPI - Read-only, highlightable */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">HPI</label>
        <div className="rounded-md bg-muted/30 px-2 py-1.5 text-sm text-foreground cursor-text select-text min-h-[3rem]">
          {data.hpi || <span className="text-muted-foreground/50 italic">Not provided</span>}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Patient Background Section (Editable)
// =============================================================================

interface PatientBackgroundProps {
  patient: Patient
  conditions: PatientCondition[]
  contextData?: PatientContextData
  notes: string
  onNotesChange: (notes: string) => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

function PatientBackgroundSection({
  patient,
  conditions,
  contextData,
  notes,
  onNotesChange,
  saveStatus
}: PatientBackgroundProps) {
  const age = Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  const sexDisplay = patient.sex === 'MALE' ? 'M' : patient.sex === 'FEMALE' ? 'F' : null

  // Build family info string
  const familyInfo = [
    contextData?.maritalStatus,
    contextData?.children,
  ].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Patient Background
      </h4>

      {/* Quick Glance - Each piece on its own line */}
      <div className="flex flex-col gap-0.5">
        {/* Line 1: Name + age/gender */}
        <div className="text-xs text-foreground">
          {patient.firstName} {patient.lastName}
          <span className="text-muted-foreground"> · {age}y{sexDisplay && `, ${sexDisplay}`}</span>
        </div>
        {/* Line 2: Occupation */}
        {contextData?.occupation && (
          <div className="text-xs text-muted-foreground">{contextData.occupation}</div>
        )}
        {/* Line 3: Family status */}
        {familyInfo && (
          <div className="text-xs text-muted-foreground">{familyInfo}</div>
        )}
        {/* Line 4: Stress indicator with dot */}
        {contextData?.stressLevel && (
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
              contextData.stressLevel === 'High' ? 'bg-red-500' :
              contextData.stressLevel === 'Moderate' ? 'bg-amber-500' : 'bg-green-500'
            }`} />
            <span className="text-xs text-muted-foreground">{contextData.stressLevel} stress</span>
          </div>
        )}
      </div>

      {/* Conditions - Editable status dropdowns */}
      {conditions.length > 0 && (
        <div className="flex flex-col gap-1">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Conditions
          </h5>
          <div className="flex flex-col">
            {conditions.map((condition) => (
              <ConditionRow
                key={condition.id}
                condition={condition}
                onStatusChange={(id, status) => {
                  // TODO: Persist status change
                  console.log('Status changed:', id, status)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medications - Each on its own line */}
      {contextData?.currentMedications && contextData.currentMedications.length > 0 && (
        <div className="flex flex-col gap-1">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Meds
          </h5>
          <div className="flex flex-col gap-0.5">
            {contextData.currentMedications.map((med, i) => (
              <div key={i} className="text-xs text-foreground">{med}</div>
            ))}
          </div>
        </div>
      )}

      {/* Allergies - Warning style */}
      <div className="flex flex-col gap-1">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Allergies
        </h5>
        {contextData?.allergies && contextData.allergies.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {contextData.allergies.map((allergy, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span>{allergy}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-green-600">NKDA</div>
        )}
      </div>

      {/* Notes - Editable with auto-save */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Notes
          </h5>
          <SaveStatus status={saveStatus} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add practitioner notes..."
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary transition-colors"
          rows={2}
        />
      </div>
    </div>
  )
}

// =============================================================================
// Patient Context Component
// =============================================================================

export function PatientContext({ patient, conditions = [], contextData }: PatientContextProps) {
  // Intake data (read-only, from patient submission)
  const [intakeData, setIntakeData] = useState<IntakeData>(DEFAULT_INTAKE_DATA)

  // Background notes (editable by practitioner)
  const [backgroundNotes, setBackgroundNotes] = useState<BackgroundNotes>(DEFAULT_BACKGROUND_NOTES)

  // Auto-save background notes
  const { status: notesSaveStatus } = useAutoSave({
    data: backgroundNotes,
    onSave: async (data) => {
      localStorage.setItem(`background-notes-${patient.id}`, JSON.stringify(data))
    },
  })

  // Load saved data on mount or when patient changes
  useEffect(() => {
    // Load intake data (simulating patient-submitted data)
    const savedIntake = localStorage.getItem(`intake-${patient.id}`)
    if (savedIntake) {
      try {
        setIntakeData(JSON.parse(savedIntake))
      } catch {
        setIntakeData(DEFAULT_INTAKE_DATA)
      }
    } else {
      // Use default mock data for demo
      setIntakeData(DEFAULT_INTAKE_DATA)
    }

    // Load background notes
    const savedNotes = localStorage.getItem(`background-notes-${patient.id}`)
    if (savedNotes) {
      try {
        setBackgroundNotes(JSON.parse(savedNotes))
      } catch {
        setBackgroundNotes(DEFAULT_BACKGROUND_NOTES)
      }
    } else {
      setBackgroundNotes(DEFAULT_BACKGROUND_NOTES)
    }
  }, [patient.id])

  const handleNotesChange = useCallback((notes: string) => {
    setBackgroundNotes({ notes })
  }, [])

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Scrollable content - both sections */}
      <ScrollableArea className="flex-1 py-3 px-3" deps={[patient.id]} hideScrollbar>
        <div className="flex flex-col gap-4">
          {/* Today's Visit - read-only, highlightable */}
          <TodaysVisitSection data={intakeData} />

          {/* Visual separator */}
          <div className="border-t border-border -mx-3" />

          {/* Patient Background - editable */}
          <PatientBackgroundSection
            patient={patient}
            conditions={conditions}
            contextData={contextData}
            notes={backgroundNotes.notes}
            onNotesChange={handleNotesChange}
            saveStatus={notesSaveStatus}
          />
        </div>
      </ScrollableArea>
    </div>
  )
}
