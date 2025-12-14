'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react'
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
  SPRING_TRANSITION,
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
import { Check, ClipboardCheck, RefreshCw, Sparkles, Calendar, ChevronDown, ChevronUp, Minus, Lock } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { getStatusColor } from '@/lib/constants'

// CSS clamp value for consistent responsive width (20vw, min 180px, max 280px)
const PANEL_WIDTH_CLASS = 'w-[clamp(180px,20vw,280px)]'

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

// Avatar size class - scales in sync with panel width at same viewport breakpoints
// Panel: clamp(180px, 20vw, 280px) scales between 900px-1400px viewport
// Avatar: 3.5vw gives ~32px at 900px and ~49px at 1400px, clamped to 32-48px range
const AVATAR_SIZE_CLASS = 'h-[clamp(32px,3.5vw,48px)] w-[clamp(32px,3.5vw,48px)]'

function PatientHeader({ appointment }: PatientHeaderProps) {
  const patient = appointment.patient

  if (!patient) {
    return (
      <div className="flex h-[72px] items-center gap-2 px-2 border-b border-border">
        <div className={`flex ${AVATAR_SIZE_CLASS} items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground`}>
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
    <div className="flex h-[72px] items-center gap-2 px-2 border-b border-border">
      {/* Avatar - scales with viewport (32px to 48px) */}
      <div className={`flex ${AVATAR_SIZE_CLASS} flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground`}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold truncate">{getPatientDisplayName(patient)}</h2>
        <p className="text-xs text-muted-foreground">
          {age} years old{sexDisplay && `, ${sexDisplay}`}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// Visit Timeline (Left Panel)
// =============================================================================

// =============================================================================
// Timeline Section Colors (matches PatientCards status colors)
// =============================================================================

const TIMELINE_COLORS = {
  scheduled: '#94a3b8',  // Slate - future appointments not yet started
  checkedIn: '#22c55e',  // Green - patient arrived, waiting
  inProgress: '#3b82f6', // Blue - currently being treated
  unsigned: '#f59e0b',   // Amber - needs signature
  completed: '#94a3b8',  // Slate - signed and done
  editing: '#3b82f6',    // Blue - currently editing this appointment
}

// =============================================================================
// Visit Timeline Props & Helpers
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

// Format date for timeline cards
function formatTimelineDate(date: Date): string {
  const now = new Date()
  const visitDate = new Date(date)

  // Check if today
  const isToday = now.toDateString() === visitDate.toDateString()
  if (isToday) return 'Today'

  // Check if tomorrow
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (tomorrow.toDateString() === visitDate.toDateString()) return 'Tomorrow'

  // Check if same year
  const isSameYear = now.getFullYear() === visitDate.getFullYear()
  if (isSameYear) {
    return visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// =============================================================================
// Timeline Section Component (mirrors PatientCards StatusSection)
// =============================================================================

interface TimelineSectionProps {
  title: string
  color: string
  count: number
  dashed?: boolean
  children: React.ReactNode
}

function TimelineSection({ title, color, count, children }: TimelineSectionProps) {
  if (count === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {/* Section header - dot + title + count */}
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground pl-2">
        <div
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="whitespace-nowrap">{title}</span>
        <span>({count})</span>
      </div>

      {/* Cards container - cards have their own left borders */}
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  )
}

// =============================================================================
// Timeline Card Component (unified card for all timeline items)
// =============================================================================

interface TimelineCardProps {
  id: string
  date: Date
  appointmentTypeId?: string
  chiefComplaint?: string | null
  isEditing?: boolean  // True when this card's appointment matches URL's appointmentId
  isUnsigned?: boolean
  isLocked?: boolean   // True when this future appointment is not the next available
  isSelected?: boolean
  isHovered?: boolean
  isFocused?: boolean
  onClick?: () => void
  onHover?: (isHovered: boolean) => void
  color: string
}

// Fixed card height for consistency
const TIMELINE_CARD_HEIGHT = 'h-[52px]'

function TimelineCard({
  id,
  date,
  appointmentTypeId,
  chiefComplaint,
  isEditing,
  isUnsigned,
  isLocked,
  isSelected,
  isHovered,
  isFocused,
  onClick,
  onHover,
  color,
}: TimelineCardProps) {
  // Get appointment type icon
  const IconComponent = appointmentTypeId
    ? APPOINTMENT_TYPE_ICONS[appointmentTypeId] || Calendar
    : Calendar

  // Selection indicator style
  const getSelectionStyle = () => {
    if (isSelected) {
      return {
        backgroundColor: `${color}25`,
        boxShadow: `inset 3px 0 0 0 ${color}`,
      }
    }
    return {}
  }

  // Hover background for non-touch devices (CSS handles @media hover)
  const hoverBgColor = `${color}15`

  // Card content - fixed height, edge-to-edge
  const cardContent = (
    <>
      {/* Hover background - CSS-only (not for locked cards) */}
      {!isSelected && !isEditing && !isLocked && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ backgroundColor: hoverBgColor }}
        />
      )}

      {/* Selection indicator - morphs between cards */}
      {isSelected && (
        <motion.div
          layoutId="timeline-selection-indicator"
          className="absolute inset-0 pointer-events-none"
          style={getSelectionStyle()}
          transition={SPRING_TRANSITION}
        />
      )}

      {/* Card content - fixed height */}
      <div className={`relative z-10 flex items-center justify-between gap-2 pl-3 pr-2 ${TIMELINE_CARD_HEIGHT}`}>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Line 1: Date only */}
          <span className={`text-sm font-medium ${
            isEditing ? 'text-blue-600' :
            isLocked ? 'text-muted-foreground/50' :
            'text-foreground'
          }`}>
            {formatTimelineDate(date)}
          </span>
          {/* Line 2: Chief complaint (always show placeholder if empty for consistent height) */}
          <p className={`text-xs truncate ${isLocked ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
            {chiefComplaint || '\u00A0'}
          </p>
        </div>

        {/* Right side icon */}
        <div className="flex-shrink-0">
          {isEditing && (
            <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
              Editing
            </span>
          )}
          {isLocked && !isEditing && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-4 w-4 flex items-center justify-center">
                  <Lock className="h-3 w-3 text-muted-foreground/40" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">Complete earlier appointments first</p>
              </TooltipContent>
            </Tooltip>
          )}
          {isUnsigned && !isEditing && !isLocked && (
            <div className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Minus className="h-2.5 w-2.5 text-amber-600" />
            </div>
          )}
          {!isEditing && !isUnsigned && !isLocked && (
            <IconComponent className="h-4 w-4 text-muted-foreground/60" />
          )}
        </div>
      </div>
    </>
  )

  // Editing card is not clickable (already viewing this appointment)
  if (isEditing) {
    return (
      <div
        className="relative"
        style={{ boxShadow: `inset 3px 0 0 0 ${color}` }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `${color}20` }}
        />
        {cardContent}
      </div>
    )
  }

  // Locked cards are displayed as divs (not clickable)
  if (isLocked) {
    return (
      <div
        className="relative cursor-not-allowed"
        style={{ boxShadow: `inset 3px 0 0 0 ${color}20` }}
      >
        {cardContent}
      </div>
    )
  }

  // All other cards are buttons
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className="group relative w-full text-left"
      style={{ boxShadow: isSelected ? undefined : `inset 3px 0 0 0 ${color}40` }}
    >
      {cardContent}
    </motion.button>
  )
}

// =============================================================================
// Visit Timeline Component (redesigned to mirror PatientCards)
// =============================================================================

function VisitTimeline({ patientId, currentAppointmentId, selectedVisitId, onSelectVisit, onSelectScheduledAppointment, hoveredVisitId, onHoverVisit, isZoneFocused, focusedIndex }: VisitTimelineProps) {
  const { showFutureAppointments, setShowFutureAppointments } = useTransition()
  const visitHistory = getPatientVisitHistory(patientId)
  const scheduledAppointments = getPatientScheduledAppointments(patientId, currentAppointmentId)

  // Group scheduled appointments by status
  // "Scheduled" includes both today's SCHEDULED appointments AND future (isFuture) appointments
  const scheduledStatusAppts = scheduledAppointments.filter(a =>
    a.status === 'SCHEDULED'
  ).sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())

  const checkedInAppts = scheduledAppointments.filter(a =>
    a.status === 'CHECKED_IN'
  ).sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())

  const inProgressAppts = scheduledAppointments.filter(a =>
    a.status === 'IN_PROGRESS'
  ).sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())

  // Separate unsigned visits (past, not signed) and signed history (completed)
  const unsignedVisits = visitHistory.filter(v => !v.appointment?.isSigned)
  const completedVisits = visitHistory.filter(v => v.appointment?.isSigned)

  // Check if today has any active appointments (Scheduled, Checked In, or In Progress)
  // If so, all future appointments should be locked
  const todayAppointments = scheduledAppointments.filter(a => !a.isFuture)
  const hasActiveTodayAppointment = todayAppointments.some(a =>
    a.status === 'SCHEDULED' ||
    a.status === 'CHECKED_IN' ||
    a.status === 'IN_PROGRESS'
  )

  // Determine the "next available" future appointment (closest future date)
  // If today has active appointments, all future ones are locked
  // Otherwise, the closest future appointment is editable
  const futureScheduledAppts = scheduledStatusAppts.filter(a => a.isFuture)
  const nextAvailableFutureId = hasActiveTodayAppointment
    ? null  // All future appointments locked when today has active
    : (futureScheduledAppts.length > 0 ? futureScheduledAppts[0].id : null)

  // Check if we're editing a future appointment (for auto-expand)
  const isEditingScheduled = scheduledStatusAppts.some(a => a.id === currentAppointmentId)

  // Auto-expand scheduled section if we're editing a scheduled appointment
  useEffect(() => {
    if (isEditingScheduled && !showFutureAppointments) {
      setShowFutureAppointments(true)
    }
  }, [isEditingScheduled, showFutureAppointments, setShowFutureAppointments])

  // Handler for clicking a scheduled appointment (navigates to it)
  const handleScheduledAppointmentClick = (appointmentId: string) => {
    if (onSelectScheduledAppointment) {
      onSelectScheduledAppointment(appointmentId)
    }
  }

  // Track index for keyboard navigation across all selectable items
  // Selectable items: unsigned visits + completed visits
  const getGlobalIndex = (section: 'unsigned' | 'completed', localIndex: number): number => {
    if (section === 'unsigned') return localIndex
    return unsignedVisits.length + localIndex
  }

  // Determine if an appointment is locked (future but not next available)
  const isAppointmentLocked = (appointment: ScheduledAppointmentWithType): boolean => {
    // Only future appointments can be locked
    if (!appointment.isFuture) return false
    // The currently editing appointment is never locked
    if (appointment.id === currentAppointmentId) return false
    // Lock if it's not the next available future appointment
    return appointment.id !== nextAvailableFutureId
  }

  // Count scheduled appointments for section header
  const scheduledCount = scheduledStatusAppts.length

  // When collapsed, show unlocked appointments (today's + next available future)
  // Locked appointments are hidden when collapsed
  const unlockedScheduledAppts = scheduledStatusAppts.filter(a => !isAppointmentLocked(a))
  const lockedScheduledAppts = scheduledStatusAppts.filter(a => isAppointmentLocked(a))
  const lockedCount = lockedScheduledAppts.length

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Scheduled Section - Future appointments not yet started */}
      {scheduledCount > 0 && (
        <div className="flex flex-col gap-2">
          {/* Section header with expand/collapse */}
          <div className="flex items-center justify-between pl-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: TIMELINE_COLORS.scheduled }}
              />
              <span className="whitespace-nowrap">Scheduled</span>
              <span>({scheduledCount})</span>
            </div>
            {lockedCount > 0 && (
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
                    <span>Show all</span>
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Scheduled cards - when collapsed, show unlocked; when expanded, show all */}
          <div className="flex flex-col">
            {(showFutureAppointments ? scheduledStatusAppts : unlockedScheduledAppts).map((appointment) => {
              const isLocked = isAppointmentLocked(appointment)
              const isEditing = appointment.id === currentAppointmentId
              return (
                <TimelineCard
                  key={appointment.id}
                  id={appointment.id}
                  date={new Date(appointment.scheduledStart)}
                  appointmentTypeId={appointment.appointmentType?.id}
                  isEditing={isEditing}
                  isLocked={isLocked}
                  onClick={!isEditing && !isLocked
                    ? () => handleScheduledAppointmentClick(appointment.id)
                    : undefined}
                  color={isEditing ? TIMELINE_COLORS.editing : TIMELINE_COLORS.scheduled}
                />
              )
            })}
          </div>

        </div>
      )}

      {/* 2. Checked In Section - Patient has arrived, waiting */}
      {checkedInAppts.length > 0 && (
        <TimelineSection
          title="Checked In"
          color={TIMELINE_COLORS.checkedIn}
          count={checkedInAppts.length}
        >
          {checkedInAppts.map((appointment) => (
            <TimelineCard
              key={appointment.id}
              id={appointment.id}
              date={new Date(appointment.scheduledStart)}
              appointmentTypeId={appointment.appointmentType?.id}
              isEditing={appointment.id === currentAppointmentId}
              onClick={appointment.id !== currentAppointmentId
                ? () => handleScheduledAppointmentClick(appointment.id)
                : undefined}
              color={appointment.id === currentAppointmentId
                ? TIMELINE_COLORS.editing
                : TIMELINE_COLORS.checkedIn}
            />
          ))}
        </TimelineSection>
      )}

      {/* 3. In Progress Section - Currently being treated */}
      {inProgressAppts.length > 0 && (
        <TimelineSection
          title="In Progress"
          color={TIMELINE_COLORS.inProgress}
          count={inProgressAppts.length}
        >
          {inProgressAppts.map((appointment) => (
            <TimelineCard
              key={appointment.id}
              id={appointment.id}
              date={new Date(appointment.scheduledStart)}
              appointmentTypeId={appointment.appointmentType?.id}
              isEditing={appointment.id === currentAppointmentId}
              onClick={appointment.id !== currentAppointmentId
                ? () => handleScheduledAppointmentClick(appointment.id)
                : undefined}
              color={appointment.id === currentAppointmentId
                ? TIMELINE_COLORS.editing
                : TIMELINE_COLORS.inProgress}
            />
          ))}
        </TimelineSection>
      )}

      {/* 4. Unsigned Section - Completed but needs signature */}
      {unsignedVisits.length > 0 && (
        <TimelineSection
          title="Unsigned"
          color={TIMELINE_COLORS.unsigned}
          count={unsignedVisits.length}
        >
          {unsignedVisits.map((visit, index) => (
            <TimelineCard
              key={visit.id}
              id={visit.id}
              date={visit.appointment?.scheduledStart
                ? new Date(visit.appointment.scheduledStart)
                : new Date(visit.createdAt)}
              appointmentTypeId={visit.appointment?.appointmentType?.id}
              chiefComplaint={visit.chiefComplaint}
              isUnsigned={true}
              isSelected={selectedVisitId === visit.id}
              isHovered={hoveredVisitId === visit.id}
              isFocused={isZoneFocused && focusedIndex === getGlobalIndex('unsigned', index)}
              onClick={() => onSelectVisit(selectedVisitId === visit.id ? null : visit.id, getGlobalIndex('unsigned', index))}
              onHover={(isHovered) => onHoverVisit?.(isHovered ? visit.id : null)}
              color={TIMELINE_COLORS.unsigned}
            />
          ))}
        </TimelineSection>
      )}

      {/* 5. Completed Section - Signed and done */}
      {completedVisits.length > 0 && (
        <TimelineSection
          title="Completed"
          color={TIMELINE_COLORS.completed}
          count={completedVisits.length}
        >
          {completedVisits.map((visit, index) => (
            <TimelineCard
              key={visit.id}
              id={visit.id}
              date={visit.appointment?.scheduledStart
                ? new Date(visit.appointment.scheduledStart)
                : new Date(visit.createdAt)}
              appointmentTypeId={visit.appointment?.appointmentType?.id}
              chiefComplaint={visit.chiefComplaint}
              isSelected={selectedVisitId === visit.id}
              isHovered={hoveredVisitId === visit.id}
              isFocused={isZoneFocused && focusedIndex === getGlobalIndex('completed', index)}
              onClick={() => onSelectVisit(selectedVisitId === visit.id ? null : visit.id, getGlobalIndex('completed', index))}
              onHover={(isHovered) => onHoverVisit?.(isHovered ? visit.id : null)}
              color={TIMELINE_COLORS.completed}
            />
          ))}
        </TimelineSection>
      )}

      {/* Empty state - first visit */}
      {visitHistory.length === 0 && scheduledAppointments.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            First visit for this patient
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Past visits will appear here
          </p>
        </div>
      )}
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
  const statusColor = getStatusColor(appointment.status, appointment.isSigned)

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

      {/* Right: Status badge (colored dot + black text) + action button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-sm font-medium text-foreground">
            {statusDisplay.label}
          </span>
        </div>
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
  // Preview animation direction
  previewSlideDirection: 'up' | 'down' | null
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
  previewSlideDirection,
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

            {/* Compact preview from selected past visit - crossfade with stable height */}
            <div className="relative">
              <AnimatePresence mode="popLayout">
                {previewContent && (
                  <motion.div
                    key={`${selectedVisitId}-${section.key}`}
                    layout
                    initial={{
                      y: previewSlideDirection === 'up' ? -20 : 20,
                      opacity: 0,
                    }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { duration: 0.2, delay: index * 0.03 },
                    }}
                    exit={{
                      y: previewSlideDirection === 'up' ? 20 : -20,
                      opacity: 0,
                      transition: { duration: 0.15 },
                    }}
                  >
                    <p className="rounded bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground italic line-clamp-2">
                      {previewContent}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
  const searchParams = useSearchParams()
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
  const [selectedVisitId, setSelectedVisitIdState] = useState<string | null>(null)

  // Update URL when preview selection changes
  const updateUrlPreview = useCallback((visitId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (visitId) {
      params.set('preview', visitId)
    } else {
      params.delete('preview')
    }
    const newUrl = `/appointments/${appointmentId}${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newUrl, { scroll: false })
  }, [searchParams, router, appointmentId])

  // Wrapper to set both state and URL
  const setSelectedVisitId = useCallback((visitId: string | null) => {
    setSelectedVisitIdState(visitId)
    updateUrlPreview(visitId)
  }, [updateUrlPreview])
  // Track preview slide direction for animation
  const [previewSlideDirection, setPreviewSlideDirection] = useState<'up' | 'down' | null>(null)

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

  // Dynamic expanded width for panels (calculated client-side)
  const [expandedWidth, setExpandedWidth] = useState(SIDEBAR_ANIMATION.getExpandedWidth())

  // Recalculate width on window resize
  useLayoutEffect(() => {
    const updateWidth = () => setExpandedWidth(SIDEBAR_ANIMATION.getExpandedWidth())
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

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
        currentPatientId: appointment.patient?.id,
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

  // Initialize preview selection from URL or default to most recent
  useEffect(() => {
    if (orderedVisitIds.length === 0) return

    // Check URL for preview param
    const previewFromUrl = searchParams.get('preview')

    if (previewFromUrl && orderedVisitIds.includes(previewFromUrl)) {
      // Valid preview in URL - use it (don't update URL again)
      setSelectedVisitIdState(previewFromUrl)
      setFocusedVisitIndex(orderedVisitIds.indexOf(previewFromUrl))
    } else if (selectedVisitId === null) {
      // No URL param or invalid - default to most recent
      // orderedVisitIds is already sorted (most recent first from getPatientVisitHistory)
      const defaultVisitId = orderedVisitIds[0]
      setSelectedVisitIdState(defaultVisitId)
      setFocusedVisitIndex(0)
      // Update URL with the default
      updateUrlPreview(defaultVisitId)
    }
  // Only run on mount or when visits change, not when searchParams changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedVisitIds, appointmentId])

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
      // Navigate back with patient selection preserved
      const patientId = appointment?.patient?.id
      router.push(patientId ? `/?patient=${patientId}` : '/')
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
    // Determine slide direction based on old vs new index
    const oldIndex = selectedVisitId ? orderedVisitIds.indexOf(selectedVisitId) : -1
    if (oldIndex !== -1 && visitId !== null) {
      // newIndex > oldIndex means clicking below → slide up
      // newIndex < oldIndex means clicking above → slide down
      setPreviewSlideDirection(index > oldIndex ? 'up' : 'down')
    }
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
      // Preserve patient selection in URL
      setSelectedAppointmentId(null)
      const patientId = clickedAppointment.patient?.id
      router.push(patientId ? `/?patient=${patientId}` : '/')
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
      {/* Patient Cards - collapsible, animate width (responsive: 20vw, min 180px, max 280px) */}
      <motion.div
        className={`flex flex-col relative flex-shrink-0 ${!isPatientCardsCollapsed ? PANEL_WIDTH_CLASS : ''}`}
        initial={shouldAnimateSidebar ? { width: expandedWidth } : false}
        animate={{
          width: isPatientCardsCollapsed
            ? SIDEBAR_ANIMATION.collapsedWidth
            : expandedWidth
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
            onToggleCompact={() => setPatientCardsCollapsed(!isPatientCardsCollapsed)}
          />
        </div>
      </motion.div>

      {/* Vertical divider */}
      <div className="w-px bg-border" />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Middle Panel - Patient Info & Visit Timeline (responsive: 20vw, min 180px, max 280px) */}
        {/* Static on fresh load and same-patient transitions, animated on patient switch */}
        <AnimatePresence mode="wait" initial={true}>
          <motion.div
            key={middlePanelKey}
            className={`flex flex-col border-r border-border bg-card ${PANEL_WIDTH_CLASS}`}
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

            {/* Visit Timeline - Scrollable (matches PatientCards spacing) */}
            <ScrollableArea className="flex-1 py-3" deps={[appointmentId]} hideScrollbar>
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
                    previewSlideDirection={previewSlideDirection}
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
