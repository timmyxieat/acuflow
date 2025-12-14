'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollableArea, PatientCards } from '@/components/custom'
import { useHeader } from '@/contexts/HeaderContext'
import { useTransition } from '@/contexts/TransitionContext'
import { useHoverWithKeyboardNav } from '@/hooks/useHoverWithKeyboardNav'
import { useAutoSave } from '@/hooks/useAutoSave'
import { saveVisitSOAP, loadVisitSOAP, hasSOAPContent } from '@/lib/api/visits'
import { formatTime } from '@/lib/dev-time'
import {
  SIDEBAR_ANIMATION,
  CONTENT_SLIDE_ANIMATION,
  CARD_SELECTION_ANIMATION,
  SOAP_PREVIEW_ANIMATION,
  BUTTON_POP_ANIMATION,
} from '@/lib/animations'
import {
  getEnrichedAppointments,
  getAppointmentById,
  getAppointmentsByStatus,
  getPatientDisplayName,
  calculateAge,
  getStatusDisplay,
  getPatientVisitHistory,
  getPatientScheduledAppointments,
  getPatientTodayAppointmentId,
  getVisitById,
  type AppointmentWithRelations,
  type VisitWithAppointment,
  type ScheduledAppointmentWithType,
} from '@/data/mock-data'
import { Check, ClipboardCheck, RefreshCw, Sparkles, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Minus } from 'lucide-react'

// Map appointment type IDs to icons (same as Timeline.tsx)
const APPOINTMENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'appt_type_001': ClipboardCheck, // Initial Consultation
  'appt_type_002': RefreshCw, // Follow-up Treatment
  'appt_type_003': Sparkles, // Brief Follow-up
}

// =============================================================================
// Contextual Time Display Helper
// =============================================================================

function getContextualTimeStatus(appointment: AppointmentWithRelations): string {
  const now = new Date()
  const start = new Date(appointment.scheduledStart)
  const end = new Date(appointment.scheduledEnd)

  // Before appointment starts
  if (now < start) {
    const diffMs = start.getTime() - now.getTime()
    const diffMin = Math.round(diffMs / 60000)
    if (diffMin < 60) {
      return `in ${diffMin} min`
    }
    const diffHours = Math.round(diffMin / 60)
    return `in ${diffHours}h`
  }

  // During appointment (between start and end)
  if (now >= start && now < end) {
    const diffMs = end.getTime() - now.getTime()
    const diffMin = Math.round(diffMs / 60000)
    if (diffMin < 60) {
      return `${diffMin} min remaining`
    }
    const diffHours = Math.floor(diffMin / 60)
    const remainingMin = diffMin % 60
    if (remainingMin === 0) {
      return `${diffHours}h remaining`
    }
    return `${diffHours}h ${remainingMin}m remaining`
  }

  // After appointment end
  const diffMs = now.getTime() - end.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 60) {
    return `ended ${diffMin} min ago`
  }
  const diffHours = Math.round(diffMin / 60)
  return `ended ${diffHours}h ago`
}

// =============================================================================
// Patient Header (Left Panel)
// Height matches AppointmentHeader (72px) for visual alignment
// =============================================================================

interface PatientHeaderProps {
  appointment: AppointmentWithRelations
}

