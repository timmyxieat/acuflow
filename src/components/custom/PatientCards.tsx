'use client'

import { useMemo, useState, useEffect } from 'react'
import { getDevNow, formatTime } from '@/lib/dev-time'
import { getStatusColor } from '@/lib/constants'
import { Syringe } from 'lucide-react'
import { ScrollableArea } from './ScrollableArea'
import {
  getAppointmentsByStatus,
  getPatientDisplayName,
  type AppointmentWithRelations,
  AppointmentStatus,
} from '@/data/mock-data'

// Variant to status mapping for header colors
const VARIANT_STATUS_MAP: Record<string, { status: AppointmentStatus; isSigned?: boolean }> = {
  inProgress: { status: AppointmentStatus.IN_PROGRESS },
  checkedIn: { status: AppointmentStatus.CHECKED_IN },
  scheduled: { status: AppointmentStatus.SCHEDULED },
  unsigned: { status: AppointmentStatus.COMPLETED, isSigned: false },
  completed: { status: AppointmentStatus.COMPLETED, isSigned: true },
}

interface PatientCardsProps {
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void
  onAppointmentHover?: (appointmentId: string | null) => void
  hoveredAppointmentId?: string | null
  selectedAppointmentId?: string
}

interface StatusSectionProps {
  title: string
  appointments: AppointmentWithRelations[]
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void
  onAppointmentHover?: (appointmentId: string | null) => void
  hoveredAppointmentId?: string | null
  selectedAppointmentId?: string
  variant: 'inProgress' | 'checkedIn' | 'scheduled' | 'unsigned' | 'completed'
}

function StatusSection({
  title,
  appointments,
  onAppointmentClick,
  onAppointmentHover,
  hoveredAppointmentId,
  selectedAppointmentId,
  variant,
}: StatusSectionProps) {
  if (appointments.length === 0) return null

  const statusMapping = VARIANT_STATUS_MAP[variant]
  const statusColor = getStatusColor(statusMapping.status, statusMapping.isSigned)

  return (
    <div className="flex flex-col gap-2">
      {/* Section header */}
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <div
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
        />
        <span>{title}</span>
        <span>({appointments.length})</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {appointments.map((appointment) => (
          <PatientCard
            key={appointment.id}
            appointment={appointment}
            onClick={() => onAppointmentClick?.(appointment)}
            onHover={(isHovered) => onAppointmentHover?.(isHovered ? appointment.id : null)}
            isHovered={appointment.id === hoveredAppointmentId}
            isSelected={appointment.id === selectedAppointmentId}
          />
        ))}
      </div>
    </div>
  )
}

interface PatientCardProps {
  appointment: AppointmentWithRelations
  onClick?: () => void
  onHover?: (isHovered: boolean) => void
  isHovered?: boolean
  isSelected?: boolean
}

