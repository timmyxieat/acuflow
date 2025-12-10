'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getDevDate } from '@/lib/dev-time'
import {
  getEnrichedAppointments,
  getPatientDisplayName,
  getStatusDisplay,
  type AppointmentWithRelations,
  AppointmentStatus,
} from '@/data/mock-data'

// Timeline configuration
const HOUR_HEIGHT = 80 // pixels per hour
const START_HOUR = 8 // 8 AM
const END_HOUR = 18 // 6 PM
const TOTAL_HOURS = END_HOUR - START_HOUR

interface TimelineProps {
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void
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

export function Timeline({ onAppointmentClick }: TimelineProps) {
  const appointments = useMemo(() => {
    return getEnrichedAppointments().filter(
      (a) => a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.NO_SHOW
    )
  }, [])

  // Calculate column assignments for overlapping appointments
  const columnAssignments = useMemo(() => assignColumns(appointments), [appointments])

  // Generate hour labels
  const hours = useMemo(() => {
    const result = []
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
      const ampm = h >= 12 ? 'PM' : 'AM'
      result.push({ hour: h, label: `${hour12} ${ampm}` })
    }
    return result
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

    return {
      top: `${startOffset * HOUR_HEIGHT}px`,
      height: `${duration * HOUR_HEIGHT - 4}px`, // -4 for gap
      left: `calc(${leftPercent}% + 4px)`,
      width: `calc(${widthPercent}% - 8px)`,
    }
  }

  // Get border color based on appointment type
  const getAppointmentColor = (appointment: AppointmentWithRelations) => {
    return appointment.appointmentType?.color || '#6366f1'
  }

  // Current time indicator (uses dev time in development)
  const now = getDevDate()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTimeOffset = (currentHour - START_HOUR) + (currentMinutes / 60)
  const showCurrentTime = currentHour >= START_HOUR && currentHour < END_HOUR

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold">Schedule</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{appointments.length} appointments</span>
        </div>
      </div>

      {/* Timeline body */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="flex" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
          {/* Hour labels column */}
          <div className="w-16 flex-shrink-0 border-r border-border bg-muted/30">
            {hours.map(({ hour, label }) => (
              <div
                key={hour}
                className="relative border-b border-border/50"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute -top-2.5 left-2 text-xs text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Appointments column */}
          <div className="relative flex-1">
            {/* Hour grid lines */}
            {hours.map(({ hour }) => (
              <div
                key={hour}
                className="border-b border-border/30"
                style={{ height: `${HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Current time indicator */}
            {showCurrentTime && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                style={{ top: `${currentTimeOffset * HOUR_HEIGHT}px` }}
              >
                <span className="absolute -left-16 -top-2 text-xs font-medium text-red-500">
                  {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
                <div className="h-3 w-3 -ml-1.5 rounded-full bg-red-500 shadow-sm" />
                <div className="h-[2px] flex-1 bg-red-500 shadow-sm" />
              </div>
            )}

            {/* Appointment blocks */}
            {appointments.map((appointment) => {
              const style = getAppointmentStyle(appointment)
              const color = getAppointmentColor(appointment)
              const statusDisplay = getStatusDisplay(appointment.status, appointment.isSigned)
              const isActive = appointment.status === AppointmentStatus.IN_PROGRESS

              return (
                <button
                  key={appointment.id}
                  onClick={() => onAppointmentClick?.(appointment)}
                  className={cn(
                    'absolute overflow-hidden rounded-lg border-l-4 bg-card p-2 text-left shadow-sm transition-all hover:shadow-md',
                    isActive && 'ring-2 ring-blue-500 ring-offset-2'
                  )}
                  style={{
                    ...style,
                    borderLeftColor: color,
                  }}
                >
                  {/* Time */}
                  <div className="mb-1 text-xs text-muted-foreground">
                    {appointment.scheduledStart.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {appointment.scheduledEnd.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>

                  {/* Patient name */}
                  <div className="font-medium">
                    {appointment.patient
                      ? getPatientDisplayName(appointment.patient)
                      : 'Unknown Patient'}
                  </div>

                  {/* Appointment type */}
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {appointment.appointmentType?.name}
                  </div>

                  {/* Status badge */}
                  <div className="mt-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        statusDisplay.bgColor,
                        statusDisplay.textColor
                      )}
                    >
                      {statusDisplay.label}
                    </span>
                  </div>

                  {/* Conditions preview (if space allows) */}
                  {appointment.conditions && appointment.conditions.length > 0 && (
                    <div className="mt-2 truncate text-xs text-muted-foreground">
                      {appointment.conditions
                        .slice(0, 2)
                        .map((c) => c.name)
                        .join(', ')}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
