'use client'

import { useState } from 'react'
import { Check, ClipboardCheck, RefreshCw, Sparkles, Calendar } from 'lucide-react'
import { ScrollableArea } from './ScrollableArea'
import { formatTime } from '@/lib/dev-time'
import {
  getPatientDisplayName,
  calculateAge,
  getStatusDisplay,
  getPatientVisitHistory,
  type AppointmentWithRelations,
  type VisitWithAppointment,
} from '@/data/mock-data'

// Map appointment type IDs to icons
const APPOINTMENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'appt_type_001': ClipboardCheck, // Initial Consultation
  'appt_type_002': RefreshCw, // Follow-up Treatment
  'appt_type_003': Sparkles, // Brief Follow-up
}

// =============================================================================
// Contextual Time Display Helper
// =============================================================================

function getContextualTimeStatus(appointment: AppointmentWithRelations): string {
  const now = new Date()
  const start = new Date(appointment.scheduledStart)
  const end = new Date(appointment.scheduledEnd)

  if (now < start) {
    const diffMs = start.getTime() - now.getTime()
    const diffMin = Math.round(diffMs / 60000)
    if (diffMin < 60) {
      return `in ${diffMin} min`
    }
    const diffHours = Math.round(diffMin / 60)
    return `in ${diffHours}h`
  }

  if (now >= start && now < end) {
    const diffMs = end.getTime() - now.getTime()
    const diffMin = Math.round(diffMs / 60000)
    if (diffMin < 60) {
      return `${diffMin} min remaining`
    }
    const diffHours = Math.floor(diffMin / 60)
    const remainingMin = diffMin % 60
    if (remainingMin === 0) {
      return `${diffHours}h remaining`
    }
    return `${diffHours}h ${remainingMin}m remaining`
  }

  const diffMs = now.getTime() - end.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 60) {
    return `ended ${diffMin} min ago`
  }
  const diffHours = Math.round(diffMin / 60)
  return `ended ${diffHours}h ago`
}

// =============================================================================
// Patient Header
// =============================================================================

interface PatientHeaderProps {
  appointment: AppointmentWithRelations
}

