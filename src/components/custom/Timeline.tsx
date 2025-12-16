'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { getDevDate, formatTime } from '@/lib/dev-time'
import { getStatusColor } from '@/lib/constants'
import { ClipboardCheck, RefreshCw, Sparkles, Calendar, Mars, Venus, ChevronUp, ChevronDown } from 'lucide-react'
import { ScrollableArea, ScrollableAreaRef, ScrollPosition } from './ScrollableArea'
import {
  getEnrichedAppointments,
  getPatientDisplayName,
  calculateAge,
  type AppointmentWithRelations,
  AppointmentStatus,
} from '@/data/mock-data'

// Map appointment type IDs to icons
const APPOINTMENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'appt_type_001': ClipboardCheck, // Initial Consultation
  'appt_type_002': RefreshCw, // Follow-up Treatment
  'appt_type_003': Sparkles, // Brief Follow-up
}

// Timeline configuration
const MIN_HOUR_HEIGHT = 150 // minimum pixels per hour
const DEFAULT_START_HOUR = 8 // 8 AM - business hours start
const DEFAULT_END_HOUR = 18 // 6 PM - business hours end
const TOP_PADDING = 13 // h-3 (12px) + border (1px)

interface TimelineProps {
  onAppointmentClick?: (appointment: AppointmentWithRelations, rect?: DOMRect) => void
  onAppointmentDoubleClick?: (appointment: AppointmentWithRelations) => void
  onAppointmentHover?: (appointmentId: string | null) => void
  selectedAppointmentId?: string
  hoveredAppointmentId?: string | null
}

// Check if two appointments overlap
function appointmentsOverlap(a: AppointmentWithRelations, b: AppointmentWithRelations): boolean {
  return a.scheduledStart < b.scheduledEnd && b.scheduledStart < a.scheduledEnd
}

// Assign columns to overlapping appointments
function assignColumns(appointments: AppointmentWithRelations[]): Map<string, { column: number; totalColumns: number }> {
  const result = new Map<string, { column: number; totalColumns: number }>()

  // Sort by start time
  const sorted = [...appointments].sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime())

  // Find overlapping groups
  const groups: AppointmentWithRelations[][] = []

  for (const appt of sorted) {
    // Find if this appointment overlaps with any existing group
    let addedToGroup = false
    for (const group of groups) {
      if (group.some(existing => appointmentsOverlap(existing, appt))) {
        group.push(appt)
        addedToGroup = true
        break
      }
    }
    if (!addedToGroup) {
      groups.push([appt])
    }
  }

  // Merge overlapping groups
  const mergedGroups: AppointmentWithRelations[][] = []
  for (const group of groups) {
    let merged = false
    for (const existingGroup of mergedGroups) {
      if (group.some(a => existingGroup.some(b => appointmentsOverlap(a, b)))) {
        existingGroup.push(...group)
        merged = true
        break
      }
    }
    if (!merged) {
      mergedGroups.push([...group])
    }
  }

  // Assign columns within each group
  for (const group of mergedGroups) {
    const columns: AppointmentWithRelations[][] = []

    // Sort group by start time
    group.sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime())

    for (const appt of group) {
      // Find first column where this appointment fits
      let placed = false
      for (let col = 0; col < columns.length; col++) {
        const columnAppts = columns[col]
        const canFit = !columnAppts.some(existing => appointmentsOverlap(existing, appt))
        if (canFit) {
          columns[col].push(appt)
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([appt])
      }
    }

    // Record column assignments
    const totalColumns = columns.length
    columns.forEach((columnAppts, colIndex) => {
      columnAppts.forEach(appt => {
        result.set(appt.id, { column: colIndex, totalColumns })
      })
    })
  }

  return result
}

