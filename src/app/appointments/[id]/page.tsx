'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollableArea, PatientCards, PatientContext, BillingTab, CommsTab, ScheduleTab, getBillingStatusPreview, getCommsStatusPreview, getScheduleStatusPreview, type BillingData, type CommsData, type ScheduleData } from '@/components/custom'
import { getBillingDataForAppointment } from '@/data/mock-billing'
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
  getPatientContextData,
  type AppointmentWithRelations,
  type VisitWithAppointment,
  type ScheduledAppointmentWithType,
} from '@/data/mock-data'
import { Check, ClipboardCheck, RefreshCw, Sparkles, Calendar, ChevronDown, Lock, Timer, LogOut, Plus, X, StopCircle, Play, PenLine, RotateCcw, DollarSign, Zap, CreditCard, MessageSquare, AlertTriangle, Circle } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { getStatusColor } from '@/lib/constants'

// CSS clamp value for consistent responsive width (20vw, min 180px, max 280px)
// Used for PatientCards and Patient Context panel
const PANEL_WIDTH_CLASS = 'w-[clamp(180px,20vw,280px)]'

// Narrower width for Visit History panel (compact two-row cards)
const VISIT_HISTORY_WIDTH_CLASS = 'w-[clamp(160px,16vw,220px)]'

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
// Relative Date Helper (for Visit Timeline cards)
// =============================================================================

function getRelativeDate(date: Date): string {
  const now = new Date()
  const visitDate = new Date(date)

  // Reset times to compare dates only
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate())

  const diffMs = nowDate.getTime() - targetDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Handle future dates
  if (diffDays < 0) {
    const futureDays = Math.abs(diffDays)
    if (futureDays === 1) return 'Tomorrow'
    if (futureDays < 7) return `in ${futureDays}d`
    const weeks = Math.floor(futureDays / 7)
    if (futureDays < 30) return `in ${weeks}w`
    const months = Math.floor(futureDays / 30)
    if (futureDays < 365) return `in ${months}m`
    const years = Math.floor(futureDays / 365)
    return `in ${years}y`
  }

  // Past dates - abbreviated format
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  const weeks = Math.floor(diffDays / 7)
  if (diffDays < 30) return `${weeks}w ago`
  const months = Math.floor(diffDays / 30)
  if (diffDays < 365) return `${months}m ago`
  const years = Math.floor(diffDays / 365)
  return `${years}y ago`
}