function PatientHeader({ appointment }: PatientHeaderProps) {
  const patient = appointment.patient

  if (!patient) {
    return (
      <div className="flex h-[72px] items-center gap-3 px-4 border-b border-border">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
          ?
        </div>
        <div>
          <h2 className="text-lg font-semibold">Unknown Patient</h2>
        </div>
      </div>
    )
  }

  const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase()
  const age = calculateAge(patient.dateOfBirth)
  const sexDisplay = patient.sex === 'MALE' ? 'Male' : patient.sex === 'FEMALE' ? 'Female' : null

  return (
    <div className="flex h-[72px] items-center gap-3 px-4 border-b border-border">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
        {initials}
      </div>
      <div>
        <h2 className="text-lg font-semibold">{getPatientDisplayName(patient)}</h2>
        <p className="text-sm text-muted-foreground">
          {age} years old{sexDisplay && `, ${sexDisplay}`}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// Visit Timeline
// =============================================================================

interface VisitTimelineProps {
  patientId: string
  selectedVisitId: string | null
  onSelectVisit: (visitId: string | null) => void
}

function formatVisitDate(date: Date): string {
  const now = new Date()
  const visitDate = new Date(date)
  const isSameYear = now.getFullYear() === visitDate.getFullYear()

  if (isSameYear) {
    return visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function VisitCard({
  visit,
  isSelected,
  onClick,
}: {
  visit: VisitWithAppointment
  isSelected: boolean
  onClick: () => void
}) {
  const appointmentType = visit.appointment?.appointmentType
  const isSigned = visit.appointment?.isSigned ?? true
  const visitDate = visit.appointment?.scheduledStart
    ? new Date(visit.appointment.scheduledStart)
    : new Date(visit.createdAt)

  const IconComponent = appointmentType?.id
    ? APPOINTMENT_TYPE_ICONS[appointmentType.id] || Calendar
    : Calendar

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-lg border p-3 transition-all
        ${isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/20'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <IconComponent className="h-4 w-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
              {formatVisitDate(visitDate)}
            </span>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {visit.chiefComplaint || 'No chief complaint recorded'}
            </p>
          </div>
        </div>
        {isSigned && (
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-2.5 w-2.5 text-green-600" />
            </div>
          </div>
        )}
      </div>
      {isSelected && (
        <div className="mt-2 pt-2 border-t border-primary/20">
          <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
            Currently viewing
          </span>
        </div>
      )}
    </button>
  )
}

function VisitTimeline({ patientId, selectedVisitId, onSelectVisit }: VisitTimelineProps) {
  const visitHistory = getPatientVisitHistory(patientId)

  if (visitHistory.length === 0) {
    return (
      <div className="flex flex-col gap-3 px-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Visit History
        </h3>
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            First visit for this patient
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Past visits will appear here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Visit History
      </h3>
      <div className="flex flex-col gap-2">
        {visitHistory.map((visit) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            isSelected={selectedVisitId === visit.id}
            onClick={() => onSelectVisit(selectedVisitId === visit.id ? null : visit.id)}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Appointment Header
// =============================================================================

interface AppointmentHeaderProps {
  appointment: AppointmentWithRelations
}

function getRelativeDay(date: Date): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()

  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, tomorrow)) return 'Tomorrow'
  if (isSameDay(date, yesterday)) return 'Yesterday'

  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`

  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

function AppointmentHeader({ appointment }: AppointmentHeaderProps) {
  const statusDisplay = getStatusDisplay(appointment.status, appointment.isSigned)

  const getActionButton = () => {
    if (appointment.status === 'SCHEDULED') {
      return { label: 'Start Appointment' }
    }
    if (appointment.status === 'IN_PROGRESS') {
      return { label: 'End Appointment' }
    }
    if (appointment.status === 'COMPLETED' && !appointment.isSigned) {
      return { label: 'Sign Note' }
    }
    return null
  }

  const action = getActionButton()
  const appointmentDate = new Date(appointment.scheduledStart)
  const dateStr = appointmentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const relativeDay = getRelativeDay(appointmentDate)
  const timeRange = `${formatTime(appointment.scheduledStart)} - ${formatTime(appointment.scheduledEnd)}`

  return (
    <div className="flex h-[72px] items-center justify-between border-b border-border px-6">
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold">{dateStr}</span>
          <span className="text-sm text-muted-foreground">· {relativeDay}</span>
        </div>
        <div className="text-sm text-muted-foreground">{timeRange}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.textColor}`}>
          {statusDisplay.label}
        </span>
        {action && (
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// SOAP Sections (Placeholder)
// =============================================================================

function SOAPSections() {
  const sections = [
    { key: 'subjective', label: 'Subjective' },
    { key: 'objective', label: 'Objective' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.key} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{section.label}</h3>
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            {section.label} content will appear here
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Patient Intake Section (Placeholder)
// =============================================================================

function PatientIntakeSection() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Patient Intake</h3>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Expand
        </button>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Patient intake form will appear here (future feature)
      </div>
    </div>
  )
}

// =============================================================================
// Main AppointmentDetail Component
// =============================================================================

interface AppointmentDetailProps {
  appointment: AppointmentWithRelations
}

export function AppointmentDetail({ appointment }: AppointmentDetailProps) {
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null)

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel - Patient Info & Visit Timeline */}
      <div className="flex w-[300px] flex-col border-r border-border bg-card">
        <PatientHeader appointment={appointment} />
        <ScrollableArea className="flex-1 py-4 px-3" deps={[appointment.id]}>
          {appointment.patient && (
            <VisitTimeline
              patientId={appointment.patient.id}
              selectedVisitId={selectedVisitId}
              onSelectVisit={setSelectedVisitId}
            />
          )}
        </ScrollableArea>
      </div>

      {/* Right Panel - Appointment Details & SOAP */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <AppointmentHeader appointment={appointment} />
        <ScrollableArea className="flex-1 py-6 pl-6 pr-4" deps={[appointment.id]}>
          <div className="flex flex-col gap-8">
            <PatientIntakeSection />
            <SOAPSections />
          </div>
        </ScrollableArea>
      </div>
    </div>
  )
}
