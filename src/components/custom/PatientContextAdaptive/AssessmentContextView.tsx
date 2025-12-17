'use client'

import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import {
  getPatientTCMPatterns,
  getPatientICDCodes,
} from '@/data/mock-data'
import type { PatientCondition } from '@/data/mock-data'
import { ConditionRow } from './components'
import type { ContextViewProps } from './types'

// =============================================================================
// Props
// =============================================================================

interface AssessmentContextViewProps extends ContextViewProps {
  onAddCondition?: (condition: Partial<PatientCondition>) => void
}

// =============================================================================
// Assessment Context View Component
// =============================================================================

export function AssessmentContextView({
  patient,
  conditions,
  onConditionStatusChange,
  onAddCondition,
}: AssessmentContextViewProps) {
  // Get TCM patterns used
  const tcmPatterns = useMemo(
    () => getPatientTCMPatterns(patient.id),
    [patient.id]
  )

  // Get ICD-10 codes used
  const icdCodes = useMemo(
    () => getPatientICDCodes(patient.id),
    [patient.id]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Assessment
        </h4>
        <span className="text-[10px] text-muted-foreground/70">
          Focus: Assessment
        </span>
      </div>

      {/* Conditions with Editable Status */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Conditions
          </h5>
          <button
            onClick={() => onAddCondition?.({})}
            className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {conditions.length > 0 ? (
          <div className="flex flex-col">
            {conditions.map((condition) => (
              <ConditionRow
                key={condition.id}
                condition={condition}
                onStatusChange={onConditionStatusChange}
              />
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No conditions tracked
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-border -mx-3" />

      {/* TCM Patterns Used */}
      <div className="flex flex-col gap-2">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          TCM Patterns Used
        </h5>

        {tcmPatterns.length > 0 ? (
          <div className="flex flex-col gap-1">
            {tcmPatterns.slice(0, 6).map((pattern) => (
              <div key={pattern.pattern} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{pattern.pattern}</span>
                <span className="text-[10px] text-muted-foreground">
                  {pattern.visitIds.length}x
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No TCM patterns found in history
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-border -mx-3" />

      {/* ICD-10 Codes Used */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            ICD-10 Codes Used
          </h5>
          <button className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80">
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {icdCodes.length > 0 ? (
          <div className="flex flex-col gap-1">
            {icdCodes.slice(0, 5).map((code) => (
              <div key={code.code} className="flex items-start gap-2 text-xs">
                <span className="text-foreground font-mono flex-shrink-0">
                  {code.code}
                </span>
                <span className="text-muted-foreground">
                  {code.description}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No ICD-10 codes found in history
          </div>
        )}
      </div>
    </div>
  )
}
