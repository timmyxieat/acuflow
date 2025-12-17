// =============================================================================
// Animation Configuration for Appointment Detail Page
// =============================================================================
// Centralizes animation logic for consistent behavior across all page sections.
//
// ## How It Works
//
// AnimatePresence uses `key` to determine when to animate:
// - SAME key across renders → component stays mounted → NO animation
// - DIFFERENT key → component unmounts/remounts → triggers enter/exit animations
//
// ## Key Strategy
//
// | Section        | Key Pattern                  | Result                                    |
// |----------------|------------------------------|-------------------------------------------|
// | Header Left    | `patient-${patientId}`       | Static for same patient, animates for new |
// | Header Center  | `appointment-${appointmentId}` | Always animates (content changes)         |
// | Header Right   | `appointment-${appointmentId}` | Always animates (content changes)         |
// | Visit History  | `patient-${patientId}`       | Static for same patient, animates for new |
// | SOAP Panel     | `${appointmentId}`           | Always animates (content changes)         |
// | Patient Context| `context-${appointmentId}`   | Always animates (content changes)         |
//
// ## Animation Scenarios
//
// | Scenario          | Trigger                                 | Left Section | Center/Right | Visit History | SOAP/Context |
// |-------------------|-----------------------------------------|--------------|--------------|---------------|--------------|
// | From Today        | Click patient on Today screen           | Slide right→ | Slide right→ | Slide right→  | Slide right→ |
// | Same Patient      | Click Visit History (same patient)      | Static       | Slide ↑↓     | Static        | Slide ↑↓     |
// | Different Patient | Click different patient in PatientCards | Slide ↑↓     | Slide ↑↓     | Slide ↑↓      | Slide ↑↓     |
// | Back to Today     | Back button / ESC                       | Slide ←left  | Slide ←left  | Slide ←left   | Slide ←left  |
//
// ## Transition Sources (set by calling code)
//
// | Source        | Set By                          | transitionPatientId        |
// |---------------|---------------------------------|----------------------------|
// | 'today'       | TodayScreen PatientCards click  | Current patient ID         |
// | 'appointment' | Detail page PatientCards click  | Current (source) patient   |
// | 'scheduled'   | Visit History click             | Current (source) patient   |
// | 'back'        | Back button / ESC               | N/A                        |
//
// ## Same Patient Detection
//
// `isSamePatientNavigation` compares `transitionPatientId` (source) with
// `currentPatientId` (destination). If equal, sections with patient-based
// keys stay static.

import { SIDEBAR_ANIMATION, CONTENT_SLIDE_ANIMATION } from '@/lib/animations'

// =============================================================================
// Types
// =============================================================================

export type TransitionSource = 'today' | 'appointment' | 'scheduled' | 'back' | null
export type SlideDirection = 'up' | 'down' | null

export interface AnimationContext {
  /** Source of the navigation transition */
  transitionSource: TransitionSource
  /** Direction for vertical slides */
  slideDirection: SlideDirection
  /** Patient ID from source of transition */
  transitionPatientId: string | null
  /** Patient ID of current (destination) appointment */
  currentPatientId: string | null
  /** Whether we're currently in a transition */
  isTransitioning: boolean
}

export interface AnimationConfig {
  /** Whether this section should animate */
  shouldAnimate: boolean
  /** Initial animation values */
  initial: {
    x: number
    y: number
    opacity: number
  }
  /** Exit animation values */
  exit: {
    x: number
    y: number
    opacity: number
  }
  /** Key to use for AnimatePresence (stable = no animation, changing = animate) */
  key: string
}

// =============================================================================
// Core Logic
// =============================================================================

/**
 * Determines if navigation is between appointments of the SAME patient.
 * This is the key logic for deciding which sections animate.
 *
 * Same patient navigation:
 * - Visit History click (same patient) → Left section static
 * - Scheduled appointment click (same patient) → Left section static
 *
 * Different patient navigation:
 * - PatientCards click (different patient) → All sections animate
 */
export function isSamePatientNavigation(ctx: AnimationContext): boolean {
  // If no transition patient ID set, we can't determine - assume different
  if (ctx.transitionPatientId === null) return false

  // If no current patient ID, assume different
  if (ctx.currentPatientId === null) return false

  // Same patient = source patient matches destination patient
  return ctx.transitionPatientId === ctx.currentPatientId
}

/**
 * Determines if transition is from the Today screen (horizontal slide)
 */
export function isFromTodayScreen(ctx: AnimationContext): boolean {
  return ctx.transitionSource === 'today'
}

/**
 * Determines if any animation should occur for the middle panel (Visit History)
 * Same logic as header left section: static for same-patient, animated for different patient
 */
export function shouldAnimateMiddlePanel(ctx: AnimationContext): boolean {
  if (!ctx.isTransitioning) return false

  // From Today: always animate (horizontal slide)
  if (ctx.transitionSource === 'today') return true

  // From PatientCards or scheduled: only animate if DIFFERENT patient
  // Same patient = static (key stays stable, no animation)
  if (ctx.transitionSource === 'appointment' || ctx.transitionSource === 'scheduled') {
    return !isSamePatientNavigation(ctx)
  }

  return false
}

// =============================================================================
// Section-Specific Animation Configs
// =============================================================================

/**
 * Animation config for the header LEFT section (patient avatar + name)
 * - Static for same-patient navigation
 * - Animated for different-patient navigation or from Today
 */
