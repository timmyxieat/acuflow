'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { useSearch } from '@/contexts/SearchContext'
import { formatTime } from '@/lib/dev-time'
import { getStatusColor } from '@/lib/constants'
import {
  searchPatientsWithConditions,
  getPatientDisplayName,
  getPatientTodayAppointmentId,
  getPatientVisitHistory,
  getPatientScheduledAppointments,
  getPatientConditionsWithMeasurements,
  getRecentPatients,
  calculateAge,
  type Patient,
  type AppointmentWithRelations,
  type RecentPatient,
  BiologicalSex,
  AppointmentStatus,
} from '@/data/mock-data'

interface PatientSearchResult {
  patient: Patient
  primaryCondition?: string
  todayAppointment?: AppointmentWithRelations | null
  appointmentContext: {
    type: 'today' | 'upcoming' | 'past' | 'none'
    label: string
    appointmentId?: string
  }
}

function getSexLabel(sex: BiologicalSex | null | undefined): string {
  if (sex === BiologicalSex.MALE) return 'M'
  if (sex === BiologicalSex.FEMALE) return 'F'
  return ''
}

function formatContextDate(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  // If it's today, show time
  if (targetDate.getTime() === today.getTime()) {
    return `Today at ${formatTime(date)}`
  }

  // Otherwise show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getPatientAppointmentContext(patientId: string, todayAppt?: AppointmentWithRelations | null): PatientSearchResult['appointmentContext'] {
  // Check for today's appointment first
  if (todayAppt) {
    return {
      type: 'today',
      label: `Today at ${formatTime(todayAppt.scheduledStart)}`,
      appointmentId: todayAppt.id,
    }
  }

  const todayAppointmentId = getPatientTodayAppointmentId(patientId)
  if (todayAppointmentId) {
    // Get the appointment to show the time
    const scheduled = getPatientScheduledAppointments(patientId)
    const appt = scheduled.find(a => a.id === todayAppointmentId)
    if (appt) {
      return {
        type: 'today',
        label: `Today at ${formatTime(appt.scheduledStart)}`,
        appointmentId: todayAppointmentId,
      }
    }
    return {
      type: 'today',
      label: 'Today',
      appointmentId: todayAppointmentId,
    }
  }

  // Check for upcoming appointments
  const scheduled = getPatientScheduledAppointments(patientId)
  const futureAppts = scheduled.filter(a => a.isFuture)
  if (futureAppts.length > 0) {
    const nextAppt = futureAppts[0]
    return {
      type: 'upcoming',
      label: `Next: ${formatContextDate(nextAppt.scheduledStart)}`,
    }
  }

  // Check for past visits
  const visitHistory = getPatientVisitHistory(patientId)
  if (visitHistory.length > 0) {
    const lastVisit = visitHistory[0]
    const visitDate = lastVisit.appointment?.scheduledStart
    if (visitDate) {
      return {
        type: 'past',
        label: `Last seen ${formatContextDate(visitDate)}`,
      }
    }
  }

  return {
    type: 'none',
    label: 'No appointments',
  }
}

// Convert RecentPatient to PatientSearchResult
function recentPatientToResult(recent: RecentPatient): PatientSearchResult {
  const conditions = getPatientConditionsWithMeasurements(recent.patient.id)
  const primaryCondition = conditions.find(c => c.priority === 1)?.name || conditions[0]?.name
  const appointmentContext = getPatientAppointmentContext(recent.patient.id, recent.todayAppointment)

  return {
    patient: recent.patient,
    primaryCondition,
    todayAppointment: recent.todayAppointment,
    appointmentContext,
  }
}