export function Timeline({ onAppointmentClick, onAppointmentDoubleClick, onAppointmentHover, selectedAppointmentId, hoveredAppointmentId }: TimelineProps) {
  const scrollableRef = useRef<ScrollableAreaRef>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [hourHeight, setHourHeight] = useState(MIN_HOUR_HEIGHT)
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 })

  const appointments = useMemo(() => {
    return getEnrichedAppointments().filter(
      (a) => a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.NO_SHOW
    )
  }, [])

  // Calculate dynamic start/end hours based on appointments
  // Extends beyond business hours if appointments exist outside that range
  const { startHour, endHour, totalHours } = useMemo(() => {
    let minHour = DEFAULT_START_HOUR
    let maxHour = DEFAULT_END_HOUR

    for (const appt of appointments) {
      const apptStartHour = appt.scheduledStart.getHours()
      const apptEndHour = appt.scheduledEnd.getHours()
      const apptEndMinutes = appt.scheduledEnd.getMinutes()

      // Extend start if appointment begins earlier
      if (apptStartHour < minHour) {
        minHour = apptStartHour
      }

      // Extend end if appointment ends later
      // If there are minutes, we need the next full hour
      const effectiveEndHour = apptEndMinutes > 0 ? apptEndHour + 1 : apptEndHour
      if (effectiveEndHour > maxHour) {
        maxHour = effectiveEndHour
      }
    }

    return {
      startHour: minHour,
      endHour: maxHour,
      totalHours: maxHour - minHour,
    }
  }, [appointments])

  // Calculate dynamic hour height based on container size and total hours
  useEffect(() => {
    const updateHeight = () => {
      if (wrapperRef.current && totalHours > 0) {
        const availableHeight = wrapperRef.current.clientHeight
        const calculatedHeight = availableHeight / totalHours
        setHourHeight(Math.max(calculatedHeight, MIN_HOUR_HEIGHT))
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [totalHours])

  // Calculate column assignments for overlapping appointments
  const columnAssignments = useMemo(() => assignColumns(appointments), [appointments])

  // Generate hour labels based on dynamic range
  const hours = useMemo(() => {
    const result = []
    for (let h = startHour; h < endHour; h++) {
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
      const ampm = h >= 12 ? 'PM' : 'AM'
      result.push({ hour: h, label: `${hour12} ${ampm}` })
    }
    return result
  }, [startHour, endHour])

  // End hour label (dynamic based on appointments)
  const endHourLabel = useMemo(() => {
    const hour12 = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour
    const ampm = endHour >= 12 ? 'PM' : 'AM'
    return `${hour12} ${ampm}`
  }, [endHour])

  // Calculate position and height for an appointment
  const getAppointmentStyle = (appointment: AppointmentWithRelations) => {
    const apptStartHour = appointment.scheduledStart.getHours()
    const apptStartMinutes = appointment.scheduledStart.getMinutes()
    const apptEndHour = appointment.scheduledEnd.getHours()
    const apptEndMinutes = appointment.scheduledEnd.getMinutes()

    const startOffset = (apptStartHour - startHour) + (apptStartMinutes / 60)
    const endOffset = (apptEndHour - startHour) + (apptEndMinutes / 60)
    const duration = endOffset - startOffset

    // Get column info for overlapping appointments
    const columnInfo = columnAssignments.get(appointment.id) || { column: 0, totalColumns: 1 }
    const widthPercent = 100 / columnInfo.totalColumns
    const leftPercent = columnInfo.column * widthPercent

    // Calculate left offset and width with 12px edge padding and 8px gap between columns
    const isFirstColumn = columnInfo.column === 0
    const isLastColumn = columnInfo.column === columnInfo.totalColumns - 1
    const isSingleColumn = columnInfo.totalColumns === 1

    let leftOffset = 12 // 12px left edge padding
    let widthReduction = 24 // default: 12px left + 12px right

    if (!isSingleColumn) {
      if (isFirstColumn) {
        leftOffset = 12 // 12px from left edge
        widthReduction = 16 // 12px left edge + 4px (half of 8px gap)
      } else if (isLastColumn) {
        leftOffset = 4 // 4px (half of 8px gap)
        widthReduction = 16 // 4px gap + 12px right edge
      } else {
        leftOffset = 4 // 4px (half gap from left neighbor)
        widthReduction = 8 // 4px left + 4px right (half gaps)
      }
    }

    return {
      top: `${TOP_PADDING + startOffset * hourHeight}px`,
      height: `${duration * hourHeight - 8}px`, // -8 for vertical gap
      left: `calc(${leftPercent}% + ${leftOffset}px)`,
      width: `calc(${widthPercent}% - ${widthReduction}px)`,
    }
  }

  // Background color for appointment cards
  const appointmentBgColor = '#94a3b8' // slate-400 - light gray

  // Force re-render every second to update current time indicator
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Current time indicator (uses dev time in development)
  const now = getDevDate()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTimeOffset = (currentHour - startHour) + (currentMinutes / 60)
  const showCurrentTime = currentHour >= startHour && currentHour < endHour

  // Handle scroll position updates from ScrollableArea
  const handleScroll = (position: ScrollPosition) => {
    setScrollPosition(position)
  }

  // Find the hovered or selected appointment and check if it's off-screen
  const hoveredAppointment = useMemo(() => {
    if (!hoveredAppointmentId) return null
    return appointments.find(a => a.id === hoveredAppointmentId) || null
  }, [hoveredAppointmentId, appointments])

  const selectedAppointment = useMemo(() => {
    if (!selectedAppointmentId) return null
    return appointments.find(a => a.id === selectedAppointmentId) || null
  }, [selectedAppointmentId, appointments])

  // Use hovered appointment if available, otherwise fall back to selected
  const indicatorAppointment = hoveredAppointment || selectedAppointment

  const indicatorOffScreen = useMemo(() => {
    if (!indicatorAppointment) return null

    const apptStartHour = indicatorAppointment.scheduledStart.getHours()
    const apptStartMinutes = indicatorAppointment.scheduledStart.getMinutes()
    const apptStartOffset = (apptStartHour - startHour) + (apptStartMinutes / 60)
    const appointmentTop = TOP_PADDING + apptStartOffset * hourHeight

    const apptEndHour = indicatorAppointment.scheduledEnd.getHours()
    const apptEndMinutes = indicatorAppointment.scheduledEnd.getMinutes()
    const apptEndOffset = (apptEndHour - startHour) + (apptEndMinutes / 60)
    const appointmentBottom = TOP_PADDING + apptEndOffset * hourHeight

    const viewportTop = scrollPosition.scrollTop
    const viewportBottom = scrollPosition.scrollTop + scrollPosition.clientHeight

    // Check if appointment is above viewport
    if (appointmentBottom < viewportTop + 20) {
      return 'above'
    }
    // Check if appointment is below viewport
    if (appointmentTop > viewportBottom - 20) {
      return 'below'
    }
    return null
  }, [indicatorAppointment, hourHeight, scrollPosition, startHour])

  // Get status color for indicator appointment
  const indicatorStatusColor = indicatorAppointment
    ? getStatusColor(indicatorAppointment.status, indicatorAppointment.isSigned)
    : null

  // Check if the indicator is showing selected (not hovered) appointment
  const isIndicatorSelected = !hoveredAppointment && !!selectedAppointment

  // Scroll to indicator appointment
  const scrollToIndicator = () => {
    if (!indicatorAppointment || !scrollableRef.current) return

    const apptStartHour = indicatorAppointment.scheduledStart.getHours()
    const apptStartMinutes = indicatorAppointment.scheduledStart.getMinutes()
    const apptStartOffset = (apptStartHour - startHour) + (apptStartMinutes / 60)
    const appointmentTop = TOP_PADDING + apptStartOffset * hourHeight

    scrollableRef.current.scrollTo({
      top: appointmentTop - 40, // 40px padding from top
      behavior: 'smooth'
    })
  }

  return (
    <div ref={wrapperRef} className="flex h-full flex-col overflow-hidden bg-card relative">
      {/* Mini card indicator when item is above viewport */}
      {indicatorOffScreen === 'above' && indicatorAppointment && indicatorStatusColor && (() => {
        const columnInfo = columnAssignments.get(indicatorAppointment.id)
        const column = columnInfo?.column ?? 0
        const totalColumns = columnInfo?.totalColumns ?? 1
        // Calculate center position within appointments area (excluding hour labels column)
        const centerPercent = ((column + 0.5) / totalColumns) * 100
        const isCompleted = indicatorAppointment.status === AppointmentStatus.COMPLETED && indicatorAppointment.isSigned
        // Use selected opacity if selected, otherwise hovered opacity
        const bgColor = isIndicatorSelected
          ? (isCompleted ? `${indicatorStatusColor}50` : `${indicatorStatusColor}30`)
          : (isCompleted ? `${indicatorStatusColor}33` : `${indicatorStatusColor}18`)
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              scrollToIndicator()
            }}
            className="absolute top-1 z-20 flex items-center gap-1 px-2 py-1 rounded-r-sm text-xs font-medium transition-all hover:opacity-80 -translate-x-1/2 whitespace-nowrap"
            style={{
              left: `calc(52px + (100% - 52px) * ${centerPercent / 100})`,
              backgroundColor: bgColor,
              borderLeft: `3px solid ${indicatorStatusColor}`,
            }}
          >
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
            <span>{indicatorAppointment.patient ? getPatientDisplayName(indicatorAppointment.patient) : 'Unknown'}</span>
          </button>
        )
      })()}

      {/* Mini card indicator when item is below viewport */}
      {indicatorOffScreen === 'below' && indicatorAppointment && indicatorStatusColor && (() => {
        const columnInfo = columnAssignments.get(indicatorAppointment.id)
        const column = columnInfo?.column ?? 0
        const totalColumns = columnInfo?.totalColumns ?? 1
        // Calculate center position within appointments area (excluding hour labels column)
        const centerPercent = ((column + 0.5) / totalColumns) * 100
        const isCompleted = indicatorAppointment.status === AppointmentStatus.COMPLETED && indicatorAppointment.isSigned
        // Use selected opacity if selected, otherwise hovered opacity
        const bgColor = isIndicatorSelected
          ? (isCompleted ? `${indicatorStatusColor}50` : `${indicatorStatusColor}30`)
          : (isCompleted ? `${indicatorStatusColor}33` : `${indicatorStatusColor}18`)
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              scrollToIndicator()
            }}
            className="absolute bottom-1 z-20 flex items-center gap-1 px-2 py-1 rounded-r-sm text-xs font-medium transition-all hover:opacity-80 -translate-x-1/2 whitespace-nowrap"
            style={{
              left: `calc(52px + (100% - 52px) * ${centerPercent / 100})`,
              backgroundColor: bgColor,
              borderLeft: `3px solid ${indicatorStatusColor}`,
            }}
          >
            <span>{indicatorAppointment.patient ? getPatientDisplayName(indicatorAppointment.patient) : 'Unknown'}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        )
      })()}

      {/* Timeline body - using ScrollableArea for consistent scrollbar */}
      <ScrollableArea ref={scrollableRef} onScroll={handleScroll} deps={[hourHeight]}>
        <div className="relative flex min-h-full">
          {/* Hour labels column - fixed 48px width */}
          <div className="w-12 flex-shrink-0 border-r border-border">
            {/* Top padding */}
            <div className="h-[13px] border-b border-border/50" />
            {hours.map(({ hour, label }) => (
              <div
                key={hour}
                className="border-b border-border/50 flex items-start justify-center"
                style={{ height: `${hourHeight}px` }}
              >
                <span className="-translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap">
                  {label}
                </span>
              </div>
            ))}
            {/* End hour label */}
            <div className="h-[13px] flex items-start justify-center">
              <span className="-translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap">
                {endHourLabel}
              </span>
            </div>
          </div>

          {/* Appointments column */}
          <div className="relative flex-1">
            {/* Top padding to match */}
            <div className="h-3" />
            {/* Top border line */}
            <div className="border-t border-border/30" />
            {/* Hour grid lines */}
            {hours.map(({ hour }) => (
              <div
                key={hour}
                className="border-b border-border/30"
                style={{ height: `${hourHeight}px` }}
              />
            ))}
            {/* Bottom padding to match */}
            <div className="h-3" />

            {/* Current time indicator */}
            {showCurrentTime && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center pointer-events-none -translate-y-1/2"
                style={{ top: `${TOP_PADDING + currentTimeOffset * hourHeight}px` }}
                suppressHydrationWarning
              >
                <div className="h-2 w-2 -ml-1 rounded-full border border-blue-500 bg-white" />
                <div className="h-[1px] flex-1 bg-blue-500" />
              </div>
            )}

            {/* Appointment blocks */}
            {appointments.map((appointment) => {
              const style = getAppointmentStyle(appointment)
              const statusColor = getStatusColor(appointment.status, appointment.isSigned)
              const isSelected = appointment.id === selectedAppointmentId
              const isHovered = appointment.id === hoveredAppointmentId
              const AppointmentIcon = appointment.appointmentType?.id
                ? APPOINTMENT_TYPE_ICONS[appointment.appointmentType.id] || Calendar
                : Calendar

              // Calculate background color based on state
              // Selected: 30% opacity (50% for completed)
              // Hovered: 18% opacity (40% for completed - needs to be more visible against gray)
              // Default: gray 20% opacity
              const isCompleted = appointment.status === AppointmentStatus.COMPLETED && appointment.isSigned
              const getBackgroundColor = () => {
                if (isSelected) {
                  return isCompleted
                    ? `${statusColor}50` // More opaque for completed to distinguish from gray
                    : `${statusColor}30`
                }
                if (isHovered) {
                  return isCompleted
                    ? `${statusColor}33` // ~20% opacity for completed
                    : `${statusColor}18`
                }
                return `${appointmentBgColor}20`
              }

              return (
                <button
                  key={appointment.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onAppointmentClick?.(appointment, e.currentTarget.getBoundingClientRect())
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    onAppointmentDoubleClick?.(appointment)
                  }}
                  onMouseEnter={() => onAppointmentHover?.(appointment.id)}
                  onMouseLeave={() => onAppointmentHover?.(null)}
                  className="absolute overflow-hidden rounded-r-sm p-2 text-left flex flex-col justify-start transition-colors"
                  style={{
                    ...style,
                    backgroundColor: getBackgroundColor(),
                    borderLeft: `3px solid ${statusColor}`,
                  }}
                >
                  {/* Appointment type icon - top right */}
                  <div className="absolute top-2 right-2">
                    <AppointmentIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>

                  {/* Time */}
                  <div className="text-[11px] text-muted-foreground">
                    {formatTime(appointment.scheduledStart)}
                  </div>

                  {/* Patient name with age and gender */}
                  <div className="text-xs font-medium leading-tight flex items-center gap-1">
                    <span>
                      {appointment.patient
                        ? getPatientDisplayName(appointment.patient)
                        : 'Unknown Patient'}
                    </span>
                    {appointment.patient && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{calculateAge(appointment.patient.dateOfBirth)}</span>
                        {appointment.patient.sex === 'MALE' && <Mars className="h-3 w-3 text-muted-foreground" />}
                        {appointment.patient.sex === 'FEMALE' && <Venus className="h-3 w-3 text-muted-foreground" />}
                      </>
                    )}
                  </div>

                  {/* Chief complaint */}
                  {appointment.conditions?.[0] && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {appointment.conditions[0].name}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </ScrollableArea>
    </div>
  )
}
