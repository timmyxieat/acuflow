'use client'

import { ScrollableArea } from './ScrollableArea'
import { type Patient, type PatientCondition, type PatientContextData } from '@/data/mock-data'

export type { PatientContextData }

// =============================================================================
// Props
// =============================================================================

interface PatientContextProps {
  patient: Patient
  conditions?: PatientCondition[]
  contextData?: PatientContextData
}

// =============================================================================
// Section Component
// =============================================================================

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h4>
      {children}
    </div>
  )
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
// Stress Level Indicator
// =============================================================================

function StressIndicator({ level }: { level: 'Low' | 'Moderate' | 'High' }) {
  const colors = {
    Low: 'bg-green-500',
    Moderate: 'bg-amber-500',
    High: 'bg-red-500',
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-full ${colors[level]}`} />
      <span className="text-xs text-muted-foreground">{level} stress</span>
    </div>
  )
}

// =============================================================================
// List Item Component
// =============================================================================

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-foreground py-0.5 flex items-start gap-1">
      <span className="text-muted-foreground">•</span>
      <span className="flex-1">{children}</span>
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-xs text-muted-foreground/60 italic">{message}</p>
  )
}

// =============================================================================
// Patient Context Component
// =============================================================================

export function PatientContext({ patient, conditions = [], contextData }: PatientContextProps) {
  const age = Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  const sexDisplay = patient.sex === 'MALE' ? 'M' : patient.sex === 'FEMALE' ? 'F' : null

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Scrollable content - starts directly without header */}
      <ScrollableArea className="flex-1 py-3 px-3" deps={[patient.id]} hideScrollbar>
        <div className="flex flex-col gap-4">
          {/* Quick Glance */}
          <Section title="Quick Glance">
            {/* Basic info */}
            <div className="text-xs text-foreground">
              {patient.firstName} {patient.lastName}
              <span className="text-muted-foreground"> · {age}y{sexDisplay && `, ${sexDisplay}`}</span>
            </div>

            {/* Life context */}
            {contextData?.occupation && (
              <div className="text-xs text-muted-foreground">{contextData.occupation}</div>
            )}
            {contextData?.maritalStatus && (
              <div className="text-xs text-muted-foreground">
                {contextData.maritalStatus}
                {contextData.children && `, ${contextData.children}`}
              </div>
            )}

            {/* Stress/emotional */}
            {contextData?.stressLevel && (
              <StressIndicator level={contextData.stressLevel} />
            )}
            {contextData?.emotionalState && (
              <div className="text-xs text-muted-foreground italic">
                "{contextData.emotionalState}"
              </div>
            )}
          </Section>

          {/* Active Conditions */}
          {conditions.length > 0 && (
            <Section title="Conditions">
              <div className="flex flex-col">
                {conditions.map((condition) => (
                  <ConditionBadge key={condition.id} condition={condition} />
                ))}
              </div>
            </Section>
          )}

          {/* Medical History */}
          <Section title="Medical History">
            {contextData?.pastSurgeries && contextData.pastSurgeries.length > 0 ? (
              <div className="flex flex-col">
                {contextData.pastSurgeries.map((surgery, i) => (
                  <ListItem key={i}>{surgery}</ListItem>
                ))}
              </div>
            ) : contextData?.priorDiagnoses && contextData.priorDiagnoses.length > 0 ? (
              <div className="flex flex-col">
                {contextData.priorDiagnoses.map((diagnosis, i) => (
                  <ListItem key={i}>{diagnosis}</ListItem>
                ))}
              </div>
            ) : (
              <EmptyState message="No significant history" />
            )}
          </Section>

          {/* Family History */}
          <Section title="Family History">
            {contextData?.familyHistory && contextData.familyHistory.length > 0 ? (
              <div className="flex flex-col">
                {contextData.familyHistory.map((item, i) => (
                  <ListItem key={i}>{item}</ListItem>
                ))}
              </div>
            ) : (
              <EmptyState message="No family history noted" />
            )}
          </Section>

          {/* Meds & Allergies */}
          <Section title="Meds & Allergies">
            {/* Medications */}
            {contextData?.currentMedications && contextData.currentMedications.length > 0 ? (
              <div className="flex flex-col">
                {contextData.currentMedications.map((med, i) => (
                  <ListItem key={i}>{med}</ListItem>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground/60 italic">No medications</div>
            )}

            {/* Allergies */}
            {contextData?.allergies && contextData.allergies.length > 0 ? (
              <div className="mt-1.5">
                <span className="text-xs font-medium text-red-600">Allergies: </span>
                <span className="text-xs text-foreground">
                  {contextData.allergies.join(', ')}
                </span>
              </div>
            ) : (
              <div className="text-xs text-green-600 mt-1">NKDA</div>
            )}
          </Section>
        </div>
      </ScrollableArea>
    </div>
  )
}
