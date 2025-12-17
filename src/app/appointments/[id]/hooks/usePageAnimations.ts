import { useMemo } from 'react'
import { useTransition } from '@/contexts/TransitionContext'
import {
  type AnimationContext,
  type AnimationConfig,
  isSamePatientNavigation as checkSamePatient,
  getHeaderLeftConfig,
  getHeaderCenterConfig,
  getHeaderRightConfig,
  getVisitHistoryConfig,
  getSoapPanelConfig,
  getPatientContextConfig,
  pageTransition,
} from '../lib/animation-config'

// =============================================================================
// usePageAnimations Hook
// =============================================================================
// Centralizes animation state and configuration for the appointment detail page.
// Components receive pre-computed animation configs rather than calculating internally.

export interface PageAnimations {
  /** Animation context derived from TransitionContext */
  context: AnimationContext
  /** Whether this is same-patient navigation (left section stays static) */
  isSamePatientNavigation: boolean
  /** Animation config for header left section */
  headerLeft: AnimationConfig
  /** Animation config for header center section */
  headerCenter: AnimationConfig
  /** Animation config for header right section */
  headerRight: AnimationConfig
  /** Animation config for visit history panel */
  visitHistory: AnimationConfig
  /** Animation config for SOAP panel */
  soapPanel: AnimationConfig
  /** Animation config for patient context panel */
  patientContext: AnimationConfig
  /** Shared transition settings */
  transition: typeof pageTransition
}

interface UsePageAnimationsOptions {
  /** Current appointment ID */
  appointmentId: string
  /** Current patient ID (destination) */
  currentPatientId: string | null
}

/**
 * Hook that provides animation configurations for all page sections.
 * Reads from TransitionContext and computes appropriate animations based on
 * navigation source and patient relationship.
 */
export function usePageAnimations({
  appointmentId,
  currentPatientId,
}: UsePageAnimationsOptions): PageAnimations {
  const {
    isTransitioning,
    transitionSource,
    transitionPatientId,
    slideDirection,
  } = useTransition()

  // Build animation context from transition state
  const context: AnimationContext = useMemo(() => ({
    transitionSource,
    slideDirection,
    transitionPatientId,
    currentPatientId,
    isTransitioning,
  }), [transitionSource, slideDirection, transitionPatientId, currentPatientId, isTransitioning])

  // Compute whether this is same-patient navigation
  const isSamePatientNavigation = useMemo(
    () => checkSamePatient(context),
    [context]
  )

  // Compute animation configs for each section
  const headerLeft = useMemo(
    () => getHeaderLeftConfig(context, currentPatientId),
    [context, currentPatientId]
  )

  const headerCenter = useMemo(
    () => getHeaderCenterConfig(context, appointmentId),
    [context, appointmentId]
  )

  const headerRight = useMemo(
    () => getHeaderRightConfig(context, appointmentId),
    [context, appointmentId]
  )

  const visitHistory = useMemo(
    () => getVisitHistoryConfig(context, currentPatientId, appointmentId),
    [context, currentPatientId, appointmentId]
  )

  const soapPanel = useMemo(
    () => getSoapPanelConfig(context, appointmentId),
    [context, appointmentId]
  )

  const patientContext = useMemo(
    () => getPatientContextConfig(context, appointmentId),
    [context, appointmentId]
  )

  return {
    context,
    isSamePatientNavigation,
    headerLeft,
    headerCenter,
    headerRight,
    visitHistory,
    soapPanel,
    patientContext,
    transition: pageTransition,
  }
}