export function PatientSearchCommand() {
  const router = useRouter()
  const { isOpen, closeSearch } = useSearch()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientSearchResult[]>([])

  // Get recent patients (past only, no today) and today's patients separately
  const { recentPastPatients, todayPatients } = useMemo(() => {
    const allRecent = getRecentPatients(12) // Get more to have enough for both groups

    const past: PatientSearchResult[] = []
    const today: PatientSearchResult[] = []

    for (const recent of allRecent) {
      const result = recentPatientToResult(recent)
      if (recent.todayAppointment) {
        today.push(result)
      } else {
        past.push(result)
      }
    }

    // Sort today's patients by status priority (same order as PatientCards)
    const statusPriority: Record<AppointmentStatus, number> = {
      [AppointmentStatus.IN_PROGRESS]: 0,
      [AppointmentStatus.CHECKED_IN]: 1,
      [AppointmentStatus.SCHEDULED]: 2,
      [AppointmentStatus.COMPLETED]: 3,
      [AppointmentStatus.CANCELLED]: 4,
      [AppointmentStatus.NO_SHOW]: 5,
    }

    today.sort((a, b) => {
      const aAppt = a.todayAppointment
      const bAppt = b.todayAppointment
      if (!aAppt || !bAppt) return 0

      // First sort by status priority
      const aPriority = statusPriority[aAppt.status] + (aAppt.status === AppointmentStatus.COMPLETED && !aAppt.isSigned ? -0.5 : 0)
      const bPriority = statusPriority[bAppt.status] + (bAppt.status === AppointmentStatus.COMPLETED && !bAppt.isSigned ? -0.5 : 0)
      if (aPriority !== bPriority) return aPriority - bPriority

      // Then by scheduled time
      return aAppt.scheduledStart.getTime() - bAppt.scheduledStart.getTime()
    })

    return {
      recentPastPatients: past.slice(0, 3), // Limit to 3 recent past patients
      todayPatients: today,
    }
  }, [])

  // Search for patients when query changes
  useEffect(() => {
    if (query.length >= 2) {
      const patients = searchPatientsWithConditions(query)
      const enrichedResults: PatientSearchResult[] = patients.map((patient) => {
        // Get primary condition
        const conditions = getPatientConditionsWithMeasurements(patient.id)
        const primaryCondition = conditions.find(c => c.priority === 1)?.name || conditions[0]?.name

        // Get today's appointment if any (for status dot)
        const todayAppointmentId = getPatientTodayAppointmentId(patient.id)
        let todayAppointment: AppointmentWithRelations | undefined
        if (todayAppointmentId) {
          const scheduled = getPatientScheduledAppointments(patient.id)
          const found = scheduled.find(a => a.id === todayAppointmentId)
          if (found) {
            // Create a minimal AppointmentWithRelations for the status
            todayAppointment = {
              id: found.id,
              status: found.status,
              isSigned: found.isSigned,
              scheduledStart: found.scheduledStart,
              scheduledEnd: found.scheduledEnd,
            } as AppointmentWithRelations
          }
        }

        // Get appointment context
        const appointmentContext = getPatientAppointmentContext(patient.id, todayAppointment)

        return {
          patient,
          primaryCondition,
          todayAppointment,
          appointmentContext,
        }
      })
      setResults(enrichedResults)
    } else {
      setResults([])
    }
  }, [query])

  // Reset query when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  const handleSelect = useCallback((result: PatientSearchResult) => {
    closeSearch()

    // If they have a today appointment, navigate to it
    if (result.appointmentContext.type === 'today' && result.appointmentContext.appointmentId) {
      router.push(`/appointments/${result.appointmentContext.appointmentId}`)
    } else {
      // Otherwise, navigate to Today with patient selected
      router.push(`/?patient=${result.patient.id}`)
    }
  }, [closeSearch, router])

  // Group results by those with today appointments vs others
  const { todayResults, otherResults } = useMemo(() => {
    const today: PatientSearchResult[] = []
    const other: PatientSearchResult[] = []

    for (const result of results) {
      if (result.appointmentContext.type === 'today') {
        today.push(result)
      } else {
        other.push(result)
      }
    }

    return { todayResults: today, otherResults: other }
  }, [results])

  // Determine what to show
  const showRecentPatients = query.length < 2
  const showSearchResults = query.length >= 2
  const hasSearchResults = results.length > 0

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => !open && closeSearch()}
      title="Search patients"
      description="Search by name, phone number, or condition"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Search by name, phone, or condition..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-80">
        {/* Empty search results */}
        {showSearchResults && !hasSearchResults && (
          <CommandEmpty>No patients found.</CommandEmpty>
        )}

        {/* Empty state: Recent past patients (last 3) */}
        {showRecentPatients && recentPastPatients.length > 0 && (
          <CommandGroup heading="Recent">
            {recentPastPatients.map((result) => (
              <PatientResultItem
                key={result.patient.id}
                result={result}
                onSelect={() => handleSelect(result)}
              />
            ))}
          </CommandGroup>
        )}

        {/* Divider between Recent and Today */}
        {showRecentPatients && recentPastPatients.length > 0 && todayPatients.length > 0 && (
          <div className="mx-2 my-1 border-t border-border" />
        )}

        {/* Empty state: Today's patients */}
        {showRecentPatients && todayPatients.length > 0 && (
          <CommandGroup heading="Today">
            {todayPatients.map((result) => (
              <PatientResultItem
                key={result.patient.id}
                result={result}
                onSelect={() => handleSelect(result)}
              />
            ))}
          </CommandGroup>
        )}

        {/* Search results: Today's appointments */}
        {showSearchResults && todayResults.length > 0 && (
          <CommandGroup heading="Today's Appointments">
            {todayResults.map((result) => (
              <PatientResultItem
                key={result.patient.id}
                result={result}
                onSelect={() => handleSelect(result)}
              />
            ))}
          </CommandGroup>
        )}

        {/* Search results: Other patients */}
        {showSearchResults && otherResults.length > 0 && (
          <CommandGroup heading={todayResults.length > 0 ? "Other Patients" : "Patients"}>
            {otherResults.map((result) => (
              <PatientResultItem
                key={result.patient.id}
                result={result}
                onSelect={() => handleSelect(result)}
              />
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

interface PatientResultItemProps {
  result: PatientSearchResult
  onSelect: () => void
}

// Get status label text
function getStatusLabel(status: AppointmentStatus, isSigned: boolean): string {
  switch (status) {
    case AppointmentStatus.IN_PROGRESS:
      return 'In Progress'
    case AppointmentStatus.CHECKED_IN:
      return 'Checked In'
    case AppointmentStatus.SCHEDULED:
      return 'Scheduled'
    case AppointmentStatus.COMPLETED:
      return isSigned ? 'Completed' : 'Unsigned'
    case AppointmentStatus.CANCELLED:
      return 'Cancelled'
    case AppointmentStatus.NO_SHOW:
      return 'No Show'
    default:
      return ''
  }
}

// Get status label color class
function getStatusLabelClass(status: AppointmentStatus, isSigned: boolean): string {
  switch (status) {
    case AppointmentStatus.IN_PROGRESS:
      return 'text-blue-600'
    case AppointmentStatus.CHECKED_IN:
      return 'text-green-600'
    case AppointmentStatus.COMPLETED:
      return isSigned ? 'text-slate-500' : 'text-amber-600'
    case AppointmentStatus.SCHEDULED:
      return 'text-slate-600'
    default:
      return 'text-muted-foreground'
  }
}

// Format time for right side display (just time, no "Today at")
function formatTimeOnly(date: Date): string {
  return formatTime(date)
}

function PatientResultItem({ result, onSelect }: PatientResultItemProps) {
  const { patient, primaryCondition, todayAppointment, appointmentContext } = result
  const displayName = getPatientDisplayName(patient)
  const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase()
  const age = calculateAge(patient.dateOfBirth)
  const sex = getSexLabel(patient.sex)
  const demographics = sex ? `${sex}, ${age}y` : `${age}y`

  const hasToday = appointmentContext.type === 'today'

  // Get status-aware dot color (only for today's appointments)
  let dotColor: string | null = null
  if (todayAppointment) {
    dotColor = getStatusColor(todayAppointment.status, todayAppointment.isSigned)
  }

  // Right side content
  const renderRightSide = () => {
    if (hasToday && todayAppointment) {
      const statusLabel = getStatusLabel(todayAppointment.status, todayAppointment.isSigned)
      const statusClass = getStatusLabelClass(todayAppointment.status, todayAppointment.isSigned)
      const timeStr = formatTimeOnly(todayAppointment.scheduledStart)

      return (
        <div className="flex flex-col items-end text-xs flex-shrink-0">
          <span className={`font-medium ${statusClass}`}>{statusLabel}</span>
          <span className="text-muted-foreground">{timeStr}</span>
        </div>
      )
    }

    if (appointmentContext.type === 'upcoming') {
      // Extract date from label (format: "Next: Dec 20")
      const dateMatch = appointmentContext.label.replace('Next: ', '')
      return (
        <div className="flex flex-col items-end text-xs flex-shrink-0">
          <span className="text-muted-foreground">Next</span>
          <span className="text-muted-foreground">{dateMatch}</span>
        </div>
      )
    }

    if (appointmentContext.type === 'past') {
      // Extract date from label (format: "Last seen Dec 10")
      const dateMatch = appointmentContext.label.replace('Last seen ', '')
      return (
        <div className="flex flex-col items-end text-xs flex-shrink-0">
          <span className="text-muted-foreground">{dateMatch}</span>
        </div>
      )
    }

    return null
  }

  return (
    <CommandItem
      value={`${displayName} ${patient.phone} ${primaryCondition || ''}`}
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 min-h-[52px]"
    >
      {/* Avatar with status indicator */}
      <div className="relative flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {initials}
        </div>
        {dotColor && (
          <div
            className="absolute top-[1px] right-[1px] h-2 w-2 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
        )}
      </div>

      {/* Patient info - left side */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{displayName}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">{demographics}</span>
        </div>
        {primaryCondition && (
          <div className="text-xs text-muted-foreground truncate">
            {primaryCondition}
          </div>
        )}
      </div>

      {/* Appointment info - right side */}
      {renderRightSide()}
    </CommandItem>
  )
}
