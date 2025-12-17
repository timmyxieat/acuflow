'use client'

import { useState, useCallback, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAutoSave } from '@/hooks/useAutoSave'
import { ConditionRow, SaveStatus } from './components'
import type { ContextViewProps } from './types'

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
// Today's Visit Section (Read-Only)
// =============================================================================

function TodaysVisitSection({ data }: { data: IntakeData }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Today's Visit
        </h4>
        <span className="text-[10px] text-muted-foreground/70">
          From patient intake
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Chief Complaint</label>
        <div className="rounded-md bg-muted/30 px-2 py-1.5 text-sm text-foreground cursor-text select-text">
          {data.chiefComplaint || <span className="text-muted-foreground/50 italic">Not provided</span>}
        </div>
      </div>

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
// Default Context View Component
// =============================================================================

export function DefaultContextView({
  patient,
  conditions,
  contextData,
  onConditionStatusChange,
}: ContextViewProps) {
  const [intakeData, setIntakeData] = useState<IntakeData>(DEFAULT_INTAKE_DATA)
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
    const savedIntake = localStorage.getItem(`intake-${patient.id}`)
    if (savedIntake) {
      try {
        setIntakeData(JSON.parse(savedIntake))
      } catch {
        setIntakeData(DEFAULT_INTAKE_DATA)
      }
    } else {
      setIntakeData(DEFAULT_INTAKE_DATA)
    }

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

  const age = Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  const sexDisplay = patient.sex === 'MALE' ? 'M' : patient.sex === 'FEMALE' ? 'F' : null

  const familyInfo = [
    contextData?.maritalStatus,
    contextData?.children,
  ].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col gap-4">
      {/* Today's Visit - read-only */}
      <TodaysVisitSection data={intakeData} />

      {/* Visual separator */}
      <div className="border-t border-border -mx-3" />

      {/* Patient Background */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Patient Background
        </h4>

        {/* Quick Glance */}
        <div className="flex flex-col gap-0.5">
          <div className="text-xs text-foreground">
            {patient.firstName} {patient.lastName}
            <span className="text-muted-foreground"> · {age}y{sexDisplay && `, ${sexDisplay}`}</span>
          </div>
          {contextData?.occupation && (
            <div className="text-xs text-muted-foreground">{contextData.occupation}</div>
          )}
          {familyInfo && (
            <div className="text-xs text-muted-foreground">{familyInfo}</div>
          )}
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

        {/* Conditions */}
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
                  onStatusChange={onConditionStatusChange}
                />
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
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

        {/* Allergies */}
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

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Notes
            </h5>
            <SaveStatus status={notesSaveStatus} />
          </div>
          <textarea
            value={backgroundNotes.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add practitioner notes..."
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary transition-colors"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}
