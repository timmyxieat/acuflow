'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ScrollableArea } from '@/components/custom'
import { useHeader } from '@/contexts/HeaderContext'
import { formatTime } from '@/lib/dev-time'
import {
  getEnrichedAppointments,
  getPatientDisplayName,
  calculateAge,
  getStatusDisplay,
  type AppointmentWithRelations,
} from '@/data/mock-data'

// =============================================================================
// Contextual Time Display Helper
// =============================================================================

function getContextualTimeStatus(appointment: AppointmentWithRelations): string {
  const now = new Date()
  const start = new Date(appointment.scheduledStart)
  const end = new Date(appointment.scheduledEnd)

  // Before appointment starts
  if (now < start) {
    const diffMs = start.getTime() - now.getTime()
    const diffMin = Math.round(diffMs / 60000)
    if (diffMin < 60) {
      return `in ${diffMin} min`
    }
    const diffHours = Math.round(diffMin / 60)
    return `in ${diffHours}h`
  }

  // During appointment (between start and end)
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

  // After appointment end
  const diffMs = now.getTime() - end.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 60) {
    return `ended ${diffMin} min ago`
  }
  const diffHours = Math.round(diffMin / 60)
  return `ended ${diffHours}h ago`
}

// =============================================================================
// Patient Header (Left Panel)
// =============================================================================

interface PatientHeaderProps {
  appointment: AppointmentWithRelations
}

function PatientHeader({ appointment }: PatientHeaderProps) {
  const patient = appointment.patient

  if (!patient) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
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
  const sexDisplay = patient.sex === 'MALE' ? 'M' : patient.sex === 'FEMALE' ? 'F' : ''

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
      {/* Avatar */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
        {initials}
      </div>
      <div>
        <h2 className="text-lg font-semibold">{getPatientDisplayName(patient)}</h2>
        <p className="text-sm text-muted-foreground">
          {sexDisplay && `${sexDisplay}, `}{age}y
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// Visit Timeline (Left Panel) - Placeholder
// =============================================================================

function VisitTimeline() {
  return (
    <div className="flex flex-col gap-2 px-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Visit History
      </h3>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Visit timeline will appear here
      </div>
    </div>
  )
}

// =============================================================================
// Appointment Header (Right Panel)
// =============================================================================

interface AppointmentHeaderProps {
  appointment: AppointmentWithRelations
}

function AppointmentHeader({ appointment }: AppointmentHeaderProps) {
  const statusDisplay = getStatusDisplay(appointment.status, appointment.isSigned)
  const [contextualStatus, setContextualStatus] = useState(() => getContextualTimeStatus(appointment))

  // Update contextual status every minute
  useEffect(() => {
    const updateStatus = () => {
      setContextualStatus(getContextualTimeStatus(appointment))
    }

    // Update immediately
    updateStatus()

    // Update every 30 seconds for more responsive UI
    const interval = setInterval(updateStatus, 30000)
    return () => clearInterval(interval)
  }, [appointment])

  // Determine action button
  const getActionButton = () => {
    if (appointment.status === 'SCHEDULED') {
      return { label: 'Start Appointment', variant: 'primary' }
    }
    if (appointment.status === 'IN_PROGRESS') {
      return { label: 'End Appointment', variant: 'primary' }
    }
    if (appointment.status === 'COMPLETED' && !appointment.isSigned) {
      return { label: 'Sign Note', variant: 'primary' }
    }
    return null
  }

  const action = getActionButton()

  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold">Appointment today</span>
        <span className="text-sm text-muted-foreground">· {contextualStatus}</span>
      </div>
      <div className="flex items-center gap-3">
        {/* Status badge */}
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.textColor}`}>
          {statusDisplay.label}
        </span>
        {/* Action button */}
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
// SOAP Sections (Right Panel) - Placeholder
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
// Patient Intake Section (Right Panel) - Placeholder
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
// Main Page Component
// =============================================================================

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { setHeader, resetHeader } = useHeader()
  const appointmentId = params.id as string

  // Find the appointment from mock data
  const appointments = getEnrichedAppointments()
  const appointment = appointments.find((a) => a.id === appointmentId)

  // Set the global header when this page mounts
  useEffect(() => {
    if (appointment?.patient) {
      const patientName = getPatientDisplayName(appointment.patient)
      const timeRange = `${formatTime(appointment.scheduledStart)} - ${formatTime(appointment.scheduledEnd)}`

      setHeader({
        showBackButton: true,
        patientName,
        appointmentTime: timeRange,
      })
    }

    // Reset header when leaving the page
    return () => {
      resetHeader()
    }
  // Only re-run when appointment ID changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  if (!appointment) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Appointment not found</h1>
          <p className="text-sm text-muted-foreground mt-1">
            The appointment you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Patient Info & Visit Timeline */}
      <div className="flex w-[300px] flex-col border-r border-border bg-card">
        {/* Patient Header */}
        <PatientHeader appointment={appointment} />

        {/* Visit Timeline - Scrollable */}
        <ScrollableArea className="flex-1 py-4 pl-0 pr-0" deps={[appointmentId]}>
          <VisitTimeline />
        </ScrollableArea>
      </div>

      {/* Right Panel - Appointment Details & SOAP */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Appointment Header */}
        <AppointmentHeader appointment={appointment} />

        {/* Scrollable Content */}
        <ScrollableArea className="flex-1 py-6 pl-6 pr-4" deps={[appointmentId]}>
          <div className="flex flex-col gap-8">
            {/* Patient Intake (Collapsible) */}
            <PatientIntakeSection />

            {/* SOAP Sections */}
            <SOAPSections />
          </div>
        </ScrollableArea>
      </div>
    </div>
  )
}
