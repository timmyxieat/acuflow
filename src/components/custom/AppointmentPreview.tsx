'use client'

import { useState } from 'react'
import { X, Phone, Mail, ClipboardCheck, RefreshCw, Sparkles, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStatusColor } from '@/lib/constants'
import { formatTime } from '@/lib/dev-time'
import { ScrollableArea } from './ScrollableArea'
import {
  type AppointmentWithRelations,
  getPatientDisplayName,
  calculateAge,
  getStatusDisplay,
} from '@/data/mock-data'

// Map appointment type IDs to icons
const APPOINTMENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'appt_type_001': ClipboardCheck, // Initial Consultation
  'appt_type_002': RefreshCw, // Follow-up Treatment
  'appt_type_003': Sparkles, // Brief Follow-up
}

interface TimelineEntry {
  label: string
  time: Date
}

function TimelineSection({ appointment }: { appointment: AppointmentWithRelations }) {
  const [expanded, setExpanded] = useState(false)

  // Build timeline entries in order
  const entries: TimelineEntry[] = []
  if (appointment.checkedInAt) entries.push({ label: 'Checked In', time: appointment.checkedInAt })
  if (appointment.startedAt) entries.push({ label: 'Started', time: appointment.startedAt })
  if (appointment.needleInsertionAt) entries.push({ label: 'Needles In', time: appointment.needleInsertionAt })
  if (appointment.needleRemovalAt) entries.push({ label: 'Needles Out', time: appointment.needleRemovalAt })
  if (appointment.completedAt) entries.push({ label: 'Completed', time: appointment.completedAt })

  if (entries.length === 0) return null

  // Latest entry is the last one (most recent relevant timestamp)
  const latestEntry = entries[entries.length - 1]
  const hasMoreEntries = entries.length > 1

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Timeline
      </h4>
      <div className="flex flex-col gap-1.5 text-sm">
        {/* Show all entries when expanded, otherwise just the latest */}
        {expanded ? (
          entries.map((entry, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-muted-foreground">{entry.label}</span>
              <span>{formatTime(entry.time)}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{latestEntry.label}</span>
            <span>{formatTime(latestEntry.time)}</span>
          </div>
        )}
        {hasMoreEntries && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? 'See less' : 'See all'}
          </button>
        )}
      </div>
    </div>
  )
}

interface AppointmentPreviewProps {
  appointment: AppointmentWithRelations
  onClose: () => void
}

export function AppointmentPreview({ appointment, onClose }: AppointmentPreviewProps) {
  const patient = appointment.patient
  const statusDisplay = getStatusDisplay(appointment.status, appointment.isSigned)

  // Get primary condition (chief complaint)
  const primaryCondition = appointment.conditions?.[0]

  // Get initials for avatar
  const initials = patient
    ? `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase()
    : '?'

  // Get appointment type icon
  const AppointmentIcon = appointment.appointmentType?.id
    ? APPOINTMENT_TYPE_ICONS[appointment.appointmentType.id] || Calendar
    : Calendar

  // Get status color
  const statusColor = getStatusColor(appointment.status, appointment.isSigned)

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
            <h2 className="text-base font-semibold">
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

      {/* Scrollable content */}
      <ScrollableArea className="flex flex-col gap-4 py-4 pl-4 pr-2" deps={[appointment.id]}>
        {/* Appointment Details */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Appointment
          </h4>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              <span className="text-sm font-medium">{statusDisplay.label}</span>
            </div>
            {appointment.appointmentType && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AppointmentIcon className="h-3.5 w-3.5" />
                <span>{appointment.appointmentType.name}</span>
              </div>
            )}
            {patient && (
              <div className="text-sm text-muted-foreground">
                {calculateAge(patient.dateOfBirth)} years old
                {patient.sex && `, ${patient.sex === 'MALE' ? 'Male' : patient.sex === 'FEMALE' ? 'Female' : patient.sex}`}
              </div>
            )}
            {primaryCondition && (
              <div className="text-sm">
                <span className="text-muted-foreground">CC: </span>
                <span className="font-medium">{primaryCondition.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        {patient && (patient.phone || patient.email) && (
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Contact
            </h4>
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

        {/* Treatment Timeline (for in-progress/completed) */}
        <TimelineSection appointment={appointment} />
      </ScrollableArea>

      {/* Footer Actions */}
      <div className="border-t border-border p-4">
        <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Open Full Record
        </button>
      </div>
    </div>
  )
}
