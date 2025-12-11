'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { getDevDate } from '@/lib/dev-time'
import { getStatusColor } from '@/lib/constants'
import { ClipboardCheck, RefreshCw, Sparkles, Calendar, Mars, Venus } from 'lucide-react'
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
const MIN_HOUR_HEIGHT = 120 // minimum pixels per hour
const START_HOUR = 8 // 8 AM
const END_HOUR = 18 // 6 PM
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOP_PADDING = 13 // h-3 (12px) + border (1px)

interface TimelineProps {
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void
  selectedAppointmentId?: string
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

export function Timeline({ onAppointmentClick, selectedAppointmentId }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hourHeight, setHourHeight] = useState(MIN_HOUR_HEIGHT)

  // Calculate dynamic hour height based on container size
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const availableHeight = containerRef.current.clientHeight
        const calculatedHeight = availableHeight / TOTAL_HOURS
        setHourHeight(Math.max(calculatedHeight, MIN_HOUR_HEIGHT))
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const appointments = useMemo(() => {
    return getEnrichedAppointments().filter(
      (a) => a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.NO_SHOW
    )
  }, [])

  // Calculate column assignments for overlapping appointments
  const columnAssignments = useMemo(() => assignColumns(appointments), [appointments])

  // Generate hour labels (8 AM through 6 PM = 10 hour slots + end label)
  const hours = useMemo(() => {
    const result = []
    for (let h = START_HOUR; h < END_HOUR; h++) {
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
      const ampm = h >= 12 ? 'PM' : 'AM'
      result.push({ hour: h, label: `${hour12} ${ampm}` })
    }
    return result
  }, [])

  // End hour label (6 PM)
  const endHourLabel = useMemo(() => {
    const endHour = END_HOUR as number
    const hour12 = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour
    const ampm = endHour >= 12 ? 'PM' : 'AM'
    return `${hour12} ${ampm}`
  }, [])

  // Calculate position and height for an appointment
  const getAppointmentStyle = (appointment: AppointmentWithRelations) => {
    const startHour = appointment.scheduledStart.getHours()
    const startMinutes = appointment.scheduledStart.getMinutes()
    const endHour = appointment.scheduledEnd.getHours()
    const endMinutes = appointment.scheduledEnd.getMinutes()

    const startOffset = (startHour - START_HOUR) + (startMinutes / 60)
    const endOffset = (endHour - START_HOUR) + (endMinutes / 60)
    const duration = endOffset - startOffset

    // Get column info for overlapping appointments
    const columnInfo = columnAssignments.get(appointment.id) || { column: 0, totalColumns: 1 }
    const widthPercent = 100 / columnInfo.totalColumns
    const leftPercent = columnInfo.column * widthPercent

    // Calculate left offset and width with 8px edge padding and 8px gap between columns
    const isFirstColumn = columnInfo.column === 0
    const isLastColumn = columnInfo.column === columnInfo.totalColumns - 1
    const isSingleColumn = columnInfo.totalColumns === 1

    let leftOffset = 8 // 8px left edge padding
    let widthReduction = 16 // default: 8px left + 8px right edge

    if (!isSingleColumn) {
      if (isFirstColumn) {
        leftOffset = 8 // 8px from left edge
        widthReduction = 12 // 8px left edge + 4px (half of 8px gap)
      } else if (isLastColumn) {
        leftOffset = 4 // 4px (half of 8px gap)
        widthReduction = 12 // 4px gap + 8px right edge
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
  const currentTimeOffset = (currentHour - START_HOUR) + (currentMinutes / 60)
  const showCurrentTime = currentHour >= START_HOUR && currentHour < END_HOUR

  // Total height for the timeline
  const totalHeight = TOTAL_HOURS * hourHeight

  // Track if content is scrollable and scroll position
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)

  useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        setCanScrollDown(scrollTop + clientHeight < scrollHeight - 10)
        setCanScrollUp(scrollTop > 10)
      }
    }

    checkScroll()
    const container = containerRef.current
    container?.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      container?.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [hourHeight])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card relative">
      {/* Scroll indicator - top fade */}
      {canScrollUp && (
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-gray-400/15 to-transparent pointer-events-none z-10" />
      )}

      {/* Scroll indicator - bottom fade */}
      {canScrollDown && (
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-400/15 to-transparent pointer-events-none z-10" />
      )}

      {/* Timeline body */}
      <div ref={containerRef} className="relative flex-1 overflow-y-auto scrollbar-thin">
        <div className="relative flex min-h-full">
          {/* Hour labels column */}
          <div className="w-16 flex-shrink-0 relative bg-muted/30 border-r border-border">
            {/* Top padding for first label */}
            <div className="h-3" />
            {/* Top border line */}
            <div className="border-t border-border/50" />
            {hours.map(({ hour, label }) => (
              <div
                key={hour}
                className="relative border-b border-border/50"
                style={{ height: `${hourHeight}px` }}
              >
                <span className="absolute top-0 left-0 right-0 -translate-y-1/2 text-center text-xs text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
            {/* End hour label */}
            <div className="relative h-3">
              <span className="absolute top-0 left-0 right-0 -translate-y-1/2 text-center text-xs text-muted-foreground">
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
              const AppointmentIcon = appointment.appointmentType?.id
                ? APPOINTMENT_TYPE_ICONS[appointment.appointmentType.id] || Calendar
                : Calendar

              return (
                <button
                  key={appointment.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onAppointmentClick?.(appointment)
                  }}
                  className="absolute overflow-hidden rounded-r-sm px-2 py-1 text-left flex flex-col justify-start transition-all hover:opacity-80"
                  style={{
                    ...style,
                    backgroundColor: isSelected
                      ? (appointment.status === AppointmentStatus.COMPLETED && appointment.isSigned
                          ? `${statusColor}50` // More opaque for completed to distinguish from gray
                          : `${statusColor}30`)
                      : `${appointmentBgColor}20`,
                    borderLeft: `3px solid ${statusColor}`,
                  }}
                >
                  {/* Appointment type icon - top right */}
                  <div className="absolute top-1 right-1">
                    <AppointmentIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>

                  {/* Time */}
                  <div className="text-[11px] text-muted-foreground">
                    {appointment.scheduledStart.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    }).toUpperCase()}
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
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
