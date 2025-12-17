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
// Timeline Section Component
// =============================================================================

interface TimelineSectionProps {
  title: string
  color: string
  count: number
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

      {/* Cards container */}
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  )
}

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
          {/* Right side: icon + status indicators */}
          <div className="ml-auto flex items-center gap-1">
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

  // Group scheduled appointments by status
  const scheduledStatusAppts = scheduledAppointments.filter(a =>
    a.status === 'SCHEDULED'
  ).sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())

  const checkedInAppts = scheduledAppointments.filter(a =>
    a.status === 'CHECKED_IN'
  ).sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())

  const inProgressAppts = scheduledAppointments.filter(a =>
    a.status === 'IN_PROGRESS'
  ).sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())

  // Today's COMPLETED appointments
  const completedTodayAppts = scheduledAppointments.filter(a =>
    a.status === 'COMPLETED' && !a.isFuture
  ).sort((a, b) => {
    const aTime = a.completedAt?.getTime() ?? new Date(a.scheduledStart).getTime()
    const bTime = b.completedAt?.getTime() ?? new Date(b.scheduledStart).getTime()
    return bTime - aTime
  })

  const unsignedTodayAppts = completedTodayAppts.filter(a => !a.isSigned)
  const signedTodayAppts = completedTodayAppts.filter(a => a.isSigned)

  // Separate unsigned and signed visits
  const unsignedVisits = visitHistory.filter(v => !v.appointment?.isSigned)
  const completedVisits = visitHistory.filter(v => v.appointment?.isSigned)

  // Check for active today appointments
  const todayAppointments = scheduledAppointments.filter(a => !a.isFuture)
  const hasActiveTodayAppointment = todayAppointments.some(a =>
    a.status === 'SCHEDULED' ||
    a.status === 'CHECKED_IN' ||
    a.status === 'IN_PROGRESS'
  )

  // Determine next available future appointment
  const futureScheduledAppts = scheduledStatusAppts.filter(a => a.isFuture)
  const nextAvailableFutureId = hasActiveTodayAppointment
    ? null
    : (futureScheduledAppts.length > 0 ? futureScheduledAppts[0].id : null)

  // Check if editing a scheduled appointment
  const isEditingScheduled = scheduledStatusAppts.some(a => a.id === currentAppointmentId)

  // Auto-expand if editing a scheduled appointment
  useEffect(() => {
    if (isEditingScheduled && !showFutureAppointments) {
      setShowFutureAppointments(true)
    }
  }, [isEditingScheduled, showFutureAppointments, setShowFutureAppointments])

  const handleScheduledAppointmentClick = (appointmentId: string) => {
    if (onSelectScheduledAppointment) {
      onSelectScheduledAppointment(appointmentId)
    }
  }

  // Track index for keyboard navigation
  const getGlobalIndex = (section: 'unsigned' | 'completed', localIndex: number): number => {
    if (section === 'unsigned') return localIndex
    return unsignedVisits.length + localIndex
  }

  // Determine if appointment is locked
  const isAppointmentLocked = (appointment: ScheduledAppointmentWithType): boolean => {
    if (!appointment.isFuture) return false
    if (appointment.id === currentAppointmentId) return false
    return appointment.id !== nextAvailableFutureId
  }

  const scheduledCount = scheduledStatusAppts.length
  const unlockedScheduledAppts = scheduledStatusAppts.filter(a => !isAppointmentLocked(a))
  const lockedScheduledAppts = scheduledStatusAppts.filter(a => isAppointmentLocked(a))
  const lockedCount = lockedScheduledAppts.length

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Scheduled Section */}
      {scheduledCount > 0 && (
        <div className="flex flex-col gap-2">
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

      {/* 2. Checked In Section */}
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

      {/* 3. In Progress Section */}
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

      {/* 4. Unsigned Section */}
      {(unsignedTodayAppts.length > 0 || unsignedVisits.length > 0) && (
        <TimelineSection
          title="Unsigned"
          color={TIMELINE_COLORS.unsigned}
          count={unsignedTodayAppts.length + unsignedVisits.length}
        >
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

      {/* 5. Completed Section */}
      {(signedTodayAppts.length > 0 || completedVisits.length > 0) && (
        <TimelineSection
          title="Completed"
          color={TIMELINE_COLORS.completed}
          count={signedTodayAppts.length + completedVisits.length}
        >
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
          {completedVisits.map((visit, index) => {
            const isEditing = visit.appointment?.id === currentAppointmentId
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
                isSelected={selectedVisitId === visit.id}
                isHovered={hoveredVisitId === visit.id}
                isFocused={isZoneFocused && focusedIndex === getGlobalIndex('completed', index)}
                onClick={!isEditing ? () => onSelectVisit(selectedVisitId === visit.id ? null : visit.id, getGlobalIndex('completed', index)) : undefined}
                onHover={(isHovered) => onHoverVisit?.(isHovered ? visit.id : null)}
                color={isEditing ? TIMELINE_COLORS.editing : TIMELINE_COLORS.completed}
              />
            )
          })}
        </TimelineSection>
      )}

      {/* Empty state */}
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
