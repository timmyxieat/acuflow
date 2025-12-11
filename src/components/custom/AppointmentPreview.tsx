'use client'

import { X, Clock, User, FileText, Activity, Calendar, Phone, Mail, Mars, Venus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type AppointmentWithRelations,
  getPatientDisplayName,
  calculateAge,
  getStatusDisplay,
  getConditionStatusDisplay,
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

  const formatDuration = (start: Date, end: Date) => {
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000)
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  // Get sex icon component
  const SexIcon = patient?.sex === 'FEMALE' ? Venus : patient?.sex === 'MALE' ? Mars : null

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold">Appointment</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Patient Info */}
        {patient && (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{getPatientDisplayName(patient)}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <span>{calculateAge(patient.dateOfBirth)} years old</span>
                  {SexIcon && <SexIcon className="h-4 w-4" />}
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                  statusDisplay.bgColor,
                  statusDisplay.textColor
                )}
              >
                {statusDisplay.label}
              </span>
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5">
              {patient.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{patient.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointment Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Appointment Details
          </h4>

          <div className="space-y-2">
            {/* Time */}
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">
                  {formatTime(appointment.scheduledStart)} - {formatTime(appointment.scheduledEnd)}
                </span>
                <span className="text-muted-foreground ml-2">
                  ({formatDuration(appointment.scheduledStart, appointment.scheduledEnd)})
                </span>
              </div>
            </div>

            {/* Appointment Type */}
            {appointment.appointmentType && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: appointment.appointmentType.color || '#6366f1' }}
                  />
                  <span className="text-sm">{appointment.appointmentType.name}</span>
                </div>
              </div>
            )}

            {/* Practitioner */}
            {appointment.practitioner && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {appointment.practitioner.firstName} {appointment.practitioner.lastName}
                  {appointment.practitioner.credentials && (
                    <span className="text-muted-foreground">, {appointment.practitioner.credentials}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Conditions */}
        {appointment.conditions && appointment.conditions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Conditions
            </h4>
            <div className="space-y-2">
              {appointment.conditions.map((condition) => {
                const conditionStatus = getConditionStatusDisplay(condition.status)
                return (
                  <div
                    key={condition.id}
                    className="flex items-start justify-between rounded-md border border-border p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{condition.name}</div>
                      {condition.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {condition.description}
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        conditionStatus.bgColor,
                        conditionStatus.textColor
                      )}
                    >
                      {conditionStatus.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Treatment Timeline (for in-progress/completed) */}
        {(appointment.checkedInAt || appointment.startedAt) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Treatment Timeline
            </h4>
            <div className="space-y-2 text-sm">
              {appointment.checkedInAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Checked In</span>
                  <span>{formatTime(appointment.checkedInAt)}</span>
                </div>
              )}
              {appointment.startedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Treatment Started</span>
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

        {/* Insurance Info */}
        {patient?.insuranceCompany && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Insurance
            </h4>
            <div className="text-sm space-y-1">
              <div>{patient.insuranceCompany}</div>
              {patient.insuranceMemberId && (
                <div className="text-muted-foreground">Member ID: {patient.insuranceMemberId}</div>
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
