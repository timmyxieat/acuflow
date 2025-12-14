'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollableArea, PatientCards } from '@/components/custom'
import { useHeader } from '@/contexts/HeaderContext'
import { useTransition } from '@/contexts/TransitionContext'
import { useHoverWithKeyboardNav } from '@/hooks/useHoverWithKeyboardNav'
import { useAutoSave } from '@/hooks/useAutoSave'
import { saveVisitSOAP } from '@/lib/api/visits'
import { formatTime } from '@/lib/dev-time'
import { SIDEBAR_ANIMATION, CONTENT_SLIDE_ANIMATION } from '@/lib/animations'
import {
  getEnrichedAppointments,
  getAppointmentsByStatus,
  getPatientDisplayName,
  calculateAge,
  getStatusDisplay,
  getPatientVisitHistory,
  getVisitById,
  type AppointmentWithRelations,
  type VisitWithAppointment,
} from '@/data/mock-data'
import { Check, ClipboardCheck, RefreshCw, Sparkles, Calendar } from 'lucide-react'

// Map appointment type IDs to icons (same as Timeline.tsx)
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
// Height matches AppointmentHeader (72px) for visual alignment
// =============================================================================

interface PatientHeaderProps {
  appointment: AppointmentWithRelations
}

function PatientHeader({ appointment }: PatientHeaderProps) {
  const patient = appointment.patient

  if (!patient) {
    return (
      <div className="flex h-[72px] items-center gap-3 px-2 border-b border-border">
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
    <div className="flex h-[72px] items-center gap-3 px-2 border-b border-border">
      {/* Avatar */}
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
// Visit Timeline (Left Panel)
// =============================================================================

interface VisitTimelineProps {
  patientId: string
  selectedVisitId: string | null
  onSelectVisit: (visitId: string | null, index: number) => void
  hoveredVisitId?: string | null
  onHoverVisit?: (visitId: string | null) => void
  // Focus state for keyboard navigation
  isZoneFocused?: boolean
  focusedIndex?: number
}

function formatVisitDate(date: Date): string {
  const now = new Date()
  const visitDate = new Date(date)

  // Check if same year
  const isSameYear = now.getFullYear() === visitDate.getFullYear()

  if (isSameYear) {
    return visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function VisitCard({
  visit,
  isSelected,
  isHovered,
  isFocused,
  onClick,
  onHover,
}: {
  visit: VisitWithAppointment
  isSelected: boolean
  isHovered?: boolean
  isFocused?: boolean
  onClick: () => void
  onHover?: (isHovered: boolean) => void
}) {
  const appointmentType = visit.appointment?.appointmentType
  const isSigned = visit.appointment?.isSigned ?? true
  const visitDate = visit.appointment?.scheduledStart
    ? new Date(visit.appointment.scheduledStart)
    : new Date(visit.createdAt)

  // Get the icon component for this appointment type (same pattern as Timeline)
  const IconComponent = appointmentType?.id
    ? APPOINTMENT_TYPE_ICONS[appointmentType.id] || Calendar
    : Calendar

  // Build className based on selection and focus states
  // Focus = keyboard navigation indicator (distinct ring)
  // Selected = viewing this visit's content (background + border)
  const getCardClassName = () => {
    const base = 'w-full text-left rounded-lg border p-3 transition-all'

    if (isSelected && isFocused) {
      // Selected + Focused: both states combined
      return `${base} border-primary bg-primary/5 ring-2 ring-inset ring-primary/50`
    }
    if (isSelected) {
      // Selected only: viewing this visit
      return `${base} border-primary bg-primary/5 ring-1 ring-primary/20`
    }
    if (isFocused) {
      // Focused only: keyboard nav is here
      return `${base} border-primary ring-2 ring-inset ring-primary/50 bg-card`
    }
    if (isHovered) {
      return `${base} border-muted-foreground/20 bg-muted/50`
    }
    return `${base} border-border bg-card`
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={getCardClassName()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Appointment type icon - simple style like Timeline */}
          <IconComponent className="h-4 w-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {/* Date */}
            <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
              {formatVisitDate(visitDate)}
            </span>
            {/* Chief complaint */}
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {visit.chiefComplaint || 'No chief complaint recorded'}
            </p>
          </div>
        </div>
        {/* Signed indicator */}
        {isSigned && (
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-2.5 w-2.5 text-green-600" />
            </div>
          </div>
        )}
      </div>
      {/* Currently viewing label */}
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

function VisitTimeline({ patientId, selectedVisitId, onSelectVisit, hoveredVisitId, onHoverVisit, isZoneFocused, focusedIndex }: VisitTimelineProps) {
  const visitHistory = getPatientVisitHistory(patientId)

  // Empty state for new patients
  if (visitHistory.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
    <div className="flex flex-col gap-3">
      <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Visit History
      </h3>
      <div className="flex flex-col gap-2">
        {visitHistory.map((visit, index) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            isSelected={selectedVisitId === visit.id}
            isHovered={hoveredVisitId === visit.id}
            isFocused={isZoneFocused && focusedIndex === index}
            onClick={() => onSelectVisit(selectedVisitId === visit.id ? null : visit.id, index)}
            onHover={(isHovered) => onHoverVisit?.(isHovered ? visit.id : null)}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Appointment Header (Right Panel)
// Row 1: Date · relation to today | status badge | action button
// Row 2: Time range (smaller)
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

  // Calculate days difference
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`

  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

function AppointmentHeader({ appointment }: AppointmentHeaderProps) {
  const statusDisplay = getStatusDisplay(appointment.status, appointment.isSigned)

  // Determine action button
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
    <div className="flex h-[72px] items-center justify-between border-b border-border px-2">
      {/* Left: Date + time in a column */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold">{dateStr}</span>
          <span className="text-sm text-muted-foreground">· {relativeDay}</span>
        </div>
        <div className="text-sm text-muted-foreground">{timeRange}</div>
      </div>

      {/* Right: Status badge + action button */}
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
// SOAP Sections (Right Panel)
// =============================================================================

type SOAPKey = 'subjective' | 'objective' | 'assessment' | 'plan'

interface SOAPData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface SOAPSectionsProps {
  selectedVisitId: string | null
  soapData: SOAPData
  onSoapChange: (key: SOAPKey, value: string) => void
  onUsePastTreatment?: () => void
  // Focus state for keyboard navigation
  isZoneFocused: boolean
  focusedIndex: number
  isEditing: boolean
  textareaRefs: React.MutableRefObject<(HTMLTextAreaElement | null)[]>
  onTextareaFocus: (index: number) => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

function SOAPSections({
  selectedVisitId,
  soapData,
  onSoapChange,
  onUsePastTreatment,
  isZoneFocused,
  focusedIndex,
  isEditing,
  textareaRefs,
  onTextareaFocus,
  saveStatus,
}: SOAPSectionsProps) {
  // Get the selected past visit for preview
  const selectedVisit = selectedVisitId ? getVisitById(selectedVisitId) : null

  // Extract raw text from visit SOAP fields
  const getVisitSoapContent = (key: SOAPKey): string | null => {
    if (!selectedVisit) return null
    const field = selectedVisit[key] as { raw?: string } | null
    return field?.raw || null
  }

  const sections: { key: SOAPKey; label: string }[] = [
    { key: 'subjective', label: 'Subjective' },
    { key: 'objective', label: 'Objective' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
  ]

  // Render save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="text-xs text-muted-foreground animate-pulse">
            Saving...
          </span>
        )
      case 'saved':
        return (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )
      case 'error':
        return (
          <span className="text-xs text-destructive">
            Save failed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* SOAP Header with save status */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          SOAP Note
        </h3>
        {renderSaveStatus()}
      </div>

      {sections.map((section, index) => {
        const previewContent = getVisitSoapContent(section.key)
        const isPlan = section.key === 'plan'
        const isFocused = isZoneFocused && focusedIndex === index && !isEditing

        return (
          <div key={section.key} className="flex flex-col gap-2">
            {/* Section header with optional action button */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{section.label}</h3>
              {isPlan && selectedVisit && onUsePastTreatment && (
                <button
                  onClick={onUsePastTreatment}
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Use past treatment
                </button>
              )}
            </div>

            {/* Textarea for current note - auto-expands with content */}
            {/* Focus states: keyboard nav focus (ring-primary/50) vs typing focus (ring-primary/20) */}
            <textarea
              ref={(el) => { textareaRefs.current[index] = el }}
              value={soapData[section.key]}
              onChange={(e) => onSoapChange(section.key, e.target.value)}
              onFocus={() => onTextareaFocus(index)}
              placeholder={`Enter ${section.label.toLowerCase()} notes...`}
              className={`w-full rounded-lg border bg-background p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary transition-colors field-sizing-content ${
                isFocused ? 'border-primary ring-2 ring-inset ring-primary/50' : 'border-border'
              }`}
              rows={2}
            />

            {/* Compact preview from selected past visit - inline styling, no header */}
            {previewContent && (
              <p className="rounded bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground italic line-clamp-2">
                {previewContent}
              </p>
            )}
          </div>
        )
      })}
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
  const {
    isTransitioning,
    transitionSource,
    slideDirection,
    startTransition,
    setSlideDirection,
    setSelectedAppointmentId,
    isKeyboardNavMode,
    setKeyboardNavMode,
    completeTransition,
  } = useTransition()
  const appointmentId = params.id as string

  // State for selected visit in timeline (for preview)
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null)

  // State for SOAP note content
  const [soapData, setSoapData] = useState<SOAPData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })

  // Two-zone keyboard navigation state
  type FocusZone = 'soap' | 'visits'
  const [focusZone, setFocusZone] = useState<FocusZone>('soap')
  const [focusedSoapIndex, setFocusedSoapIndex] = useState(0) // 0=S, 1=O, 2=A, 3=P
  const [focusedVisitIndex, setFocusedVisitIndex] = useState(0)
  const [isEditingField, setIsEditingField] = useState(false)
  const soapFieldKeys: SOAPKey[] = ['subjective', 'objective', 'assessment', 'plan']

  // Refs for SOAP textareas
  const soapTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([null, null, null, null])

  // Auto-save SOAP notes
  const { status: saveStatus } = useAutoSave({
    data: soapData,
    onSave: async (data) => {
      await saveVisitSOAP({ appointmentId, soap: data })
    },
  })

  // Hover state with keyboard nav awareness
  const [, setHoveredAppointmentId, effectiveHoveredAppointmentId] = useHoverWithKeyboardNav<string>()
  const [, setHoveredVisitId, effectiveHoveredVisitId] = useHoverWithKeyboardNav<string>()

  // Find the appointment from mock data
  const appointments = getEnrichedAppointments()
  const appointment = appointments.find((a) => a.id === appointmentId)

  // Get flat ordered list of all appointments (same order as PatientCards)
  const orderedAppointmentIds = useMemo(() => {
    const grouped = getAppointmentsByStatus()
    return [
      ...grouped.inProgress,
      ...grouped.checkedIn,
      ...grouped.scheduled,
      ...grouped.unsigned,
      ...grouped.completed,
    ].map(a => a.id)
  }, [])

  // Get ordered visit IDs for the current patient (for arrow key navigation in visit history)
  const orderedVisitIds = useMemo(() => {
    if (!appointment?.patient?.id) return []
    return getPatientVisitHistory(appointment.patient.id).map(v => v.id)
  }, [appointment?.patient?.id])

  // Set the global header when this page mounts
  useEffect(() => {
    if (appointment) {
      setHeader({
        showBackButton: true,
      })
    }

    // Reset header when leaving the page
    return () => {
      resetHeader()
    }
  // Only re-run when appointment ID changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  // Complete transition after animation
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        completeTransition()
      }, 400) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [isTransitioning, completeTransition])

  // Handle keyboard shortcuts - Two-zone navigation (SOAP ↔ Visit History)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if user is typing in an input/textarea
    const activeElement = document.activeElement
    const isTyping = activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement?.getAttribute('contenteditable') === 'true'

    // ESC: if editing, exit edit mode and stay in SOAP zone
    // If not editing and in visits zone with selection, deselect
    // Otherwise go back to Today
    if (event.key === 'Escape') {
      if (isTyping && activeElement instanceof HTMLElement) {
        activeElement.blur()
        setIsEditingField(false)
        return
      }
      if (focusZone === 'visits' && selectedVisitId) {
        setSelectedVisitId(null)
        return
      }
      router.push('/')
      return
    }

    // Enter key
    if (event.key === 'Enter' && !isTyping) {
      event.preventDefault()
      setKeyboardNavMode(true)

      if (focusZone === 'soap') {
        // Enter edit mode for the focused SOAP field
        const textarea = soapTextareaRefs.current[focusedSoapIndex]
        if (textarea) {
          textarea.focus()
          setIsEditingField(true)
        }
      } else if (focusZone === 'visits' && orderedVisitIds.length > 0) {
        // Toggle visit selection
        const visitId = orderedVisitIds[focusedVisitIndex]
        if (selectedVisitId === visitId) {
          setSelectedVisitId(null)
        } else {
          setSelectedVisitId(visitId)
        }
      }
      return
    }

    // Arrow keys (only when not typing)
    if (!isTyping) {
      setKeyboardNavMode(true)

      // Up/Down: navigate within current zone
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()

        if (focusZone === 'soap') {
          // Navigate between SOAP fields
          const newIndex = event.key === 'ArrowDown'
            ? Math.min(focusedSoapIndex + 1, 3)
            : Math.max(focusedSoapIndex - 1, 0)
          setFocusedSoapIndex(newIndex)
        } else if (focusZone === 'visits' && orderedVisitIds.length > 0) {
          // Navigate between visits
          const newIndex = event.key === 'ArrowDown'
            ? Math.min(focusedVisitIndex + 1, orderedVisitIds.length - 1)
            : Math.max(focusedVisitIndex - 1, 0)
          setFocusedVisitIndex(newIndex)
        }
        return
      }

      // Left: switch to visits zone (if visits exist)
      if (event.key === 'ArrowLeft' && focusZone === 'soap' && orderedVisitIds.length > 0) {
        event.preventDefault()
        setFocusZone('visits')
        return
      }

      // Right: switch to SOAP zone
      if (event.key === 'ArrowRight' && focusZone === 'visits') {
        event.preventDefault()
        setFocusZone('soap')
        return
      }

      // Character typing in SOAP zone - auto-focus into textarea
      if (focusZone === 'soap' && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const textarea = soapTextareaRefs.current[focusedSoapIndex]
        if (textarea) {
          textarea.focus()
          // Move cursor to end of existing content
          textarea.selectionStart = textarea.selectionEnd = textarea.value.length
          setIsEditingField(true)
          // Don't prevent default - let the character type
        }
      }
    }
  }, [router, focusZone, focusedSoapIndex, focusedVisitIndex, orderedVisitIds, selectedVisitId, setKeyboardNavMode])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Handle visit selection from timeline (also sets navigation focus)
  const handleSelectVisit = (visitId: string | null, index: number) => {
    setSelectedVisitId(visitId)
    setFocusZone('visits')
    setFocusedVisitIndex(index)
  }

  // Handle SOAP field changes
  const handleSoapChange = useCallback((key: SOAPKey, value: string) => {
    setSoapData(prev => ({ ...prev, [key]: value }))
  }, [])

  // Handle textarea focus (when user clicks into a SOAP field)
  const handleTextareaFocus = useCallback((index: number) => {
    setFocusedSoapIndex(index)
    setFocusZone('soap')
    setIsEditingField(true)
  }, [])

  // Handle "Use past treatment" button - copy plan from selected visit
  const handleUsePastTreatment = useCallback(() => {
    if (!selectedVisitId) return
    const visit = getVisitById(selectedVisitId)
    if (!visit) return

    const planField = visit.plan as { raw?: string } | null
    const planContent = planField?.raw || ''

    if (planContent) {
      // Append to existing plan or replace if empty
      setSoapData(prev => ({
        ...prev,
        plan: prev.plan ? `${prev.plan}\n\n--- From past visit ---\n${planContent}` : planContent,
      }))
    }
  }, [selectedVisitId])

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

  // Handle appointment click from PatientCards - navigate to that appointment or back to Today
  const handleAppointmentClick = (clickedAppointment: AppointmentWithRelations, rect?: DOMRect) => {
    if (clickedAppointment.id === appointmentId) {
      // Clicking the already-selected card: deselect and go back to Today
      setSelectedAppointmentId(null)
      router.push('/')
    } else {
      // Calculate slide direction based on position in list
      const currIndex = orderedAppointmentIds.indexOf(appointmentId)
      const newIndex = orderedAppointmentIds.indexOf(clickedAppointment.id)

      if (currIndex !== -1 && newIndex !== -1) {
        // If clicking appointment below current, slide down; if above, slide up
        setSlideDirection(newIndex > currIndex ? 'down' : 'up')
      }

      if (rect) {
        startTransition(rect, 'appointment')
      }
      router.push(`/appointments/${clickedAppointment.id}`)
    }
  }

  // Only animate sidebar width when coming from Today screen
  const shouldAnimateSidebar = transitionSource === 'today'

  return (
    <div className="flex h-full overflow-hidden">
      {/* Patient Cards - compact mode, only animate width when coming from Today */}
      <motion.div
        className="flex flex-col flex-shrink-0"
        initial={shouldAnimateSidebar ? { width: SIDEBAR_ANIMATION.expandedWidth } : false}
        animate={{ width: SIDEBAR_ANIMATION.collapsedWidth }}
        transition={SIDEBAR_ANIMATION.transition}
      >
        <div className="h-full">
          <PatientCards
            onAppointmentClick={handleAppointmentClick}
            onAppointmentHover={setHoveredAppointmentId}
            hoveredAppointmentId={effectiveHoveredAppointmentId}
            selectedAppointmentId={appointmentId}
            compact
          />
        </div>
      </motion.div>

      {/* Vertical divider */}
      <div className="w-px bg-border" />

      {/* Main content - slides in from right from Today, vertical slide between appointments */}
      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={true}>
          <motion.div
            key={appointmentId}
            className="flex flex-1"
            initial={{
              // From Today: slide from right, between appointments: vertical slide
              x: transitionSource === 'today' ? 100 : 0,
              y: transitionSource === 'appointment'
                ? CONTENT_SLIDE_ANIMATION.vertical.getInitial(slideDirection).y
                : 0,
              opacity: 0,
            }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{
              y: transitionSource === 'appointment'
                ? CONTENT_SLIDE_ANIMATION.vertical.getExit(slideDirection).y
                : 0,
              opacity: 0,
            }}
            transition={SIDEBAR_ANIMATION.transition}
          >
            {/* Middle Panel - Patient Info & Visit Timeline */}
            <div className="flex w-[300px] flex-col border-r border-border bg-card">
              {/* Patient Header */}
              <PatientHeader appointment={appointment} />

              {/* Visit Timeline - Scrollable */}
              <ScrollableArea className="flex-1 py-4 pl-2 pr-0" deps={[appointmentId]}>
                {appointment.patient && (
                  <VisitTimeline
                    patientId={appointment.patient.id}
                    selectedVisitId={selectedVisitId}
                    onSelectVisit={handleSelectVisit}
                    hoveredVisitId={effectiveHoveredVisitId}
                    onHoverVisit={setHoveredVisitId}
                    isZoneFocused={focusZone === 'visits'}
                    focusedIndex={focusedVisitIndex}
                  />
                )}
              </ScrollableArea>
            </div>

            {/* Right Panel - Appointment Details & SOAP */}
            <div className="flex flex-1 flex-col overflow-hidden bg-background">
              {/* Appointment Header */}
              <AppointmentHeader appointment={appointment} />

              {/* Scrollable Content */}
              <ScrollableArea className="flex-1 py-4 pl-2 pr-0" deps={[appointmentId]}>
                <div className="flex flex-col gap-4">
                  {/* Patient Intake (Collapsible) */}
                  <PatientIntakeSection />

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* SOAP Sections */}
                  <SOAPSections
                    selectedVisitId={selectedVisitId}
                    soapData={soapData}
                    onSoapChange={handleSoapChange}
                    onUsePastTreatment={handleUsePastTreatment}
                    isZoneFocused={focusZone === 'soap'}
                    focusedIndex={focusedSoapIndex}
                    isEditing={isEditingField}
                    textareaRefs={soapTextareaRefs}
                    onTextareaFocus={handleTextareaFocus}
                    saveStatus={saveStatus}
                  />
                </div>
              </ScrollableArea>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