function PatientCard({ appointment, onClick, onHover, isHovered, isSelected }: PatientCardProps) {
  const patient = appointment.patient
  if (!patient) return null

  const displayName = getPatientDisplayName(patient)
  const primaryCondition = appointment.conditions?.[0]


  // Calculate wait time for checked-in patients
  const getWaitTime = () => {
    if (appointment.status !== AppointmentStatus.CHECKED_IN || !appointment.checkedInAt) return null
    const waitMinutes = Math.floor((getDevNow() - appointment.checkedInAt.getTime()) / 60000)
    return Math.max(0, waitMinutes) // Never show negative wait time
  }

  // Calculate treatment info for in-progress patients
  const getTreatmentInfo = () => {
    if (appointment.status !== AppointmentStatus.IN_PROGRESS) return null

    const now = getDevNow()
    const NEEDLE_RETENTION_MINUTES = 20 // Standard needle retention time

    // Needles in - show MM:SS countdown for needle retention
    if (appointment.needleInsertionAt && !appointment.needleRemovalAt) {
      const msElapsed = now - appointment.needleInsertionAt.getTime()
      const targetMs = NEEDLE_RETENTION_MINUTES * 60000
      const msRemaining = targetMs - msElapsed
      const isOvertime = msRemaining < 0
      const totalSeconds = Math.ceil(Math.abs(msRemaining) / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
      return {
        type: 'needling' as const,
        icon: Syringe,
        time: isOvertime ? `-${timeStr}` : timeStr,
        isOvertime,
      }
    }

    // No needles or needles out - no timer display
    return null
  }

  const waitTime = getWaitTime()
  const treatmentInfo = getTreatmentInfo()

  // Get initials for avatar
  const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase()

  // Get status color for hover/selected states
  const statusColor = getStatusColor(appointment.status, appointment.isSigned)
  const isCompleted = appointment.status === AppointmentStatus.COMPLETED && appointment.isSigned

  // Calculate background color based on state
  // Selected: 30% opacity (50% for completed)
  // Hovered: 18% opacity (38% for completed - needs to be more visible against gray)
  const getBackgroundColor = () => {
    if (isSelected) {
      return isCompleted ? `${statusColor}50` : `${statusColor}30`
    }
    if (isHovered) {
      return isCompleted ? `${statusColor}33` : `${statusColor}18` // ~20% for completed
    }
    return '#94a3b820'
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className="w-full text-left transition-colors rounded-md p-2"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <div className="relative flex items-center gap-2">
        {/* Appointment time - absolute top right */}
        <span className="absolute top-0 right-0 text-xs text-muted-foreground">
          {formatTime(appointment.scheduledStart)}
        </span>

        {/* Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {initials}
        </div>

        {/* Name and details */}
        <div className="min-w-0 flex-1 pr-16">
          <div className="truncate text-sm font-medium">{displayName}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {primaryCondition && (
              <span className="truncate">{primaryCondition.name}</span>
            )}
          </div>
        </div>

        {/* Bottom right: secondary indicators */}
        {(waitTime !== null || treatmentInfo) && (
          <div className="absolute bottom-0 right-0 flex flex-col items-end">
            {waitTime !== null && (
              <span className="text-[10px] text-muted-foreground">
                {waitTime}m ago
              </span>
            )}
            {treatmentInfo && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                {treatmentInfo.icon && <treatmentInfo.icon className="h-3 w-3" />}
                {treatmentInfo.time}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

export function PatientCards({ onAppointmentClick, onAppointmentHover, hoveredAppointmentId, selectedAppointmentId }: PatientCardsProps) {
  const groupedAppointments = useMemo(() => getAppointmentsByStatus(), [])

  // Force re-render every second to update timers
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <ScrollableArea className="flex flex-col gap-3 pl-2 py-3" deps={[groupedAppointments]}>
        {/* In Progress - Most important, shows first */}
        <StatusSection
          title="In Progress"
          appointments={groupedAppointments.inProgress}
          onAppointmentClick={onAppointmentClick}
          onAppointmentHover={onAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
          selectedAppointmentId={selectedAppointmentId}
          variant="inProgress"
        />

        {/* Checked In - Waiting */}
        <StatusSection
          title="Checked In"
          appointments={groupedAppointments.checkedIn}
          onAppointmentClick={onAppointmentClick}
          onAppointmentHover={onAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
          selectedAppointmentId={selectedAppointmentId}
          variant="checkedIn"
        />

        {/* Scheduled - Upcoming */}
        <StatusSection
          title="Scheduled"
          appointments={groupedAppointments.scheduled}
          onAppointmentClick={onAppointmentClick}
          onAppointmentHover={onAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
          selectedAppointmentId={selectedAppointmentId}
          variant="scheduled"
        />

        {/* Divider between active/upcoming and completed sections */}
        {(groupedAppointments.inProgress.length > 0 ||
          groupedAppointments.checkedIn.length > 0 ||
          groupedAppointments.scheduled.length > 0) &&
          (groupedAppointments.unsigned.length > 0 ||
            groupedAppointments.completed.length > 0) && (
          <div className="border-t border-border -mx-2" />
        )}

        {/* Unsigned - Need attention */}
        <StatusSection
          title="Unsigned"
          appointments={groupedAppointments.unsigned}
          onAppointmentClick={onAppointmentClick}
          onAppointmentHover={onAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
          selectedAppointmentId={selectedAppointmentId}
          variant="unsigned"
        />

        {/* Completed - Done for today */}
        <StatusSection
          title="Completed"
          appointments={groupedAppointments.completed}
          onAppointmentClick={onAppointmentClick}
          onAppointmentHover={onAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
          selectedAppointmentId={selectedAppointmentId}
          variant="completed"
        />

        {/* Empty state */}
        {Object.values(groupedAppointments).every((arr) => arr.length === 0) && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No appointments today
          </div>
        )}
      </ScrollableArea>
    </div>
  )
}