export function getHeaderLeftConfig(ctx: AnimationContext, patientId: string | null): AnimationConfig {
  const samePatient = isSamePatientNavigation(ctx)
  const fromToday = isFromTodayScreen(ctx)
  const shouldAnimate = ctx.isTransitioning && !samePatient

  const verticalY = CONTENT_SLIDE_ANIMATION.vertical.getInitial(ctx.slideDirection).y

  return {
    shouldAnimate,
    initial: {
      x: fromToday ? 100 : 0,
      y: fromToday ? 0 : verticalY,
      opacity: shouldAnimate ? 0 : 1,
    },
    exit: {
      x: fromToday ? -100 : 0,
      y: fromToday ? 0 : CONTENT_SLIDE_ANIMATION.vertical.getExit(ctx.slideDirection).y,
      opacity: shouldAnimate ? 0 : 1,
    },
    // Key based on patient ID: stable for same patient, changes for different patient
    key: `header-left-patient-${patientId}`,
  }
}

/**
 * Animation config for header CENTER section (date, time, status)
 * Always animates on navigation
 */
export function getHeaderCenterConfig(ctx: AnimationContext, appointmentId: string): AnimationConfig {
  const fromToday = isFromTodayScreen(ctx)
  const verticalY = CONTENT_SLIDE_ANIMATION.vertical.getInitial(ctx.slideDirection).y

  return {
    shouldAnimate: ctx.isTransitioning,
    initial: {
      x: fromToday ? 100 : 0,
      y: fromToday ? 0 : verticalY,
      opacity: 0,
    },
    exit: {
      x: fromToday ? -100 : 0,
      y: fromToday ? 0 : CONTENT_SLIDE_ANIMATION.vertical.getExit(ctx.slideDirection).y,
      opacity: 0,
    },
    key: `header-center-${appointmentId}`,
  }
}

/**
 * Animation config for header RIGHT section (visit count)
 * Always animates on navigation
 */
export function getHeaderRightConfig(ctx: AnimationContext, appointmentId: string): AnimationConfig {
  const fromToday = isFromTodayScreen(ctx)
  const verticalY = CONTENT_SLIDE_ANIMATION.vertical.getInitial(ctx.slideDirection).y

  return {
    shouldAnimate: ctx.isTransitioning,
    initial: {
      x: fromToday ? 100 : 0,
      y: fromToday ? 0 : verticalY,
      opacity: 0,
    },
    exit: {
      x: fromToday ? -100 : 0,
      y: fromToday ? 0 : CONTENT_SLIDE_ANIMATION.vertical.getExit(ctx.slideDirection).y,
      opacity: 0,
    },
    key: `header-right-${appointmentId}`,
  }
}

/**
 * Animation config for Visit History panel
 * - Static for same-patient navigation
 * - Animated for different-patient navigation or from Today
 */
export function getVisitHistoryConfig(ctx: AnimationContext, patientId: string | null, appointmentId: string): AnimationConfig {
  const samePatient = isSamePatientNavigation(ctx)
  const fromToday = isFromTodayScreen(ctx)
  const shouldAnimate = shouldAnimateMiddlePanel(ctx)
  const verticalY = CONTENT_SLIDE_ANIMATION.vertical.getInitial(ctx.slideDirection).y

  return {
    shouldAnimate,
    initial: {
      x: fromToday ? 100 : 0,
      y: fromToday ? 0 : verticalY,
      opacity: shouldAnimate ? 0 : 1,
    },
    exit: {
      x: 0,
      y: fromToday ? 0 : CONTENT_SLIDE_ANIMATION.vertical.getExit(ctx.slideDirection).y,
      opacity: shouldAnimate ? 0 : 1,
    },
    // Stable key for same patient, appointment-based key for different patient
    key: samePatient ? `patient-${patientId}` : appointmentId,
  }
}

/**
 * Animation config for SOAP Notes panel
 * Always animates on navigation (keyed by appointment)
 */
export function getSoapPanelConfig(ctx: AnimationContext, appointmentId: string): AnimationConfig {
  const fromToday = isFromTodayScreen(ctx)
  const verticalY = CONTENT_SLIDE_ANIMATION.vertical.getInitial(ctx.slideDirection).y

  return {
    shouldAnimate: true,
    initial: {
      x: fromToday ? 100 : 0,
      y: fromToday ? 0 : verticalY,
      opacity: 0,
    },
    exit: {
      x: 0,
      y: fromToday ? 0 : CONTENT_SLIDE_ANIMATION.vertical.getExit(ctx.slideDirection).y,
      opacity: 0,
    },
    key: appointmentId,
  }
}

/**
 * Animation config for Patient Context panel
 * Always animates on navigation (keyed by appointment)
 */
export function getPatientContextConfig(ctx: AnimationContext, appointmentId: string): AnimationConfig {
  const fromToday = isFromTodayScreen(ctx)
  const verticalY = CONTENT_SLIDE_ANIMATION.vertical.getInitial(ctx.slideDirection).y

  return {
    shouldAnimate: true,
    initial: {
      x: fromToday ? 100 : 0,
      y: fromToday ? 0 : verticalY,
      opacity: 0,
    },
    exit: {
      x: 0,
      y: fromToday ? 0 : CONTENT_SLIDE_ANIMATION.vertical.getExit(ctx.slideDirection).y,
      opacity: 0,
    },
    key: `context-${appointmentId}`,
  }
}

// =============================================================================
// Shared Transition Config
// =============================================================================

export const pageTransition = SIDEBAR_ANIMATION.transition
