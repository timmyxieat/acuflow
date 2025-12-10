'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Clock, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import {
  getAppointmentsByStatus,
  getPatientDisplayName,
  calculateAge,
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

  const headerStyles = {
    inProgress: 'text-blue-600',
    checkedIn: 'text-green-600',
    scheduled: 'text-muted-foreground',
    unsigned: 'text-amber-600',
    completed: 'text-slate-500',
  }

  return (
    <div>
      {/* Section header - simple inline */}
      <div className={cn('mb-2 flex items-center gap-1.5 text-xs font-medium', headerStyles[variant])}>
        {icon}
        <span>{title}</span>
        <span className="text-muted-foreground">({appointments.length})</span>
      </div>

      {/* Cards */}
      <div className="space-y-1.5">
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

  // Get sex icon
  const getSexIcon = () => {
    if (patient.sex === 'FEMALE') return '♀'
    if (patient.sex === 'MALE') return '♂'
    return null
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-left transition-colors hover:bg-accent',
        variant === 'inProgress' && 'border-blue-300 bg-blue-50/50'
      )}
    >
      <div className="flex items-center gap-2">
        {/* Name and details */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{displayName}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{age}</span>
            {getSexIcon() && <span>{getSexIcon()}</span>}
            {primaryCondition && (
              <>
                <span>•</span>
                <span className="truncate">{primaryCondition.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Right side: time + indicators */}
        <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
          <span className="text-xs text-muted-foreground">{formatTime(appointment.scheduledStart)}</span>
          {waitTime !== null && (
            <span className={cn('text-[10px]', waitTime > 10 ? 'text-amber-600' : 'text-muted-foreground')}>
              {waitTime}m wait
            </span>
          )}
          {treatmentTime && (
            <span className="text-[10px] text-blue-600">{treatmentTime.minutes}m</span>
          )}
        </div>
      </div>
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
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
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
