'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Clock, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import {
  getAppointmentsByStatus,
  getPatientDisplayName,
  calculateAge,
  getStatusDisplay,
  getConditionStatusDisplay,
  type AppointmentWithRelations,
  AppointmentStatus,
} from '@/data/mock-data'

interface PatientCardsProps {
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void
}

interface StatusSectionProps {
  title: string
  icon: React.ReactNode
  appointments: AppointmentWithRelations[]
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void
  variant: 'inProgress' | 'checkedIn' | 'scheduled' | 'unsigned' | 'completed'
}

function StatusSection({
  title,
  icon,
  appointments,
  onAppointmentClick,
  variant,
}: StatusSectionProps) {
  if (appointments.length === 0) return null

  const variantStyles = {
    inProgress: 'border-blue-200 bg-blue-50/50',
    checkedIn: 'border-green-200 bg-green-50/50',
    scheduled: 'border-gray-200 bg-gray-50/50',
    unsigned: 'border-amber-200 bg-amber-50/50',
    completed: 'border-slate-200 bg-slate-50/50',
  }

  const headerStyles = {
    inProgress: 'text-blue-700',
    checkedIn: 'text-green-700',
    scheduled: 'text-gray-700',
    unsigned: 'text-amber-700',
    completed: 'text-slate-600',
  }

  return (
    <div className={cn('rounded-lg border p-3', variantStyles[variant])}>
      {/* Section header */}
      <div className={cn('mb-3 flex items-center gap-2 text-sm font-medium', headerStyles[variant])}>
        {icon}
        <span>{title}</span>
        <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs">
          {appointments.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {appointments.map((appointment) => (
          <PatientCard
            key={appointment.id}
            appointment={appointment}
            onClick={() => onAppointmentClick?.(appointment)}
            variant={variant}
          />
        ))}
      </div>
    </div>
  )
}

interface PatientCardProps {
  appointment: AppointmentWithRelations
  onClick?: () => void
  variant: 'inProgress' | 'checkedIn' | 'scheduled' | 'unsigned' | 'completed'
}

function PatientCard({ appointment, onClick, variant }: PatientCardProps) {
  const patient = appointment.patient
  if (!patient) return null

  const displayName = getPatientDisplayName(patient)
  const age = calculateAge(patient.dateOfBirth)
  const primaryCondition = appointment.conditions?.[0]

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  // Calculate wait time for checked-in patients
  const getWaitTime = () => {
    if (appointment.status !== AppointmentStatus.CHECKED_IN || !appointment.checkedInAt) return null
    const waitMinutes = Math.floor((Date.now() - appointment.checkedInAt.getTime()) / 60000)
    return waitMinutes
  }

  // Calculate treatment time for in-progress patients
  const getTreatmentTime = () => {
    if (appointment.status !== AppointmentStatus.IN_PROGRESS) return null
    if (appointment.needleInsertionAt) {
      const minutes = Math.floor((Date.now() - appointment.needleInsertionAt.getTime()) / 60000)
      return { type: 'needles', minutes }
    }
    if (appointment.startedAt) {
      const minutes = Math.floor((Date.now() - appointment.startedAt.getTime()) / 60000)
      return { type: 'started', minutes }
    }
    return null
  }

  const waitTime = getWaitTime()
  const treatmentTime = getTreatmentTime()

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg bg-white p-3 text-left shadow-sm transition-all hover:shadow-md',
        variant === 'inProgress' && 'ring-2 ring-blue-400'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {patient.firstName[0]}
            {patient.lastName[0]}
          </div>
          <div>
            <div className="font-medium">{displayName}</div>
            <div className="text-xs text-muted-foreground">
              {age}yo • {formatTime(appointment.scheduledStart)}
            </div>
          </div>
        </div>

        {/* Time indicator */}
        {waitTime !== null && (
          <div className={cn('text-xs', waitTime > 10 ? 'text-amber-600' : 'text-muted-foreground')}>
            {waitTime}m wait
          </div>
        )}
        {treatmentTime && (
          <div className="text-xs text-blue-600">
            {treatmentTime.type === 'needles' ? '🪡' : '⏱️'} {treatmentTime.minutes}m
          </div>
        )}
      </div>

      {/* Primary condition */}
      {primaryCondition && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm">{primaryCondition.name}</span>
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-xs',
              getConditionStatusDisplay(primaryCondition.status).bgColor,
              getConditionStatusDisplay(primaryCondition.status).textColor
            )}
          >
            {getConditionStatusDisplay(primaryCondition.status).label}
          </span>
        </div>
      )}

      {/* Appointment type badge */}
      <div className="mt-2 flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: appointment.appointmentType?.color || '#6366f1' }}
        />
        <span className="text-xs text-muted-foreground">
          {appointment.appointmentType?.name}
        </span>
        {appointment.appointmentType?.durationMinutes && (
          <span className="text-xs text-muted-foreground">
            • {appointment.appointmentType.durationMinutes}min
          </span>
        )}
      </div>

      {/* Package credits indicator */}
      {patient.creditBalance > 0 && (
        <div className="mt-2 text-xs text-emerald-600">
          {patient.creditBalance} package credit{patient.creditBalance !== 1 ? 's' : ''} available
        </div>
      )}
    </button>
  )
}

export function PatientCards({ onAppointmentClick }: PatientCardsProps) {
  const groupedAppointments = useMemo(() => getAppointmentsByStatus(), [])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold">Patients</h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* In Progress - Most important, shows first */}
        <StatusSection
          title="In Progress"
          icon={<Clock className="h-4 w-4" />}
          appointments={groupedAppointments.inProgress}
          onAppointmentClick={onAppointmentClick}
          variant="inProgress"
        />

        {/* Checked In - Waiting */}
        <StatusSection
          title="Checked In"
          icon={<CheckCircle2 className="h-4 w-4" />}
          appointments={groupedAppointments.checkedIn}
          onAppointmentClick={onAppointmentClick}
          variant="checkedIn"
        />

        {/* Scheduled - Upcoming */}
        <StatusSection
          title="Scheduled"
          icon={<Clock className="h-4 w-4" />}
          appointments={groupedAppointments.scheduled}
          onAppointmentClick={onAppointmentClick}
          variant="scheduled"
        />

        {/* Unsigned - Need attention */}
        <StatusSection
          title="Unsigned Notes"
          icon={<AlertCircle className="h-4 w-4" />}
          appointments={groupedAppointments.unsigned}
          onAppointmentClick={onAppointmentClick}
          variant="unsigned"
        />

        {/* Completed - Done for today */}
        <StatusSection
          title="Completed"
          icon={<FileText className="h-4 w-4" />}
          appointments={groupedAppointments.completed}
          onAppointmentClick={onAppointmentClick}
          variant="completed"
        />

        {/* Empty state */}
        {Object.values(groupedAppointments).every((arr) => arr.length === 0) && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No appointments today
          </div>
        )}
      </div>
    </div>
  )
}
