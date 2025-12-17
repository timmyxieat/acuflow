'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronDown, Lock } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatTime } from '@/lib/dev-time'
import { SPRING_TRANSITION } from '@/lib/animations'
import { useTransition } from '@/contexts/TransitionContext'
import {
  getPatientVisitHistory,
  getPatientScheduledAppointments,
  type VisitWithAppointment,
  type ScheduledAppointmentWithType,
} from '@/data/mock-data'
import {
  APPOINTMENT_TYPE_ICONS,
  TIMELINE_COLORS,
  TIMELINE_CARD_HEIGHT,
  getRelativeDate,
} from '../lib/helpers'

// =============================================================================
// Timeline Card Component
// =============================================================================

interface TimelineCardProps {
  id: string
  date: Date
  startTime: Date
  endTime: Date
  appointmentTypeId?: string
  isEditing?: boolean
  isUnsigned?: boolean
  isLocked?: boolean
  isSelected?: boolean
  isHovered?: boolean
  isFocused?: boolean
  onClick?: () => void
  onHover?: (isHovered: boolean) => void
  color: string
  statusDot?: { color: string; label: string }
}

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
  statusDot,
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
        backgroundColor: `${color}20`,
        boxShadow: `inset 3px 0 0 0 ${color}`,
      }
    }
    return {}
  }

  // Hover background
  const hoverBgColor = `${color}15`

  const cardContent = (
    <>
      {/* Hover background */}
      {!isSelected && !isEditing && !isLocked && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ backgroundColor: hoverBgColor }}
        />
      )}

      {/* Selection indicator */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0'
        }`}
        style={isSelected ? getSelectionStyle() : {}}
      />

      {/* Card content */}
      <div className={`relative z-10 flex flex-col justify-center gap-0.5 px-3 ${TIMELINE_CARD_HEIGHT}`}>
        {/* Row 1: Date · Relative date + icon/status indicators */}
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
          {/* Right side: status dot + icon + lock indicator */}
          <div className="ml-auto flex items-center gap-1.5">
            {statusDot && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusDot.color }}
                  />
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">{statusDot.label}</p>
                </TooltipContent>
              </Tooltip>
            )}
            <IconComponent className={`h-3.5 w-3.5 flex-shrink-0 ${
              isEditing ? 'text-blue-600' :
              isLocked ? 'text-muted-foreground/30' :
              'text-muted-foreground/60'
            }`} />
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

  // Editing card is not clickable
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

  // Locked cards are not clickable
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
// Visit Timeline Component
// =============================================================================

export interface VisitTimelineProps {
  patientId: string
  currentAppointmentId: string
  selectedVisitId: string | null
  onSelectVisit: (visitId: string | null, index: number) => void
  onSelectScheduledAppointment?: (appointmentId: string) => void
  hoveredVisitId?: string | null
  onHoverVisit?: (visitId: string | null) => void
  isZoneFocused?: boolean
  focusedIndex?: number
}

export function VisitTimeline({
  patientId,
  currentAppointmentId,
  selectedVisitId,
  onSelectVisit,
  onSelectScheduledAppointment,
  hoveredVisitId,
  onHoverVisit,
  isZoneFocused,
  focusedIndex,
}: VisitTimelineProps) {
  const { showFutureAppointments, setShowFutureAppointments } = useTransition()
  const visitHistory = getPatientVisitHistory(patientId)
  const scheduledAppointments = getPatientScheduledAppointments(patientId, currentAppointmentId)

  // ===========================================
  // UPCOMING: Today's appointments + Future scheduled
  // ===========================================

  // Today's appointments (any status)
  const todayAppointments = scheduledAppointments
    .filter(a => !a.isFuture)
    .sort((a, b) => {
      // Sort by status priority: in_progress > checked_in > scheduled > completed
      const statusOrder: Record<string, number> = {
        'IN_PROGRESS': 0,
        'CHECKED_IN': 1,
        'SCHEDULED': 2,
        'COMPLETED': 3,
      }
      const aOrder = statusOrder[a.status] ?? 4
      const bOrder = statusOrder[b.status] ?? 4
      if (aOrder !== bOrder) return aOrder - bOrder
      // Then by time
      return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
    })

  // Future scheduled appointments
  const futureAppointments = scheduledAppointments
    .filter(a => a.isFuture && a.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())

  // Combined upcoming
  const upcomingAppointments = [...todayAppointments, ...futureAppointments]

  // ===========================================
  // PAST: Visit history (before today)
  // ===========================================

  // Past visits are already sorted by date descending in getPatientVisitHistory
  const pastVisits = visitHistory

  // ===========================================
  // Locked appointment logic (for future appointments)
  // ===========================================

  const hasActiveTodayAppointment = todayAppointments.some(a =>
    a.status === 'SCHEDULED' ||
    a.status === 'CHECKED_IN' ||
    a.status === 'IN_PROGRESS'
  )

  const nextAvailableFutureId = hasActiveTodayAppointment
    ? null
    : (futureAppointments.length > 0 ? futureAppointments[0].id : null)

  const isAppointmentLocked = (appointment: ScheduledAppointmentWithType): boolean => {
    if (!appointment.isFuture) return false
    if (appointment.id === currentAppointmentId) return false
    return appointment.id !== nextAvailableFutureId
  }

  // Check if editing a future scheduled appointment
  const isEditingFuture = futureAppointments.some(a => a.id === currentAppointmentId)

  // Auto-expand if editing a future appointment
  useEffect(() => {
    if (isEditingFuture && !showFutureAppointments) {
      setShowFutureAppointments(true)
    }
  }, [isEditingFuture, showFutureAppointments, setShowFutureAppointments])

  // ===========================================
  // Handlers
  // ===========================================

  const handleScheduledAppointmentClick = (appointmentId: string) => {
    if (onSelectScheduledAppointment) {
      onSelectScheduledAppointment(appointmentId)
    }
  }

  // ===========================================
  // Rendering helpers
  // ===========================================

  const getStatusDot = (appointment: ScheduledAppointmentWithType): { color: string; label: string } | undefined => {
    if (appointment.status === 'IN_PROGRESS') {
      return { color: TIMELINE_COLORS.inProgress, label: 'In Progress' }
    }
    if (appointment.status === 'CHECKED_IN') {
      return { color: TIMELINE_COLORS.checkedIn, label: 'Checked In' }
    }
    if (appointment.status === 'COMPLETED' && !appointment.isSigned) {
      return { color: TIMELINE_COLORS.unsigned, label: 'Unsigned' }
    }
    return undefined
  }

  const getCardColor = (appointment: ScheduledAppointmentWithType): string => {
    if (appointment.id === currentAppointmentId) {
      return TIMELINE_COLORS.editing
    }
    if (appointment.status === 'IN_PROGRESS') {
      return TIMELINE_COLORS.inProgress
    }
    if (appointment.status === 'CHECKED_IN') {
      return TIMELINE_COLORS.checkedIn
    }
    if (appointment.status === 'COMPLETED' && !appointment.isSigned) {
      return TIMELINE_COLORS.unsigned
    }
    return TIMELINE_COLORS.scheduled
  }

  // Count locked future appointments for expand/collapse
  const lockedFutureCount = futureAppointments.filter(a => isAppointmentLocked(a)).length
  const visibleFutureAppointments = showFutureAppointments
    ? futureAppointments
    : futureAppointments.filter(a => !isAppointmentLocked(a))

  // Build the visible upcoming list
  const visibleUpcoming = [...todayAppointments, ...visibleFutureAppointments]

  return (
    <div className="flex flex-col gap-4">
      {/* UPCOMING Section */}
      {upcomingAppointments.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* Section header */}
          <div className="relative flex items-center px-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Upcoming
            </h3>
            {lockedFutureCount > 0 && (
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

          {/* Cards */}
          <div className="flex flex-col">
            {visibleUpcoming.map((appointment) => {
              const isEditing = appointment.id === currentAppointmentId
              const isLocked = isAppointmentLocked(appointment)

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
                  color={getCardColor(appointment)}
                  statusDot={!isEditing ? getStatusDot(appointment) : undefined}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* PAST Section */}
      {pastVisits.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* Section header */}
          <div className="flex items-center px-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Past
            </h3>
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({pastVisits.length})
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col">
            {pastVisits.map((visit, index) => {
              const isEditing = visit.appointment?.id === currentAppointmentId
              const isUnsigned = !visit.appointment?.isSigned

              return (
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
                  isEditing={isEditing}
                  isUnsigned={isUnsigned}
                  isSelected={selectedVisitId === visit.id}
                  isHovered={hoveredVisitId === visit.id}
                  isFocused={isZoneFocused && focusedIndex === index}
                  onClick={!isEditing
                    ? () => onSelectVisit(selectedVisitId === visit.id ? null : visit.id, index)
                    : undefined}
                  onHover={(isHovered) => onHoverVisit?.(isHovered ? visit.id : null)}
                  color={isEditing
                    ? TIMELINE_COLORS.editing
                    : isUnsigned
                      ? TIMELINE_COLORS.unsigned
                      : TIMELINE_COLORS.completed}
                  statusDot={isUnsigned && !isEditing
                    ? { color: TIMELINE_COLORS.unsigned, label: 'Unsigned' }
                    : undefined}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {upcomingAppointments.length === 0 && pastVisits.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center mx-3">
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
