'use client'

import { X, Phone, Mail, Mars, Venus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type AppointmentWithRelations,
  getPatientDisplayName,
  calculateAge,
  getStatusDisplay,
} from '@/data/mock-data'

interface AppointmentPreviewProps {
  appointment: AppointmentWithRelations
  onClose: () => void
}

export function AppointmentPreview({ appointment, onClose }: AppointmentPreviewProps) {
  const patient = appointment.patient
  const statusDisplay = getStatusDisplay(appointment.status, appointment.isSigned)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  // Get sex icon component
  const SexIcon = patient?.sex === 'FEMALE' ? Venus : patient?.sex === 'MALE' ? Mars : null

  // Get primary condition (chief complaint)
  const primaryCondition = appointment.conditions?.[0]

  // Get initials for avatar
  const initials = patient
    ? `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase()
    : '?'

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      {/* Header - Patient name and time */}
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {patient ? getPatientDisplayName(patient) : 'Unknown Patient'}
            </h2>
            <div className="text-sm text-muted-foreground">
              {formatTime(appointment.scheduledStart)} - {formatTime(appointment.scheduledEnd)}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Demographics & Contact */}
        {patient && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span>{calculateAge(patient.dateOfBirth)} years old</span>
              {SexIcon && <SexIcon className="h-4 w-4 text-muted-foreground" />}
              <span
                className={cn(
                  'ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  statusDisplay.bgColor,
                  statusDisplay.textColor
                )}
              >
                {statusDisplay.label}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{patient.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointment Type & Chief Complaint */}
        <div className="space-y-2">
          {appointment.appointmentType && (
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: appointment.appointmentType.color || '#6366f1' }}
              />
              <span className="text-sm font-medium">{appointment.appointmentType.name}</span>
            </div>
          )}
          {primaryCondition && (
            <div className="text-sm text-muted-foreground">
              CC: {primaryCondition.name}
            </div>
          )}
        </div>

        {/* Treatment Timeline (for in-progress/completed) */}
        {(appointment.checkedInAt || appointment.startedAt) && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Timeline
            </h4>
            <div className="space-y-1.5 text-sm">
              {appointment.checkedInAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Checked In</span>
                  <span>{formatTime(appointment.checkedInAt)}</span>
                </div>
              )}
              {appointment.startedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span>{formatTime(appointment.startedAt)}</span>
                </div>
              )}
              {appointment.needleInsertionAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Needles In</span>
                  <span>{formatTime(appointment.needleInsertionAt)}</span>
                </div>
              )}
              {appointment.needleRemovalAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Needles Out</span>
                  <span>{formatTime(appointment.needleRemovalAt)}</span>
                </div>
              )}
              {appointment.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{formatTime(appointment.completedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-4">
        <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Open Full Record
        </button>
      </div>
    </div>
  )
}