// =============================================================================
// Visit Timeline Colors (matches PatientCards status colors)
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
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground pl-3">
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
  startTime: Date  // Appointment start time for display
  endTime: Date    // Appointment end time for display
  appointmentTypeId?: string
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
  startTime,
  endTime,
  appointmentTypeId,
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

  // Format date as "Dec 15"
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const relativeDate = getRelativeDate(date)
  const timeRange = `${formatTime(startTime)} - ${formatTime(endTime)}`

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
  // New layout: Icon on left spanning both rows, content on right
  const cardContent = (
    <>
      {/* Hover background - CSS-only (not for locked cards) */}
      {!isSelected && !isEditing && !isLocked && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ backgroundColor: hoverBgColor }}
        />
      )}

      {/* Selection indicator - CSS transition (no layoutId to avoid resize animation) */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0'
        }`}
        style={isSelected ? getSelectionStyle() : {}}
      />

      {/* Card content - two rows with icon on top right */}
      <div className={`relative z-10 flex flex-col justify-center gap-0.5 px-3 ${TIMELINE_CARD_HEIGHT}`}>
        {/* Row 1: Date · Relative date + icon/status indicators on right */}
        <div className="flex items-center gap-1">
          <span className={`text-sm font-medium truncate ${
            isEditing ? 'text-blue-600' :
            isLocked ? 'text-muted-foreground/50' :
            'text-foreground'
          }`}>
            {formattedDate}
          </span>
          <span className={`text-xs flex-shrink-0 ${isLocked ? 'text-muted-foreground/30' : 'text-muted-foreground'}`}>
            · {relativeDate}
          </span>
          {/* Right side: icon + status indicators */}
          <div className="ml-auto flex items-center gap-1">
            {/* Appointment type icon */}
            <IconComponent className={`h-3.5 w-3.5 flex-shrink-0 ${
              isEditing ? 'text-blue-600' :
              isLocked ? 'text-muted-foreground/30' :
              'text-muted-foreground/60'
            }`} />
            {/* Status indicators */}
            {isLocked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Complete earlier appointments first</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {/* Row 2: Time range */}
        <p className={`text-xs truncate ${isLocked ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
          {timeRange}
        </p>
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

  // All other cards are buttons (no motion wrapper - selection handled by inner layoutId)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className="group relative w-full text-left"
      style={{ boxShadow: isSelected ? undefined : `inset 3px 0 0 0 ${color}40` }}
    >
      {cardContent}
    </button>
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

  // Today's COMPLETED appointments (not from past visit history)
  // Split into unsigned and signed for proper section grouping
  const completedTodayAppts = scheduledAppointments.filter(a =>
    a.status === 'COMPLETED' && !a.isFuture
  ).sort((a, b) => {
    // Sort by completedAt descending (most recent first), fallback to scheduledStart
    const aTime = a.completedAt?.getTime() ?? new Date(a.scheduledStart).getTime()
    const bTime = b.completedAt?.getTime() ?? new Date(b.scheduledStart).getTime()
    return bTime - aTime
  })

  const unsignedTodayAppts = completedTodayAppts.filter(a => !a.isSigned)
  const signedTodayAppts = completedTodayAppts.filter(a => a.isSigned)

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
          <div className="relative flex items-center px-3">
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
                className="absolute right-0 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-end pr-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: showFutureAppointments ? 180 : 0 }}
                  transition={SPRING_TRANSITION}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
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
                  startTime={new Date(appointment.scheduledStart)}
                  endTime={new Date(appointment.scheduledEnd)}
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
              startTime={new Date(appointment.scheduledStart)}
              endTime={new Date(appointment.scheduledEnd)}
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
              startTime={new Date(appointment.scheduledStart)}
              endTime={new Date(appointment.scheduledEnd)}
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

      {/* 4. Unsigned Section - Completed but needs signature (today + past) */}
      {(unsignedTodayAppts.length > 0 || unsignedVisits.length > 0) && (
        <TimelineSection
          title="Unsigned"
          color={TIMELINE_COLORS.unsigned}
          count={unsignedTodayAppts.length + unsignedVisits.length}
        >
          {/* Today's unsigned completed appointments */}
          {unsignedTodayAppts.map((appointment) => {
            const isEditing = appointment.id === currentAppointmentId
            return (
              <TimelineCard
                key={appointment.id}
                id={appointment.id}
                date={new Date(appointment.scheduledStart)}
                startTime={new Date(appointment.scheduledStart)}
                endTime={new Date(appointment.scheduledEnd)}
                appointmentTypeId={appointment.appointmentType?.id}
                isEditing={isEditing}
                isUnsigned={true}
                onClick={!isEditing
                  ? () => handleScheduledAppointmentClick(appointment.id)
                  : undefined}
                color={isEditing ? TIMELINE_COLORS.editing : TIMELINE_COLORS.unsigned}
              />
            )
          })}
          {/* Past unsigned visits */}
          {unsignedVisits.map((visit, index) => (
            <TimelineCard
              key={visit.id}
              id={visit.id}
              date={visit.appointment?.scheduledStart
                ? new Date(visit.appointment.scheduledStart)
                : new Date(visit.createdAt)}
              startTime={visit.appointment?.scheduledStart
                ? new Date(visit.appointment.scheduledStart)
                : new Date(visit.createdAt)}
              endTime={visit.appointment?.scheduledEnd
                ? new Date(visit.appointment.scheduledEnd)
                : new Date(visit.createdAt)}
              appointmentTypeId={visit.appointment?.appointmentType?.id}
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

      {/* 5. Completed Section - Signed and done (today + past) */}
      {(signedTodayAppts.length > 0 || completedVisits.length > 0) && (
        <TimelineSection
          title="Completed"
          color={TIMELINE_COLORS.completed}
          count={signedTodayAppts.length + completedVisits.length}
        >
          {/* Today's signed completed appointments */}
          {signedTodayAppts.map((appointment) => {
            const isEditing = appointment.id === currentAppointmentId
            return (
              <TimelineCard
                key={appointment.id}
                id={appointment.id}
                date={new Date(appointment.scheduledStart)}
                startTime={new Date(appointment.scheduledStart)}
                endTime={new Date(appointment.scheduledEnd)}
                appointmentTypeId={appointment.appointmentType?.id}
                isEditing={isEditing}
                onClick={!isEditing
                  ? () => handleScheduledAppointmentClick(appointment.id)
                  : undefined}
                color={isEditing ? TIMELINE_COLORS.editing : TIMELINE_COLORS.completed}
              />
            )
          })}
          {/* Past signed visits */}
          {completedVisits.map((visit, index) => (
            <TimelineCard
              key={visit.id}
              id={visit.id}
              date={visit.appointment?.scheduledStart
                ? new Date(visit.appointment.scheduledStart)
                : new Date(visit.createdAt)}
              startTime={visit.appointment?.scheduledStart
                ? new Date(visit.appointment.scheduledStart)
                : new Date(visit.createdAt)}
              endTime={visit.appointment?.scheduledEnd
                ? new Date(visit.appointment.scheduledEnd)
                : new Date(visit.createdAt)}
              appointmentTypeId={visit.appointment?.appointmentType?.id}
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

// Default needle retention time in minutes (would come from clinic settings)
const DEFAULT_NEEDLE_RETENTION_MINUTES = 25

interface AppointmentHeaderProps {
  appointment: AppointmentWithRelations
  visitCount: number
  firstVisitDate: Date | null
  activeTab: 'medical' | 'billing' | 'schedule' | 'comms'
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

  if (diffDays > 0 && diffDays <= 7) return `in ${diffDays}d`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}d ago`

  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

function AppointmentHeader({ appointment, visitCount, firstVisitDate, activeTab }: AppointmentHeaderProps) {
  const statusDisplay = getStatusDisplay(appointment.status, appointment.isSigned)
  const statusColor = getStatusColor(appointment.status, appointment.isSigned)

  const appointmentDate = new Date(appointment.scheduledStart)
  const dateStr = appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const relativeDay = getRelativeDay(appointmentDate)
  const timeRange = `${formatTime(appointment.scheduledStart)} - ${formatTime(appointment.scheduledEnd)}`

  // Patient info
  const patient = appointment.patient
  const patientName = patient ? getPatientDisplayName(patient) : 'Unknown Patient'
  const initials = patient
    ? `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase()
    : '??'

  // First visit date formatted
  const firstVisitStr = firstVisitDate
    ? `Since ${firstVisitDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    : 'New patient'

  return (
    <div className="flex h-14 items-stretch border-b border-border">
      {/* Left section: Avatar + Patient name + demographics (matches Visit History panel width + border-r) */}
      <div className={`flex items-center gap-2 px-3 border-r border-border flex-shrink-0 ${VISIT_HISTORY_WIDTH_CLASS}`}>
        {/* Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {initials}
        </div>
        {/* Patient name + demographics */}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate">{patientName}</span>
          <span className="text-xs text-muted-foreground">
            {patient?.dateOfBirth ? `${calculateAge(patient.dateOfBirth)} yo` : ''}
            {patient?.sex && patient?.dateOfBirth ? ', ' : ''}
            {patient?.sex === 'FEMALE' ? 'Female' : patient?.sex === 'MALE' ? 'Male' : ''}
          </span>
        </div>
      </div>

      {/* Center section: Date + Time + Status + Action (matches SOAP Editor - flex-1, no borders) */}
      <div className="flex flex-1 items-center justify-between px-3">
        {/* Date · Relative on row 1, Time Range on row 2 */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold">{dateStr}</span>
            <span className="text-muted-foreground">· {relativeDay}</span>
          </div>
          <span className="text-xs text-muted-foreground">{timeRange}</span>
        </div>

        {/* Status badge only - actions moved to FAB */}
        <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-xs font-medium text-foreground">
            {statusDisplay.label}
          </span>
        </div>
      </div>

      {/* Right section: Visit count + First visit date (only on Medical tab, matches Patient Context panel width) */}
      {activeTab === 'medical' && (
        <div className={`flex flex-col justify-center px-3 border-l border-border flex-shrink-0 ${PANEL_WIDTH_CLASS}`}>
          <span className="text-sm font-semibold">Visits ({visitCount})</span>
          <span className="text-xs text-muted-foreground">{firstVisitStr}</span>
        </div>
      )}
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
      {/* Save status - floats right, only render when there's status to show */}
      {saveStatus !== 'idle' && (
        <div className="flex justify-end">
          {renderSaveStatus()}
        </div>
      )}

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

            {/* Compact preview from selected past visit - crossfade only (no layout animation) */}
            <div className="relative">
              <AnimatePresence mode="popLayout">
                {previewContent && (
                  <motion.div
                    key={`${selectedVisitId}-${section.key}`}
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
                    <p className="rounded bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground italic">
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

  // Read collapse state from URL on mount and sync to context
  useEffect(() => {
    const collapsedFromUrl = searchParams.get('cards')
    if (collapsedFromUrl === 'expanded') {
      setPatientCardsCollapsed(false)
    } else if (collapsedFromUrl === 'collapsed') {
      setPatientCardsCollapsed(true)
    }
    // Only run on mount (when appointmentId changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  // Update URL when collapse state changes
  const handleToggleCollapse = useCallback(() => {
    const newCollapsed = !isPatientCardsCollapsed
    setPatientCardsCollapsed(newCollapsed)

    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    params.set('cards', newCollapsed ? 'collapsed' : 'expanded')
    const newUrl = `/appointments/${appointmentId}${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newUrl, { scroll: false })
  }, [isPatientCardsCollapsed, setPatientCardsCollapsed, searchParams, router, appointmentId])

  // Wrapper to set both state and URL
  const setSelectedVisitId = useCallback((visitId: string | null) => {
    setSelectedVisitIdState(visitId)
    updateUrlPreview(visitId)
  }, [updateUrlPreview])
  // Track preview slide direction for animation
  const [previewSlideDirection, setPreviewSlideDirection] = useState<'up' | 'down' | null>(null)

  // FAB state
  const [isFabExpanded, setIsFabExpanded] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

  // Tab state for Medical / Billing / Schedule / Comms
  type TabType = 'medical' | 'billing' | 'schedule' | 'comms'
  const [activeTab, setActiveTab] = useState<TabType>('medical')

  // Close FAB when clicking outside
  useEffect(() => {
    if (!isFabExpanded) return

    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isFabExpanded])

  // Timer state (for needle retention)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const [timerDuration, setTimerDuration] = useState(DEFAULT_NEEDLE_RETENTION_MINUTES * 60) // Total duration for progress calc
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [selectedPresetMinutes, setSelectedPresetMinutes] = useState(DEFAULT_NEEDLE_RETENTION_MINUTES) // Selected preset (default 25)

  // Timer countdown effect
  useEffect(() => {
    if (!isTimerRunning || timerSeconds === null) return

    // Allow timer to go negative (over time)
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, timerSeconds])

  // Format seconds as MM:SS
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60)
    const secs = Math.abs(seconds) % 60
    const sign = seconds < 0 ? '-' : ''
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Timer handlers
  const handleStartTimer = (minutes?: number) => {
    const durationSeconds = (minutes ?? DEFAULT_NEEDLE_RETENTION_MINUTES) * 60
    setTimerDuration(durationSeconds)
    setTimerSeconds(durationSeconds)
    setIsTimerRunning(true)
  }

  const handleStopTimer = () => {
    setIsTimerRunning(false)
  }

  const handleResumeTimer = () => {
    setIsTimerRunning(true)
  }

  const handleResetTimer = () => {
    setIsTimerRunning(false)
    setTimerSeconds(null)
  }

  const handleAddTime = (minutes: number) => {
    if (timerSeconds !== null) {
      const newSeconds = timerSeconds + minutes * 60
      setTimerSeconds(newSeconds)
      setTimerDuration(prev => prev + minutes * 60)
    }
  }

  const handleSelectPreset = (minutes: number) => {
    setSelectedPresetMinutes(minutes)
    // If timer is already running, also update the current timer
    if (timerSeconds !== null) {
      const durationSeconds = minutes * 60
      setTimerDuration(durationSeconds)
      setTimerSeconds(durationSeconds)
    }
  }

  // Calculate timer progress (0 to 1, can exceed 1 when over)
  const timerProgress = timerSeconds !== null && timerDuration > 0
    ? Math.max(0, timerSeconds) / timerDuration
    : 0

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

  // Track if component has initialized (for skipping animation on mount)
  const [hasInitialized, setHasInitialized] = useState(false)
  useEffect(() => {
    // Small delay to ensure URL-based state is applied before enabling animations
    const timer = setTimeout(() => setHasInitialized(true), 50)
    return () => clearTimeout(timer)
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

  // Calculate visit count and first visit date for header
  const { visitCount, firstVisitDate } = useMemo(() => {
    if (!appointment?.patient?.id) return { visitCount: 0, firstVisitDate: null }

    const visitHistory = getPatientVisitHistory(appointment.patient.id)
    const scheduledAppts = getPatientScheduledAppointments(appointment.patient.id, appointmentId)
    const todayCompletedCount = scheduledAppts.filter(a => a.status === 'COMPLETED' && !a.isFuture).length

    // Total count = past visits + today's completed
    const count = visitHistory.length + todayCompletedCount

    // Find the oldest visit date
    let oldest: Date | null = null
    if (visitHistory.length > 0) {
      // visitHistory is sorted most recent first, so last one is oldest
      const oldestVisit = visitHistory[visitHistory.length - 1]
      oldest = oldestVisit.appointment?.scheduledStart
        ? new Date(oldestVisit.appointment.scheduledStart)
        : new Date(oldestVisit.createdAt)
    }

    return { visitCount: count, firstVisitDate: oldest }
  }, [appointment?.patient?.id, appointmentId])

  // Get today's appointment ID for the patient (for PatientCards selection)
  // When viewing a future appointment, we still want to highlight the patient's today card
  const selectedAppointmentIdForCards = useMemo(() => {
    if (!appointment?.patient?.id) return undefined
    return getPatientTodayAppointmentId(appointment.patient.id) ?? undefined
  }, [appointment?.patient?.id])

  // Billing data from centralized mock data layer
  // Different patients have different billing scenarios
  const billingData: BillingData = useMemo(() => {
    const patientId = appointment?.patient?.id || ''
    const isCompleted = appointment?.status === 'COMPLETED'
    const usedEstim = appointment?.usedEstim ?? false

    return getBillingDataForAppointment(appointmentId, patientId, isCompleted, usedEstim)
  }, [appointmentId, appointment?.patient?.id, appointment?.status, appointment?.usedEstim])

  // Mock comms data for the appointment (simplified - no schedule data)
  const commsData: CommsData = useMemo(() => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Vary confirmation status based on appointment status
    const isInProgress = appointment?.status === 'IN_PROGRESS'
    const isCheckedIn = appointment?.status === 'CHECKED_IN'
    const confirmedAt = (isInProgress || isCheckedIn) ? new Date(yesterday.getTime() + 2 * 60 * 60 * 1000) : undefined

    const appointmentStart = appointment?.scheduledStart ? new Date(appointment.scheduledStart) : now

    return {
      messages: [
        {
          id: 'msg_001',
          type: 'reminder' as const,
          content: `Reminder: Your appointment is tomorrow at ${appointmentStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`,
          timestamp: yesterday,
          status: 'delivered' as const,
        },
        ...(isInProgress || isCheckedIn ? [{
          id: 'msg_002',
          type: 'patient_response' as const,
          content: 'Confirmed! See you then.',
          timestamp: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000),
          status: 'read' as const,
          isFromPatient: true,
        }] : []),
      ],
      notes: [
        {
          id: 'note_001',
          content: 'Patient prefers afternoon appointments when possible.',
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          createdBy: 'Dr. Smith',
          isPinned: true,
        },
        {
          id: 'note_002',
          content: 'Mentioned work deadline stress affecting sleep.',
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          createdBy: 'Dr. Smith',
        },
      ],
      confirmationStatus: (isInProgress || isCheckedIn) ? 'confirmed' as const : 'pending' as const,
      reminderSentAt: yesterday,
      confirmedAt,
      unreadCount: 0,
    }
  }, [appointment?.status, appointment?.scheduledStart])

  // Mock schedule data for the appointment
  const scheduleData: ScheduleData = useMemo(() => {
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Vary confirmation status based on appointment status
    const isInProgress = appointment?.status === 'IN_PROGRESS'
    const isCheckedIn = appointment?.status === 'CHECKED_IN'
    const confirmedAt = (isInProgress || isCheckedIn) ? new Date(yesterday.getTime() + 2 * 60 * 60 * 1000) : undefined

    const appointmentStart = appointment?.scheduledStart ? new Date(appointment.scheduledStart) : now
    const appointmentEnd = appointment?.scheduledEnd ? new Date(appointment.scheduledEnd) : new Date(now.getTime() + 60 * 60 * 1000)
    const duration = Math.round((appointmentEnd.getTime() - appointmentStart.getTime()) / (1000 * 60))

    return {
      currentAppointment: {
        date: appointmentStart,
        startTime: appointmentStart,
        endTime: appointmentEnd,
        type: appointment?.appointmentType?.name ?? 'Follow-up Treatment',
        duration,
        confirmedAt,
      },
      followUp: {
        recommendedInterval: '1 week',
        nextAvailable: new Date(oneWeekFromNow.setHours(10, 30, 0, 0)),
      },
      recentVisits: [
        {
          date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          type: 'Follow-up',
          status: 'Completed',
        },
        {
          date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          type: 'Follow-up',
          status: 'Completed',
        },
        {
          date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          type: 'Initial Consultation',
          status: 'Completed',
        },
      ],
      upcomingAppointments: [],
    }
  }, [appointment?.status, appointment?.scheduledStart, appointment?.scheduledEnd, appointment?.appointmentType?.name])

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
        startTransition(rect, 'appointment', appointment?.patient?.id, isPatientCardsCollapsed)
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
      {/* Patient Cards - CSS handles expanded width, animation only after initial mount */}
      <div
        className={`flex flex-col relative flex-shrink-0 transition-[width] ease-out ${
          isPatientCardsCollapsed ? '' : PANEL_WIDTH_CLASS
        }`}
        style={{
          width: isPatientCardsCollapsed ? SIDEBAR_ANIMATION.collapsedWidth : undefined,
          transitionDuration: hasInitialized ? '300ms' : '0ms',
        }}
      >
        <div className="h-full">
          <PatientCards
            onAppointmentClick={handleAppointmentClick}
            onAppointmentHover={setHoveredAppointmentId}
            hoveredAppointmentId={effectiveHoveredAppointmentId}
            selectedAppointmentId={selectedAppointmentIdForCards}
            compact={isPatientCardsCollapsed}
            onToggleCompact={handleToggleCollapse}
            activeTimerAppointmentId={appointmentId}
            activeTimerSeconds={timerSeconds}
            isTimerRunning={isTimerRunning}
          />
        </div>
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-border" />

      {/* Main content area with unified header */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Unified Header Bar - spans all three columns */}
        <AppointmentHeader
          appointment={appointment}
          visitCount={visitCount}
          firstVisitDate={firstVisitDate}
          activeTab={activeTab}
        />

        {/* Content columns below header */}
        <div className="flex flex-1 overflow-hidden">
          {/* Visit History Panel */}
          <AnimatePresence mode="wait" initial={true}>
            <motion.div
              key={middlePanelKey}
              className={`flex flex-col border-r border-border bg-card flex-shrink-0 ${VISIT_HISTORY_WIDTH_CLASS}`}
              initial={{
                x: shouldAnimateMiddlePanel && transitionSource === 'today' ? 100 : 0,
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
              {/* Visit Timeline - Scrollable */}
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
                      startTransition({ x: 0, y: 0, width: 0, height: 0 } as DOMRect, 'scheduled', appointment.patient?.id, isPatientCardsCollapsed)
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

          {/* Tab Content Area - Contains SOAP+Context OR Billing OR Comms + Tab Bar */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Tab Content */}
            <div className="flex flex-1 overflow-hidden relative">
              {activeTab === 'medical' && (
                <>
                  {/* SOAP Notes Panel - Flexible width */}
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
                        {/* Scrollable Content */}
                        <ScrollableArea className="flex-1 pt-2 pb-4 px-3" deps={[appointmentId]}>
                          <div className="flex flex-col gap-4">
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

                  {/* Patient Context Panel */}
                  <AnimatePresence mode="wait" initial={true}>
                    <motion.div
                      key={`context-${middlePanelKey}`}
                      className={`flex-shrink-0 border-l border-border ${PANEL_WIDTH_CLASS}`}
                      initial={{
                        x: shouldAnimateMiddlePanel && transitionSource === 'today' ? 100 : 0,
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
                      {appointment.patient && (
                        <PatientContext
                          patient={appointment.patient}
                          conditions={appointment.conditions}
                          contextData={getPatientContextData(appointment.patient.id)}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* FAB - Only on Medical Tab, positioned above tab bar */}
                  <div ref={fabRef} className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
                    <AnimatePresence>
                      {isFabExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="w-[220px] rounded-lg bg-background border border-border shadow-lg p-3"
                        >
                          <div className="flex flex-col gap-3">
                            {/* Timer Section - Large timer value as header */}
                            <div className="flex flex-col gap-2">
                              {/* Large timer display - show selected preset when not started */}
                              <div className={`text-3xl font-semibold tabular-nums text-center ${
                                timerSeconds !== null && timerSeconds <= 0
                                  ? 'text-red-600'
                                  : timerSeconds !== null
                                    ? 'text-blue-600'
                                    : 'text-foreground'
                              }`}>
                                {timerSeconds !== null ? formatTimer(timerSeconds) : formatTimer(selectedPresetMinutes * 60)}
                              </div>

                              {/* Progress bar (thin) - show full bar when not started */}
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-1000 rounded-full ${
                                    timerSeconds !== null && timerSeconds <= 0
                                      ? 'bg-red-500'
                                      : timerSeconds !== null
                                        ? 'bg-blue-500'
                                        : 'bg-muted-foreground/30'
                                  }`}
                                  style={{ width: timerSeconds !== null ? `${timerProgress * 100}%` : '100%' }}
                                />
                              </div>

                              {/* All presets in single row: [10][25][40][+5] */}
                              <div className="grid grid-cols-4 gap-1">
                                {[10, 25, 40].map((mins) => (
                                  <button
                                    key={mins}
                                    onClick={() => handleSelectPreset(mins)}
                                    className={`h-8 text-xs font-medium rounded transition-colors ${
                                      selectedPresetMinutes === mins && timerSeconds === null
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80'
                                    }`}
                                  >
                                    {mins}
                                  </button>
                                ))}
                                <button
                                  onClick={() => handleAddTime(5)}
                                  disabled={timerSeconds === null}
                                  className="h-8 text-xs font-medium rounded bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  +5
                                </button>
                              </div>

                              {/* Start/Pause button - full width */}
                              {isTimerRunning ? (
                                <button
                                  onClick={handleStopTimer}
                                  className="h-11 text-sm font-medium rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                                >
                                  <StopCircle className="h-4 w-4" />
                                  Pause
                                </button>
                              ) : (
                                <button
                                  onClick={() => timerSeconds !== null ? handleResumeTimer() : handleStartTimer(selectedPresetMinutes)}
                                  className="h-11 text-sm font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Play className="h-4 w-4" />
                                  {timerSeconds !== null ? 'Resume' : `Start ${selectedPresetMinutes} min`}
                                </button>
                              )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-border -mx-3" />

                            {/* Status Section - 3-step progress indicator */}
                            <div className="flex flex-col gap-3">
                              {/* Progress dots - 3 steps: Scheduled → In Progress → Complete */}
                              {(() => {
                                // Determine completed steps (1-3)
                                // SCHEDULED/CHECKED_IN = step 1, IN_PROGRESS = step 2, COMPLETED = step 3
                                const getCompletedSteps = () => {
                                  if (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') return 1
                                  if (appointment.status === 'IN_PROGRESS') return 2
                                  if (appointment.status === 'COMPLETED') return 3
                                  return 1
                                }
                                const completedSteps = getCompletedSteps()

                                return (
                                  <div className="flex items-center justify-center gap-0">
                                    {/* Step 1: Scheduled */}
                                    <div className={`h-3 w-3 rounded-full ${
                                      completedSteps >= 1 ? 'bg-primary' : 'border-2 border-muted-foreground'
                                    }`} />
                                    {/* Line 1 */}
                                    <div className={`h-0.5 w-12 ${
                                      completedSteps >= 2 ? 'bg-primary' : 'bg-muted'
                                    }`} />
                                    {/* Step 2: In Progress */}
                                    <div className={`h-3 w-3 rounded-full ${
                                      completedSteps >= 2 ? 'bg-primary' : 'border-2 border-muted-foreground'
                                    }`} />
                                    {/* Line 2 */}
                                    <div className={`h-0.5 w-12 ${
                                      completedSteps >= 3 ? 'bg-primary' : 'bg-muted'
                                    }`} />
                                    {/* Step 3: Complete */}
                                    <div className={`h-3 w-3 rounded-full ${
                                      completedSteps >= 3 ? 'bg-primary' : 'border-2 border-muted-foreground'
                                    }`} />
                                  </div>
                                )
                              })()}

                              {/* Current status with colored dot */}
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getStatusColor(appointment.status, appointment.isSigned) }}
                                  />
                                  <span className="text-sm font-semibold">
                                    {getStatusDisplay(appointment.status, appointment.isSigned).label}
                                  </span>
                                </div>
                                {/* Timestamp */}
                                <div className="text-xs text-muted-foreground pl-[18px]">
                                  {appointment.status === 'SCHEDULED' && 'Waiting to start'}
                                  {appointment.status === 'CHECKED_IN' && appointment.checkedInAt && (
                                    <>Checked in {formatTime(appointment.checkedInAt)}</>
                                  )}
                                  {appointment.status === 'IN_PROGRESS' && appointment.startedAt && (
                                    <>Started {formatTime(appointment.startedAt)}</>
                                  )}
                                  {appointment.status === 'COMPLETED' && !appointment.isSigned && 'Ready to sign'}
                                  {appointment.status === 'COMPLETED' && appointment.isSigned && 'Visit complete'}
                                </div>
                              </div>

                              {/* Status action button - full width */}
                              {(appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') && (
                                <button
                                  onClick={() => setIsFabExpanded(false)}
                                  className="h-11 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Play className="h-4 w-4" />
                                  Start Visit
                                </button>
                              )}
                              {appointment.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => setIsFabExpanded(false)}
                                  className="h-11 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                  <StopCircle className="h-4 w-4" />
                                  End Visit
                                </button>
                              )}
                              {appointment.status === 'COMPLETED' && !appointment.isSigned && (
                                <button
                                  onClick={() => setIsFabExpanded(false)}
                                  className="h-11 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                  <PenLine className="h-4 w-4" />
                                  Sign Note
                                </button>
                              )}
                              {appointment.status === 'COMPLETED' && appointment.isSigned && (
                                <div className="h-11 text-sm font-medium rounded-md bg-green-100 text-green-700 flex items-center justify-center gap-2">
                                  <Check className="h-4 w-4" />
                                  Signed
                                </div>
                              )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-border -mx-3" />

                            {/* Total Section - Inline amount + description */}
                            <div className="flex flex-col gap-2">
                              {/* Total + description inline */}
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold tabular-nums">
                                  ${appointment.usedEstim ? 100 : 85}
                                </span>
                                <span className="text-muted-foreground truncate">
                                  {appointment.appointmentType?.name ?? 'Visit'}
                                </span>
                              </div>

                              {/* Checkout button - full width */}
                              <button
                                onClick={() => setIsFabExpanded(false)}
                                className="h-11 text-sm font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                              >
                                <LogOut className="h-4 w-4" />
                                Check Out
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* FAB toggle button */}
                    <button
                      onClick={() => setIsFabExpanded(!isFabExpanded)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all ${
                        isFabExpanded
                          ? 'bg-muted text-foreground hover:bg-muted/80'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {isFabExpanded ? (
                        <X className="h-5 w-5" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'billing' && (
                <div className="flex-1 overflow-hidden bg-background">
                  <BillingTab
                    appointmentId={appointmentId}
                    billingData={billingData}
                  />
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="flex-1 overflow-hidden bg-background">
                  <ScheduleTab
                    appointmentId={appointmentId}
                    scheduleData={scheduleData}
                    patientName={appointment.patient ? getPatientDisplayName(appointment.patient) : 'Patient'}
                  />
                </div>
              )}

              {activeTab === 'comms' && (
                <div className="flex-1 overflow-hidden bg-background">
                  <CommsTab
                    appointmentId={appointmentId}
                    commsData={commsData}
                    patientName={appointment.patient ? getPatientDisplayName(appointment.patient) : 'Patient'}
                  />
                </div>
              )}
            </div>

            {/* Tab Bar - Fixed at bottom, 4 tabs */}
            <div className="h-16 flex border-t border-border bg-background flex-shrink-0">
              {/* Medical Tab */}
              <button
                onClick={() => setActiveTab('medical')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  activeTab === 'medical'
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <ClipboardCheck className="h-5 w-5" />
                <span className="text-xs font-medium">Medical</span>
                <span className="text-[10px] flex items-center gap-1">
                  <Circle
                    className="h-2 w-2"
                    style={{
                      fill: getStatusColor(appointment.status, appointment.isSigned),
                      color: getStatusColor(appointment.status, appointment.isSigned),
                    }}
                  />
                  <span style={{ color: getStatusColor(appointment.status, appointment.isSigned) }}>
                    {getStatusDisplay(appointment.status, appointment.isSigned).label}
                  </span>
                </span>
              </button>

              {/* Billing Tab */}
              <button
                onClick={() => setActiveTab('billing')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 border-l border-border transition-colors ${
                  activeTab === 'billing'
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-xs font-medium">Billing</span>
                <span className={`text-[10px] ${getBillingStatusPreview(billingData).color}`}>
                  {getBillingStatusPreview(billingData).text}
                </span>
              </button>

              {/* Schedule Tab */}
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 border-l border-border transition-colors ${
                  activeTab === 'schedule'
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-xs font-medium">Schedule</span>
                {(() => {
                  const preview = getScheduleStatusPreview(scheduleData)
                  return (
                    <span className={`text-[10px] flex items-center gap-1 ${preview.color}`}>
                      {preview.icon === 'check' && <Check className="h-2.5 w-2.5" />}
                      {preview.icon === 'calendar' && <Calendar className="h-2.5 w-2.5" />}
                      {preview.text}
                    </span>
                  )
                })()}
              </button>

              {/* Comms Tab */}
              <button
                onClick={() => setActiveTab('comms')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 border-l border-border transition-colors ${
                  activeTab === 'comms'
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs font-medium">Comms</span>
                {(() => {
                  const preview = getCommsStatusPreview(commsData)
                  return (
                    <span className={`text-[10px] flex items-center gap-1 ${preview.color}`}>
                      {preview.icon === 'check' && <Check className="h-2.5 w-2.5" />}
                      {preview.icon === 'warning' && <AlertTriangle className="h-2.5 w-2.5" />}
                      {preview.text}
                    </span>
                  )
                })()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
