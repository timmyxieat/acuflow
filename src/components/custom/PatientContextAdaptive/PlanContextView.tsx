'use client'

import { useMemo } from 'react'
import { Copy } from 'lucide-react'
import {
  getPatientTreatmentHistory,
  getPatientPlanHistory,
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
// Plan Context View Component
// =============================================================================

export function PlanContextView({
  patient,
}: ContextViewProps) {
  // Get treatment history
  const treatmentHistory = useMemo(
    () => getPatientTreatmentHistory(patient.id, 5),
    [patient.id]
  )

  // Get plan history
  const planHistory = useMemo(
    () => getPatientPlanHistory(patient.id, 3),
    [patient.id]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Treatment Plan
        </h4>
        <span className="text-[10px] text-muted-foreground/70">
          Focus: Plan
        </span>
      </div>

      {/* Previous Treatments */}
      <div className="flex flex-col gap-2">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Previous Treatments
        </h5>

        {treatmentHistory.length > 0 ? (
          <div className="flex flex-col gap-3">
            {treatmentHistory.map((treatment) => (
              <div key={treatment.visitId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(treatment.visitDate)}
                  </span>
                  <button className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80">
                    <Copy className="h-2.5 w-2.5" />
                    Use
                  </button>
                </div>
                {treatment.points.length > 0 && (
                  <div className="text-xs text-foreground">
                    {treatment.points.join(', ')}
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {treatment.duration && <span>{treatment.duration} min</span>}
                  {treatment.usedEstim && <span>• e-stim</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No treatment history
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-border -mx-3" />

      {/* Protocols */}
      <div className="flex flex-col gap-2">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Protocols
        </h5>
        <div className="flex flex-col gap-1">
          <button className="text-left text-xs text-foreground hover:text-primary transition-colors">
            / LBP Basic
          </button>
          <button className="text-left text-xs text-foreground hover:text-primary transition-colors">
            / Four Gates
          </button>
          <button className="text-left text-xs text-foreground hover:text-primary transition-colors">
            / Sciatica
          </button>
        </div>
        <button className="text-[10px] text-primary hover:text-primary/80 text-left">
          Browse protocols →
        </button>
      </div>

      {/* Separator */}
      <div className="border-t border-border -mx-3" />

      {/* Past Plans */}
      {planHistory.length > 0 && (
        <div className="flex flex-col gap-2">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Past Plans
          </h5>
          {planHistory.map((entry) => (
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
    </div>
  )
}