function PatientHeader({ appointment }: PatientHeaderProps) {
  const patient = appointment.patient

  if (!patient) {
    return (
      <div className="flex h-[72px] items-center gap-3 px-2 border-b border-border">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
          ?
        </div>
        <div>
          <h2 className="text-lg font-semibold">Unknown Patient</h2>
        </div>
      </div>
    )
  }

  const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase()
  const age = calculateAge(patient.dateOfBirth)
  const sexDisplay = patient.sex === 'MALE' ? 'Male' : patient.sex === 'FEMALE' ? 'Female' : null

  return (
    <div className="flex h-[72px] items-center gap-3 px-2 border-b border-border">
      {/* Avatar */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
        {initials}
      </div>
      <div>
        <h2 className="text-lg font-semibold">{getPatientDisplayName(patient)}</h2>
        <p className="text-sm text-muted-foreground">
          {age} years old{sexDisplay && `, ${sexDisplay}`}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// Visit Timeline (Left Panel)
// =============================================================================

interface VisitTimelineProps {
  patientId: string
  currentAppointmentId: string
  selectedVisitId: string | null
  onSelectVisit: (visitId: string | null, index: number) => void
  onSelectScheduledAppointment?: (appointmentId: string) => void
  hoveredVisitId?: string | null
  onHoverVisit?: (visitId: string | null) => void
  // Focus state for keyboard navigation
  isZoneFocused?: boolean
  focusedIndex?: number
}

function formatVisitDate(date: Date): string {
  const now = new Date()
  const visitDate = new Date(date)

  // Check if same year
  const isSameYear = now.getFullYear() === visitDate.getFullYear()

  if (isSameYear) {
    return visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function VisitCard({
  visit,
  isSelected,
  isHovered,
  isFocused,
  onClick,
  onHover,
}: {
  visit: VisitWithAppointment
  isSelected: boolean
  isHovered?: boolean
  isFocused?: boolean
  onClick: () => void
  onHover?: (isHovered: boolean) => void
}) {
  const appointmentType = visit.appointment?.appointmentType
  const isSigned = visit.appointment?.isSigned ?? true
  const visitDate = visit.appointment?.scheduledStart
    ? new Date(visit.appointment.scheduledStart)
    : new Date(visit.createdAt)

  // Get the icon component for this appointment type (same pattern as Timeline)
  const IconComponent = appointmentType?.id
    ? APPOINTMENT_TYPE_ICONS[appointmentType.id] || Calendar
    : Calendar

  // Build className based on selection and focus states
  // Focus = keyboard navigation indicator (distinct ring)
  // Selected = viewing this visit's content (background + border)
  const getCardClassName = () => {
    const base = 'w-full text-left rounded-lg border p-3 transition-all'

    if (isSelected && isFocused) {
      // Selected + Focused: both states combined (muted ring + keyboard focus indicator)
      return `${base} border-transparent bg-transparent ring-2 ring-inset ring-muted-foreground/40`
    }
    if (isSelected) {
      // Selected only: previewing this visit (muted outline, no fill)
      return `${base} border-transparent bg-transparent ring-2 ring-inset ring-muted-foreground/40`
    }
    if (isFocused) {
      // Focused only: keyboard nav is here
      return `${base} border-primary ring-2 ring-inset ring-primary/50 bg-card`
    }
    if (isHovered) {
      return `${base} border-muted-foreground/20 bg-muted/50`
    }
    return `${base} border-border bg-card`
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={getCardClassName()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Appointment type icon - simple style like Timeline */}
          <IconComponent className="h-4 w-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {/* Date */}
            <span className="text-sm font-medium text-foreground">
              {formatVisitDate(visitDate)}
            </span>
            {/* Chief complaint */}
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {visit.chiefComplaint || 'No chief complaint recorded'}
            </p>
          </div>
        </div>
        {/* Signed indicator */}
        {isSigned && (
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-2.5 w-2.5 text-green-600" />
            </div>
          </div>
        )}
      </div>
      {/* Selection indicator with animation - centered, smooth height */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="mt-2 pt-2 overflow-hidden text-center"
            initial={CARD_SELECTION_ANIMATION.container.initial}
            animate={CARD_SELECTION_ANIMATION.container.animate}
            exit={CARD_SELECTION_ANIMATION.container.exit}
          >
            <motion.div
              className="border-t border-muted-foreground/20 origin-center"
              initial={CARD_SELECTION_ANIMATION.divider.initial}
              animate={CARD_SELECTION_ANIMATION.divider.animate}
              exit={CARD_SELECTION_ANIMATION.divider.exit}
            />
            <motion.span
              className="block mt-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
              initial={CARD_SELECTION_ANIMATION.label.initial}
              animate={CARD_SELECTION_ANIMATION.label.animate}
              exit={CARD_SELECTION_ANIMATION.label.exit}
            >
              Previewing
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

// Card for scheduled appointments (today's and future)
function ScheduledVisitCard({
  appointment,
  isCurrentAppointment,
  onClick,
}: {
  appointment: ScheduledAppointmentWithType
  isCurrentAppointment: boolean
  onClick?: () => void
}) {
  const appointmentType = appointment.appointmentType
  const visitDate = new Date(appointment.scheduledStart)

  // Check signing status
  const hasSoapContent = hasSOAPContent(appointment.id)
  const isSigned = appointment.isSigned

  // Get the icon component for this appointment type
  const IconComponent = appointmentType?.id
    ? APPOINTMENT_TYPE_ICONS[appointmentType.id] || Calendar
    : Calendar

  // Render signing status indicator (16x16 / h-4 w-4 to match VisitCard)
  const renderSigningIndicator = () => {
    if (isSigned) {
      // Signed: green checkmark in circle
      return (
        <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <Check className="h-2.5 w-2.5 text-green-600" />
        </div>
      )
    }
    if (hasSoapContent) {
      // Has content but unsigned: amber minus icon
      return (
        <div className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Minus className="h-2.5 w-2.5 text-amber-600" />
        </div>
      )
    }
    // No content: no indicator
    return null
  }

  // Format the date for scheduled appointments
  const formatScheduledDate = (date: Date): string => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()

    if (isSameDay(date, today)) {
      return 'Today'
    }
    if (isSameDay(date, tomorrow)) {
      return 'Tomorrow'
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // For current appointment (editing), show blue "in progress" styling
  if (isCurrentAppointment) {
    return (
      <div className="w-full text-left rounded-lg border border-blue-500 bg-blue-50 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <IconComponent className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-blue-600">
                {formatScheduledDate(visitDate)}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {appointmentType?.name || 'Appointment'}
              </p>
            </div>
          </div>
          {renderSigningIndicator()}
        </div>
        {/* Selection indicator with animation - centered */}
        <div className="mt-2 pt-2 overflow-hidden text-center">
          <motion.div
            className="border-t border-blue-200 origin-center"
            initial={CARD_SELECTION_ANIMATION.divider.initial}
            animate={CARD_SELECTION_ANIMATION.divider.animate}
          />
          <motion.span
            className="block mt-2 text-[10px] font-medium text-blue-600 uppercase tracking-wider"
            initial={CARD_SELECTION_ANIMATION.label.initial}
            animate={CARD_SELECTION_ANIMATION.label.animate}
          >
            Editing
          </motion.span>
        </div>
      </div>
    )
  }

  // For future appointments, show dashed border and muted styling
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border-2 border-dashed border-muted-foreground/30 p-3 transition-all hover:border-muted-foreground/50 hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-2 opacity-70">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <IconComponent className="h-4 w-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-muted-foreground">
              {formatScheduledDate(visitDate)}
            </span>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {appointmentType?.name || 'Scheduled'}
            </p>
          </div>
        </div>
        {renderSigningIndicator()}
      </div>
    </button>
  )
}

function VisitTimeline({ patientId, currentAppointmentId, selectedVisitId, onSelectVisit, onSelectScheduledAppointment, hoveredVisitId, onHoverVisit, isZoneFocused, focusedIndex }: VisitTimelineProps) {
  const { showFutureAppointments, setShowFutureAppointments } = useTransition()
  const visitHistory = getPatientVisitHistory(patientId)
  const scheduledAppointments = getPatientScheduledAppointments(patientId, currentAppointmentId)

  // Sort all appointments chronologically (farthest date first, nearest at bottom)
  const sortedAppointments = [...scheduledAppointments].sort((a, b) => {
    return new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime()
  })

  // Count collapsible future appointments (future && not current) for the expand/collapse button
  const collapsibleCount = sortedAppointments.filter(a => a.isFuture && a.id !== currentAppointmentId).length

  // Handler for clicking on a scheduled appointment
  const handleScheduledAppointmentClick = (appointmentId: string) => {
    if (onSelectScheduledAppointment) {
      onSelectScheduledAppointment(appointmentId)
    }
  }

  // Determine if an appointment should be visible
  const isAppointmentVisible = (appointment: ScheduledAppointmentWithType) => {
    // Always show today's appointments and the current appointment
    if (!appointment.isFuture || appointment.id === currentAppointmentId) return true
    // Show other future appointments only when expanded
    return showFutureAppointments
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Scheduled Visits Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Scheduled Visits
          </h3>
          {/* Expand/Collapse button for future appointments */}
          {collapsibleCount > 0 && (
            <button
              onClick={() => setShowFutureAppointments(!showFutureAppointments)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showFutureAppointments ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <span>+{collapsibleCount} more</span>
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* Single chronological list - visibility controlled by isAppointmentVisible */}
          {sortedAppointments.filter(isAppointmentVisible).map((appointment) => (
            <ScheduledVisitCard
              key={appointment.id}
              appointment={appointment}
              isCurrentAppointment={appointment.id === currentAppointmentId}
              onClick={appointment.id !== currentAppointmentId ? () => handleScheduledAppointmentClick(appointment.id) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Visit History Section */}
      <div className="flex flex-col gap-3">
        <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Visit History
        </h3>

        {visitHistory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              First visit for this patient
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Past visits will appear here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visitHistory.map((visit, index) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                isSelected={selectedVisitId === visit.id}
                isHovered={hoveredVisitId === visit.id}
                isFocused={isZoneFocused && focusedIndex === index}
                onClick={() => onSelectVisit(selectedVisitId === visit.id ? null : visit.id, index)}
                onHover={(isHovered) => onHoverVisit?.(isHovered ? visit.id : null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Appointment Header (Right Panel)
// Row 1: Date · relation to today | status badge | action button
// Row 2: Time range (smaller)
// =============================================================================

interface AppointmentHeaderProps {
  appointment: AppointmentWithRelations
}

function getRelativeDay(date: Date): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()

  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, tomorrow)) return 'Tomorrow'
  if (isSameDay(date, yesterday)) return 'Yesterday'

  // Calculate days difference
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`

  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

function AppointmentHeader({ appointment }: AppointmentHeaderProps) {
  const statusDisplay = getStatusDisplay(appointment.status, appointment.isSigned)

  // Determine action button
  const getActionButton = () => {
    if (appointment.status === 'SCHEDULED') {
      return { label: 'Start Appointment' }
    }
    if (appointment.status === 'IN_PROGRESS') {
      return { label: 'End Appointment' }
    }
    if (appointment.status === 'COMPLETED' && !appointment.isSigned) {
      return { label: 'Sign Note' }
    }
    return null
  }

  const action = getActionButton()
  const appointmentDate = new Date(appointment.scheduledStart)
  const dateStr = appointmentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const relativeDay = getRelativeDay(appointmentDate)
  const timeRange = `${formatTime(appointment.scheduledStart)} - ${formatTime(appointment.scheduledEnd)}`

  return (
    <div className="flex h-[72px] items-center justify-between border-b border-border px-2">
      {/* Left: Date + time in a column */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold">{dateStr}</span>
          <span className="text-sm text-muted-foreground">· {relativeDay}</span>
        </div>
        <div className="text-sm text-muted-foreground">{timeRange}</div>
      </div>

      {/* Right: Status badge + action button */}
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.textColor}`}>
          {statusDisplay.label}
        </span>
        {action && (
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// SOAP Sections (Right Panel)
// =============================================================================

type SOAPKey = 'subjective' | 'objective' | 'assessment' | 'plan'

interface SOAPData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface SOAPSectionsProps {
  selectedVisitId: string | null
  soapData: SOAPData
  onSoapChange: (key: SOAPKey, value: string) => void
  onUsePastTreatment?: () => void
  // Focus state for keyboard navigation
  isZoneFocused: boolean
  focusedIndex: number
  isEditing: boolean
  textareaRefs: React.MutableRefObject<(HTMLTextAreaElement | null)[]>
  onTextareaFocus: (index: number) => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

function SOAPSections({
  selectedVisitId,
  soapData,
  onSoapChange,
  onUsePastTreatment,
  isZoneFocused,
  focusedIndex,
  isEditing,
  textareaRefs,
  onTextareaFocus,
  saveStatus,
}: SOAPSectionsProps) {
  // Get the selected past visit for preview
  const selectedVisit = selectedVisitId ? getVisitById(selectedVisitId) : null

  // Extract raw text from visit SOAP fields
  const getVisitSoapContent = (key: SOAPKey): string | null => {
    if (!selectedVisit) return null
    const field = selectedVisit[key] as { raw?: string } | null
    return field?.raw || null
  }

  const sections: { key: SOAPKey; label: string }[] = [
    { key: 'subjective', label: 'Subjective' },
    { key: 'objective', label: 'Objective' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
  ]

  // Render save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
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

  return (
    <div className="flex flex-col gap-4">
      {/* SOAP Header with save status */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          SOAP Note
        </h3>
        {renderSaveStatus()}
      </div>

      {sections.map((section, index) => {
        const previewContent = getVisitSoapContent(section.key)
        const isPlan = section.key === 'plan'
        const isFocused = isZoneFocused && focusedIndex === index && !isEditing

        return (
          <div key={section.key} className="flex flex-col gap-2">
            {/* Section header with optional action button */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <AnimatePresence>
                {isPlan && selectedVisit && onUsePastTreatment && (
                  <motion.button
                    onClick={onUsePastTreatment}
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                    initial={BUTTON_POP_ANIMATION.initial}
                    animate={BUTTON_POP_ANIMATION.animate}
                    exit={BUTTON_POP_ANIMATION.exit}
                  >
                    Use past treatment
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Textarea for current note - auto-expands with content */}
            {/* Focus states: keyboard nav focus (ring-primary/50) vs typing focus (ring-primary/20) */}
            <textarea
              ref={(el) => { textareaRefs.current[index] = el }}
              value={soapData[section.key]}
              onChange={(e) => onSoapChange(section.key, e.target.value)}
              onFocus={() => onTextareaFocus(index)}
              placeholder={`Enter ${section.label.toLowerCase()} notes...`}
              className={`w-full rounded-lg border bg-background p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary transition-colors field-sizing-content ${
                isFocused ? 'border-primary ring-2 ring-inset ring-primary/50' : 'border-border'
              }`}
              rows={2}
            />

            {/* Compact preview from selected past visit - smooth height animation */}
            <AnimatePresence mode="wait">
              {previewContent && (
                <motion.div
                  key={`${selectedVisitId}-${section.key}`}
                  className="overflow-hidden"
                  initial={SOAP_PREVIEW_ANIMATION.container.initial}
                  animate={SOAP_PREVIEW_ANIMATION.container.animate(index)}
                  exit={SOAP_PREVIEW_ANIMATION.container.exit}
                >
                  <p className="rounded bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground italic line-clamp-2">
                    {previewContent}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// =============================================================================
// Patient Intake Section (Right Panel) - Placeholder
// =============================================================================

function PatientIntakeSection() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Patient Intake</h3>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Expand
        </button>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Patient intake form will appear here (future feature)
      </div>
    </div>
  )
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { setHeader, resetHeader } = useHeader()
  const {
    isTransitioning,
    transitionSource,
    transitionPatientId,
    slideDirection,
    startTransition,
    setSlideDirection,
    setSelectedAppointmentId,
    isKeyboardNavMode,
    setKeyboardNavMode,
    isPatientCardsCollapsed,
    setPatientCardsCollapsed,
    completeTransition,
  } = useTransition()
  const appointmentId = params.id as string

  // State for selected visit in timeline (for preview)
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null)

  // State for SOAP note content
  const [soapData, setSoapData] = useState<SOAPData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })

  // Two-zone keyboard navigation state
  type FocusZone = 'soap' | 'visits'
  const [focusZone, setFocusZone] = useState<FocusZone>('soap')
  const [focusedSoapIndex, setFocusedSoapIndex] = useState(0) // 0=S, 1=O, 2=A, 3=P
  const [focusedVisitIndex, setFocusedVisitIndex] = useState(0)
  const [isEditingField, setIsEditingField] = useState(false)
  const soapFieldKeys: SOAPKey[] = ['subjective', 'objective', 'assessment', 'plan']

  // Refs for SOAP textareas
  const soapTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([null, null, null, null])

  // Auto-save SOAP notes
  const { status: saveStatus, markAsSaved, flush: flushSave } = useAutoSave({
    data: soapData,
    onSave: async (data) => {
      await saveVisitSOAP({ appointmentId, soap: data })
    },
  })

  // Load saved SOAP data from localStorage on mount or when appointment changes
  useEffect(() => {
    const saved = loadVisitSOAP(appointmentId)
    if (saved) {
      setSoapData(saved)
      markAsSaved(saved) // Mark loaded data as already saved
    } else {
      // Reset to empty if no saved data (for new appointments)
      const empty = {
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      }
      setSoapData(empty)
      markAsSaved(empty) // Mark empty as saved to prevent initial save
    }
  }, [appointmentId, markAsSaved])

  // Hover state with keyboard nav awareness
  const [, setHoveredAppointmentId, effectiveHoveredAppointmentId] = useHoverWithKeyboardNav<string>()
  const [, setHoveredVisitId, effectiveHoveredVisitId] = useHoverWithKeyboardNav<string>()

  // Find the appointment from mock data (searches today + future appointments)
  const appointment = getAppointmentById(appointmentId)

  // Get flat ordered list of all appointments (same order as PatientCards)
  const orderedAppointmentIds = useMemo(() => {
    const grouped = getAppointmentsByStatus()
    return [
      ...grouped.inProgress,
      ...grouped.checkedIn,
      ...grouped.scheduled,
      ...grouped.unsigned,
      ...grouped.completed,
    ].map(a => a.id)
  }, [])

  // Get ordered visit IDs for the current patient (for arrow key navigation in visit history)
  const orderedVisitIds = useMemo(() => {
    if (!appointment?.patient?.id) return []
    return getPatientVisitHistory(appointment.patient.id).map(v => v.id)
  }, [appointment?.patient?.id])

  // Get today's appointment ID for the patient (for PatientCards selection)
  // When viewing a future appointment, we still want to highlight the patient's today card
  const selectedAppointmentIdForCards = useMemo(() => {
    if (!appointment?.patient?.id) return undefined
    return getPatientTodayAppointmentId(appointment.patient.id) ?? undefined
  }, [appointment?.patient?.id])

  // Set the global header when this page mounts
  useEffect(() => {
    if (appointment) {
      setHeader({
        showBackButton: true,
      })
    }

    // Reset header when leaving the page
    return () => {
      resetHeader()
    }
  // Only re-run when appointment ID changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  // Complete transition after animation
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        completeTransition()
      }, 400) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [isTransitioning, completeTransition])

  // Handle keyboard shortcuts - Two-zone navigation (SOAP ↔ Visit History)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if user is typing in an input/textarea
    const activeElement = document.activeElement
    const isTyping = activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement?.getAttribute('contenteditable') === 'true'

    // ESC: if editing, exit edit mode and stay in SOAP zone
    // If not editing and in visits zone with selection, deselect
    // Otherwise go back to Today
    if (event.key === 'Escape') {
      if (isTyping && activeElement instanceof HTMLElement) {
        activeElement.blur()
        setIsEditingField(false)
        return
      }
      if (focusZone === 'visits' && selectedVisitId) {
        setSelectedVisitId(null)
        return
      }
      router.push('/')
      return
    }

    // Enter key
    if (event.key === 'Enter' && !isTyping) {
      event.preventDefault()
      setKeyboardNavMode(true)

      if (focusZone === 'soap') {
        // Enter edit mode for the focused SOAP field
        const textarea = soapTextareaRefs.current[focusedSoapIndex]
        if (textarea) {
          textarea.focus()
          setIsEditingField(true)
        }
      } else if (focusZone === 'visits' && orderedVisitIds.length > 0) {
        // Toggle visit selection
        const visitId = orderedVisitIds[focusedVisitIndex]
        if (selectedVisitId === visitId) {
          setSelectedVisitId(null)
        } else {
          setSelectedVisitId(visitId)
        }
      }
      return
    }

    // Arrow keys (only when not typing)
    if (!isTyping) {
      setKeyboardNavMode(true)

      // Up/Down: navigate within current zone
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()

        if (focusZone === 'soap') {
          // Navigate between SOAP fields
          const newIndex = event.key === 'ArrowDown'
            ? Math.min(focusedSoapIndex + 1, 3)
            : Math.max(focusedSoapIndex - 1, 0)
          setFocusedSoapIndex(newIndex)
        } else if (focusZone === 'visits' && orderedVisitIds.length > 0) {
          // Navigate between visits
          const newIndex = event.key === 'ArrowDown'
            ? Math.min(focusedVisitIndex + 1, orderedVisitIds.length - 1)
            : Math.max(focusedVisitIndex - 1, 0)
          setFocusedVisitIndex(newIndex)
        }
        return
      }

      // Left: switch to visits zone (if visits exist)
      if (event.key === 'ArrowLeft' && focusZone === 'soap' && orderedVisitIds.length > 0) {
        event.preventDefault()
        setFocusZone('visits')
        return
      }

      // Right: switch to SOAP zone
      if (event.key === 'ArrowRight' && focusZone === 'visits') {
        event.preventDefault()
        setFocusZone('soap')
        return
      }

      // Character typing in SOAP zone - auto-focus into textarea
      if (focusZone === 'soap' && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const textarea = soapTextareaRefs.current[focusedSoapIndex]
        if (textarea) {
          textarea.focus()
          // Move cursor to end of existing content
          textarea.selectionStart = textarea.selectionEnd = textarea.value.length
          setIsEditingField(true)
          // Don't prevent default - let the character type
        }
      }
    }
  }, [router, focusZone, focusedSoapIndex, focusedVisitIndex, orderedVisitIds, selectedVisitId, setKeyboardNavMode])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Handle visit selection from timeline (also sets navigation focus)
  const handleSelectVisit = (visitId: string | null, index: number) => {
    setSelectedVisitId(visitId)
    setFocusZone('visits')
    setFocusedVisitIndex(index)
  }

  // Handle SOAP field changes
  const handleSoapChange = useCallback((key: SOAPKey, value: string) => {
    setSoapData(prev => ({ ...prev, [key]: value }))
  }, [])

  // Handle textarea focus (when user clicks into a SOAP field)
  const handleTextareaFocus = useCallback((index: number) => {
    setFocusedSoapIndex(index)
    setFocusZone('soap')
    setIsEditingField(true)
  }, [])

  // Handle "Use past treatment" button - copy plan from selected visit
  const handleUsePastTreatment = useCallback(() => {
    if (!selectedVisitId) return
    const visit = getVisitById(selectedVisitId)
    if (!visit) return

    const planField = visit.plan as { raw?: string } | null
    const planContent = planField?.raw || ''

    if (planContent) {
      // Append to existing plan or replace if empty
      setSoapData(prev => ({
        ...prev,
        plan: prev.plan ? `${prev.plan}\n\n--- From past visit ---\n${planContent}` : planContent,
      }))
    }
  }, [selectedVisitId])

  if (!appointment) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Appointment not found</h1>
          <p className="text-sm text-muted-foreground mt-1">
            The appointment you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  // Handle appointment click from PatientCards - navigate to that appointment or back to Today
  const handleAppointmentClick = (clickedAppointment: AppointmentWithRelations, rect?: DOMRect) => {
    if (clickedAppointment.id === appointmentId) {
      // Clicking the already-selected card: deselect and go back to Today
      setSelectedAppointmentId(null)
      router.push('/')
    } else {
      // Calculate slide direction based on position in list
      const currIndex = orderedAppointmentIds.indexOf(appointmentId)
      const newIndex = orderedAppointmentIds.indexOf(clickedAppointment.id)

      if (currIndex !== -1 && newIndex !== -1) {
        // If clicking appointment below current, slide down; if above, slide up
        setSlideDirection(newIndex > currIndex ? 'down' : 'up')
      }

      if (rect) {
        // Pass current patient ID to detect same vs different patient transitions
        startTransition(rect, 'appointment', appointment?.patient?.id)
      }
      router.push(`/appointments/${clickedAppointment.id}`)
    }
  }

  // Only animate sidebar width when coming from Today screen (not when switching scheduled visits)
  const shouldAnimateSidebar = transitionSource === 'today' && isTransitioning

  // Determine if Middle Panel should animate (patient-level transitions)
  // Animate when:
  // 1. Coming from Today screen (with active transition)
  // 2. Switching patients via PatientCards ('appointment' transition)
  // 3. Switching to different patient via scheduled visit navigation
  // Do NOT animate when:
  // - Fresh page load (no active transition)
  // - Same-patient scheduled visit navigation
  const shouldAnimateMiddlePanel = isTransitioning && (
    // Coming from Today screen
    transitionSource === 'today' ||
    // Switching patients via PatientCards
    transitionSource === 'appointment' ||
    // Switching to different patient via scheduled visit
    (transitionSource === 'scheduled' && transitionPatientId !== null && transitionPatientId !== appointment?.patient?.id)
  )

  // Stable key for Middle Panel that doesn't depend on isTransitioning
  // This prevents the key from changing when completeTransition() runs
  const isSamePatientNavigation = transitionSource === 'scheduled' &&
    transitionPatientId !== null &&
    transitionPatientId === appointment?.patient?.id

  // For same-patient navigation, use patient-based key (stable across appointments)
  // For different-patient or Today transitions, use appointment-based key (triggers animation)
  const middlePanelKey = isSamePatientNavigation
    ? `patient-${appointment?.patient?.id}`
    : appointmentId

  return (
    <div className="flex h-full overflow-hidden">
      {/* Patient Cards - collapsible, animate width */}
      <motion.div
        className="flex flex-col relative flex-shrink-0"
        initial={shouldAnimateSidebar ? { width: SIDEBAR_ANIMATION.expandedWidth } : false}
        animate={{
          width: isPatientCardsCollapsed
            ? SIDEBAR_ANIMATION.collapsedWidth
            : SIDEBAR_ANIMATION.expandedWidth
        }}
        transition={SIDEBAR_ANIMATION.transition}
      >
        <div className="h-full">
          <PatientCards
            onAppointmentClick={handleAppointmentClick}
            onAppointmentHover={setHoveredAppointmentId}
            hoveredAppointmentId={effectiveHoveredAppointmentId}
            selectedAppointmentId={selectedAppointmentIdForCards}
            compact={isPatientCardsCollapsed}
          />
        </div>

        {/* Collapse/Expand toggle button */}
        <button
          onClick={() => setPatientCardsCollapsed(!isPatientCardsCollapsed)}
          className="absolute top-1/2 -right-3 z-10 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-sidebar border border-border shadow-sm hover:bg-muted transition-colors"
          aria-label={isPatientCardsCollapsed ? 'Expand patient cards' : 'Collapse patient cards'}
        >
          {isPatientCardsCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </motion.div>

      {/* Vertical divider */}
      <div className="w-px bg-border" />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Middle Panel - Patient Info & Visit Timeline */}
        {/* Static on fresh load and same-patient transitions, animated on patient switch */}
        <AnimatePresence mode="wait" initial={true}>
          <motion.div
            key={middlePanelKey}
            className="flex w-[300px] flex-col border-r border-border bg-card"
            initial={{
              // Horizontal slide from right for 'today' transitions
              x: shouldAnimateMiddlePanel && transitionSource === 'today' ? 100 : 0,
              // Vertical slide for patient-switching transitions
              y: shouldAnimateMiddlePanel && transitionSource !== 'today'
                ? CONTENT_SLIDE_ANIMATION.vertical.getInitial(slideDirection).y
                : 0,
              opacity: shouldAnimateMiddlePanel ? 0 : 1,
            }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{
              y: shouldAnimateMiddlePanel && transitionSource !== 'today'
                ? CONTENT_SLIDE_ANIMATION.vertical.getExit(slideDirection).y
                : 0,
              opacity: shouldAnimateMiddlePanel ? 0 : 1,
            }}
            transition={SIDEBAR_ANIMATION.transition}
          >
            {/* Patient Header - always static within this panel */}
            <PatientHeader appointment={appointment} />

            {/* Visit Timeline - Scrollable */}
            <ScrollableArea className="flex-1 py-4 pl-2 pr-0" deps={[appointmentId]}>
              {appointment.patient && (
                <VisitTimeline
                  patientId={appointment.patient.id}
                  currentAppointmentId={appointmentId}
                  selectedVisitId={selectedVisitId}
                  onSelectVisit={handleSelectVisit}
                  onSelectScheduledAppointment={async (apptId) => {
                    // Flush any pending SOAP saves before navigating
                    await flushSave()
                    // Determine direction based on appointment dates
                    const currentApptDate = new Date(appointment.scheduledStart)
                    const targetAppt = getAppointmentById(apptId)
                    if (targetAppt) {
                      const targetApptDate = new Date(targetAppt.scheduledStart)
                      const direction = targetApptDate > currentApptDate ? 'down' : 'up'
                      setSlideDirection(direction)
                    }
                    // Set transition source to 'scheduled' with current patient ID for same-patient detection
                    startTransition({ x: 0, y: 0, width: 0, height: 0 } as DOMRect, 'scheduled', appointment.patient?.id)
                    router.push(`/appointments/${apptId}`)
                  }}
                  hoveredVisitId={effectiveHoveredVisitId}
                  onHoverVisit={setHoveredVisitId}
                  isZoneFocused={focusZone === 'visits'}
                  focusedIndex={focusedVisitIndex}
                />
              )}
            </ScrollableArea>
          </motion.div>
        </AnimatePresence>

        {/* Right Panel - Appointment Details & SOAP */}
        {/* This section always animates: horizontal from Today, vertical between appointments/scheduled */}
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          <AnimatePresence mode="wait" initial={true}>
            <motion.div
              key={appointmentId}
              className="flex flex-1 flex-col overflow-hidden"
              initial={{
                x: transitionSource === 'today' ? 100 : 0,
                y: (transitionSource === 'appointment' || transitionSource === 'scheduled')
                  ? CONTENT_SLIDE_ANIMATION.vertical.getInitial(slideDirection).y
                  : 0,
                opacity: 0,
              }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={{
                y: (transitionSource === 'appointment' || transitionSource === 'scheduled')
                  ? CONTENT_SLIDE_ANIMATION.vertical.getExit(slideDirection).y
                  : 0,
                opacity: 0,
              }}
              transition={SIDEBAR_ANIMATION.transition}
            >
              {/* Appointment Header */}
              <AppointmentHeader appointment={appointment} />

              {/* Scrollable Content */}
              <ScrollableArea className="flex-1 py-4 pl-2 pr-0" deps={[appointmentId]}>
                <div className="flex flex-col gap-4">
                  {/* Patient Intake (Collapsible) */}
                  <PatientIntakeSection />

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* SOAP Sections */}
                  <SOAPSections
                    selectedVisitId={selectedVisitId}
                    soapData={soapData}
                    onSoapChange={handleSoapChange}
                    onUsePastTreatment={handleUsePastTreatment}
                    isZoneFocused={focusZone === 'soap'}
                    focusedIndex={focusedSoapIndex}
                    isEditing={isEditingField}
                    textareaRefs={soapTextareaRefs}
                    onTextareaFocus={handleTextareaFocus}
                    saveStatus={saveStatus}
                  />
                </div>
              </ScrollableArea>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
