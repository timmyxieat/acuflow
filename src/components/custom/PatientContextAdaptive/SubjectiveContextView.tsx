'use client'

import { useMemo } from 'react'
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import {
  getPatientSubjectiveHistory,
  getConditionPainScores,
} from '@/data/mock-data'
import { ConditionRow } from './components'
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
// Pain Score Timeline Component
// =============================================================================

interface PainScoreTimelineProps {
  conditionId: string
  conditionName: string
}

function PainScoreTimeline({ conditionId, conditionName }: PainScoreTimelineProps) {
  const painScores = useMemo(() => getConditionPainScores(conditionId), [conditionId])

  if (painScores.length === 0) {
    return null
  }

  // Determine trend
  const trend = painScores.length >= 2
    ? painScores[0].score < painScores[1].score
      ? 'improving'
      : painScores[0].score > painScores[1].score
        ? 'worsening'
        : 'stable'
    : null

  const TrendIcon = trend === 'improving' ? TrendingDown : trend === 'worsening' ? TrendingUp : Minus
  const trendColor = trend === 'improving' ? 'text-green-600' : trend === 'worsening' ? 'text-red-600' : 'text-muted-foreground'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{conditionName}</span>
        {trend && (
          <div className={`flex items-center gap-0.5 ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span className="text-[10px] capitalize">{trend}</span>
          </div>
        )}
      </div>

      {/* Pain score entries */}
      <div className="flex flex-col gap-0.5">
        {/* Today's entry (editable in future) */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Today</span>
          <span className="text-muted-foreground/50">[ ]/10</span>
        </div>

        {/* Historical entries */}
        {painScores.slice(0, 4).map((entry) => (
          <div key={entry.visitDate.toISOString()} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{formatDate(entry.visitDate)}</span>
            <span className="text-foreground font-medium">{entry.score}/10</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Subjective Context View Component
// =============================================================================

export function SubjectiveContextView({
  patient,
  conditions,
  contextData,
  onConditionStatusChange,
}: ContextViewProps) {
  // Get subjective history
  const subjectiveHistory = useMemo(
    () => getPatientSubjectiveHistory(patient.id, 3),
    [patient.id]
  )

  // Get conditions that have pain scores
  const conditionsWithScores = useMemo(() => {
    return conditions.filter((c) => {
      const scores = getConditionPainScores(c.id)
      return scores.length > 0
    })
  }, [conditions])

  return (
    <div className="flex flex-col gap-4">
      {/* Chief Complaint Header */}
      <div className="flex flex-col gap-0.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Chief Complaint
        </h4>
        <span className="text-[10px] text-muted-foreground/70">
          Focus: Subjective
        </span>
      </div>

      {/* Current Chief Complaint (read-only for now) */}
      <div className="rounded-md bg-muted/30 px-2 py-1.5 text-sm text-foreground">
        Low back pain radiating to left leg. Pain level 3/10. Worse after sitting for long periods.
      </div>

      {/* Separator */}
      <div className="border-t border-border -mx-3" />

      {/* Pain Score Timeline */}
      {conditionsWithScores.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pain Score Timeline
          </h4>
          {conditionsWithScores.map((condition) => (
            <PainScoreTimeline
              key={condition.id}
              conditionId={condition.id}
              conditionName={condition.name}
            />
          ))}
        </div>
      )}

      {/* Separator */}
      {conditionsWithScores.length > 0 && (
        <div className="border-t border-border -mx-3" />
      )}

      {/* Past Subjective Notes */}
      {subjectiveHistory.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Past Subjective
          </h4>
          {subjectiveHistory.map((entry) => (
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

      {/* Separator */}
      <div className="border-t border-border -mx-3" />

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
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Meds
            </h5>
            <button className="text-[10px] text-primary hover:text-primary/80">
              Update →
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {contextData.currentMedications.map((med, i) => (
              <div key={i} className="text-xs text-foreground">{med}</div>
            ))}
          </div>
        </div>
      )}

      {/* Allergies */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Allergies
          </h5>
          <button className="text-[10px] text-primary hover:text-primary/80">
            Update →
          </button>
        </div>
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
    </div>
  )
}
