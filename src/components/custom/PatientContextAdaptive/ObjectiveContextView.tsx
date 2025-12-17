'use client'

import { useMemo } from 'react'
import {
  getPatientVitalsHistory,
  getPatientTonguePulseHistory,
  getPatientObjectiveHistory,
} from '@/data/mock-data'
import type { ContextViewProps } from './types'

// =============================================================================
// Helper: Format date for display
// =============================================================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// =============================================================================
// Vitals History Component
// =============================================================================

interface VitalsRowProps {
  label: string
  todayPlaceholder: string
  history: { date: Date; value?: string }[]
}

function VitalsRow({ label, todayPlaceholder, history }: VitalsRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex flex-col gap-0.5">
        {/* Today's entry (placeholder for input) */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Today</span>
          <span className="text-muted-foreground/50">{todayPlaceholder}</span>
        </div>
        {/* Historical entries */}
        {history.map((entry, i) => (
          entry.value && (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{formatDate(entry.date)}</span>
              <span className="text-foreground">{entry.value}</span>
            </div>
          )
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Objective Context View Component
// =============================================================================

export function ObjectiveContextView({
  patient,
}: ContextViewProps) {
  // Get vitals history
  const vitalsHistory = useMemo(
    () => getPatientVitalsHistory(patient.id, 5),
    [patient.id]
  )

  // Get tongue/pulse history
  const tonguePulseHistory = useMemo(
    () => getPatientTonguePulseHistory(patient.id, 5),
    [patient.id]
  )

  // Get objective history
  const objectiveHistory = useMemo(
    () => getPatientObjectiveHistory(patient.id, 3),
    [patient.id]
  )

  // Transform vitals for display
  const bpHistory = vitalsHistory.map((v) => ({ date: v.visitDate, value: v.bp }))
  const hrHistory = vitalsHistory.map((v) => ({ date: v.visitDate, value: v.hr ? `${v.hr} bpm` : undefined }))

  // Transform tongue/pulse for display
  const tongueHistory = tonguePulseHistory.map((v) => ({ date: v.visitDate, value: v.tongue }))
  const pulseHistory = tonguePulseHistory.map((v) => ({ date: v.visitDate, value: v.pulse }))

  const hasVitals = bpHistory.some((v) => v.value) || hrHistory.some((v) => v.value)
  const hasTonguePulse = tongueHistory.some((v) => v.value) || pulseHistory.some((v) => v.value)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Objective Data
        </h4>
        <span className="text-[10px] text-muted-foreground/70">
          Focus: Objective
        </span>
      </div>

      {/* Vitals History */}
      {hasVitals && (
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Vitals History
          </h4>

          <VitalsRow
            label="BP"
            todayPlaceholder="[___/___]"
            history={bpHistory}
          />

          <VitalsRow
            label="HR"
            todayPlaceholder="[___] bpm"
            history={hrHistory}
          />
        </div>
      )}

      {/* Separator */}
      {hasVitals && <div className="border-t border-border -mx-3" />}

      {/* Tongue History */}
      {tongueHistory.some((v) => v.value) && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tongue History
          </h4>
          <div className="flex flex-col gap-0.5">
            {/* Today's entry */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Today</span>
              <span className="text-muted-foreground/50 flex-1 text-right ml-2">[___________]</span>
            </div>
            {tongueHistory.map((entry, i) => (
              entry.value && (
                <div key={i} className="flex items-start justify-between text-xs gap-2">
                  <span className="text-muted-foreground flex-shrink-0">{formatDate(entry.date)}</span>
                  <span className="text-foreground text-right">{entry.value}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Separator */}
      {tongueHistory.some((v) => v.value) && <div className="border-t border-border -mx-3" />}

      {/* Pulse History */}
      {pulseHistory.some((v) => v.value) && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pulse History
          </h4>
          <div className="flex flex-col gap-0.5">
            {/* Today's entry */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Today</span>
              <span className="text-muted-foreground/50 flex-1 text-right ml-2">[___________]</span>
            </div>
            {pulseHistory.map((entry, i) => (
              entry.value && (
                <div key={i} className="flex items-start justify-between text-xs gap-2">
                  <span className="text-muted-foreground flex-shrink-0">{formatDate(entry.date)}</span>
                  <span className="text-foreground text-right">{entry.value}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Separator */}
      {hasTonguePulse && <div className="border-t border-border -mx-3" />}

      {/* Past Objective Notes */}
      {objectiveHistory.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Past Objective
          </h4>
          {objectiveHistory.map((entry) => (
            <div key={entry.visitId} className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">
                {formatDate(entry.visitDate)}
              </span>
              <p className="text-xs text-muted-foreground italic line-clamp-3">
                "{entry.content.substring(0, 150)}{entry.content.length > 150 ? '...' : ''}"
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasVitals && !hasTonguePulse && objectiveHistory.length === 0 && (
        <div className="text-xs text-muted-foreground italic">
          No objective history available
        </div>
      )}
    </div>
  )
}
