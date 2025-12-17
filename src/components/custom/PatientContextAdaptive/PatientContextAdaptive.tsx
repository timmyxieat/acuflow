'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ScrollableArea } from '../ScrollableArea'
import { FADE_SLIDE_TRANSITION } from '@/lib/animations'
import { DefaultContextView } from './DefaultContextView'
import { SubjectiveContextView } from './SubjectiveContextView'
import { ObjectiveContextView } from './ObjectiveContextView'
import { AssessmentContextView } from './AssessmentContextView'
import { PlanContextView } from './PlanContextView'
import type { PatientContextAdaptiveProps, ContextViewProps } from './types'

// =============================================================================
// Main Container Component
// =============================================================================

export function PatientContextAdaptive({
  patient,
  conditions,
  contextData,
  focusedSection,
  appointmentId,
  visitHistory,
  onConditionStatusChange,
  onAddCondition,
  onUpdateMedications,
  onUpdateAllergies,
}: PatientContextAdaptiveProps) {
  // Common props for all views
  const viewProps: ContextViewProps = {
    patient,
    conditions,
    contextData,
    visitHistory,
    onConditionStatusChange,
  }

  // Render the appropriate view based on focused section
  const renderView = () => {
    switch (focusedSection) {
      case 'subjective':
        return <SubjectiveContextView {...viewProps} />
      case 'objective':
        return <ObjectiveContextView {...viewProps} />
      case 'assessment':
        return <AssessmentContextView {...viewProps} onAddCondition={onAddCondition} />
      case 'plan':
        return <PlanContextView {...viewProps} />
      default:
        return <DefaultContextView {...viewProps} />
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <ScrollableArea className="flex-1 py-3 px-3" deps={[patient.id, focusedSection]} hideScrollbar>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={focusedSection || 'default'}
            initial={FADE_SLIDE_TRANSITION.initial}
            animate={FADE_SLIDE_TRANSITION.animate}
            exit={FADE_SLIDE_TRANSITION.exit}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </ScrollableArea>
    </div>
  )
}
