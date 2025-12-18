'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollableArea, PatientCards, PatientContextAdaptive, TimelineHeader } from '@/components/custom'
import { useHeader } from '@/contexts/HeaderContext'
import { useTransition } from '@/contexts/TransitionContext'
import { useHoverWithKeyboardNav } from '@/hooks/useHoverWithKeyboardNav'
import { useAutoSave } from '@/hooks/useAutoSave'
import { saveVisitSOAP, loadVisitSOAP } from '@/lib/api/visits'
import { SIDEBAR_ANIMATION } from '@/lib/animations'
import {
  getAppointmentById,
  getAppointmentsByStatusForDate,
  getPatientVisitHistory,
  getPatientContextData,
  updateAppointmentStatus,
  AppointmentStatus,
  type AppointmentWithRelations,
} from '@/data/mock-data'
import { parseDateFromUrl } from '@/lib/date-utils'

// Local components and hooks
import {
  VisitTimeline,
  SOAPSections,
  FABPanel,
  StatusControls,
  type SOAPData,
  type SOAPKey,
  type FocusedSection,
} from './components'
import { useTimer, usePageAnimations } from './hooks'
import { PANEL_WIDTH_CLASS, VISIT_HISTORY_WIDTH_CLASS, APPOINTMENT_INFO_WIDTH, getCompactPatientName } from './lib/helpers'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// =============================================================================
// Main Page Component
// =============================================================================

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setHeader, resetHeader } = useHeader()
  const {
    isTransitioning,
    startTransition,
    setSlideDirection,
    setSelectedAppointmentId,
    setKeyboardNavMode,
    isPatientCardsCollapsed,
    setPatientCardsCollapsed,
    completeTransition,
  } = useTransition()
  const appointmentId = params.id as string

  // Timer state from custom hook
  const timer = useTimer()

  // Toggle collapse state - persisted via TransitionContext across navigation
  const handleToggleCollapse = useCallback(() => {
    setPatientCardsCollapsed(!isPatientCardsCollapsed)
  }, [isPatientCardsCollapsed, setPatientCardsCollapsed])

  // FAB state
  const [isFabExpanded, setIsFabExpanded] = useState(false)


  // State for SOAP note content
  const [soapData, setSoapData] = useState<SOAPData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })

  // Keyboard navigation state for SOAP sections
  const [focusedSoapIndex, setFocusedSoapIndex] = useState(0)
  const [isEditingField, setIsEditingField] = useState(false)

  // Focused SOAP section for adaptive Patient Context panel
  const [focusedSection, setFocusedSection] = useState<FocusedSection>(null)

  // Refs for SOAP textareas
  const soapTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([null, null, null, null])

  // Track if component has initialized (for skipping animation on mount)
  const [hasInitialized, setHasInitialized] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setHasInitialized(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Auto-save SOAP notes
  const { status: saveStatus, markAsSaved, flush: flushSave } = useAutoSave({
    data: soapData,
    onSave: async (data) => {
      await saveVisitSOAP({ appointmentId, soap: data })
    },
  })

  // Load saved SOAP data on mount or when appointment changes
  useEffect(() => {
    const saved = loadVisitSOAP(appointmentId)
    if (saved) {
      setSoapData(saved)
      markAsSaved(saved)
    } else {
      const empty = { subjective: '', objective: '', assessment: '', plan: '' }
      setSoapData(empty)
      markAsSaved(empty)
    }
  }, [appointmentId, markAsSaved])

  // Hover state with keyboard nav awareness
  const [, setHoveredAppointmentId, effectiveHoveredAppointmentId] = useHoverWithKeyboardNav<string>()

  // Force re-render when status changes (for mock data mutations)
  const [statusUpdateKey, setStatusUpdateKey] = useState(0)

  // Find the appointment from mock data (re-fetch when statusUpdateKey changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const appointment = useMemo(() => getAppointmentById(appointmentId), [appointmentId, statusUpdateKey])

  // Animation configurations from centralized hook
  const animations = usePageAnimations({
    appointmentId,
    currentPatientId: appointment?.patient?.id ?? null,
  })

  // Get flat ordered list of all appointments for the appointment's date
  const orderedAppointmentIds = useMemo(() => {
    if (!appointment) return []
    const grouped = getAppointmentsByStatusForDate(new Date(appointment.scheduledStart))
    return [
      ...grouped.inProgress,
      ...grouped.checkedIn,
      ...grouped.scheduled,
      ...grouped.unsigned,
      ...grouped.completed,
    ].map(a => a.id)
  }, [appointment])

  // Highlight the current appointment in PatientCards
  const selectedAppointmentIdForCards = appointmentId

  // Handle status change
  const handleStatusChange = useCallback((newStatus: AppointmentStatus, newIsSigned: boolean) => {
    const success = updateAppointmentStatus(appointmentId, newStatus, newIsSigned)
    if (success) {
      // Force re-render to pick up the updated mock data
      setStatusUpdateKey(prev => prev + 1)
    }
  }, [appointmentId])

  // Get the viewing context date from URL (preserved when navigating between appointments)
  // If not present, use the appointment's date (initial navigation from Today screen)
  const viewDateFromUrl = useMemo(() => {
    const viewDateStr = searchParams.get('viewDate')
    return viewDateStr ? parseDateFromUrl(viewDateStr) : null
  }, [searchParams])

  // The "context date" for navigation - either from URL or the appointment's date
  const contextDate = viewDateFromUrl ?? (appointment ? new Date(appointment.scheduledStart) : new Date())

  // Hide the global topbar - appointment detail page manages its own header
  useEffect(() => {
    setHeader({
      hideGlobalTopbar: true,
    })
    return () => { resetHeader() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Complete transition after animation
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => { completeTransition() }, 400)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning, completeTransition])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const activeElement = document.activeElement
    const isTyping = activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement?.getAttribute('contenteditable') === 'true'

    if (event.key === 'Escape') {
      if (isTyping && activeElement instanceof HTMLElement) {
        activeElement.blur()
        setIsEditingField(false)
        return
      }
      const patientId = appointment?.patient?.id
      router.push(patientId ? `/?patient=${patientId}` : '/')
      return
    }

    if (event.key === 'Enter' && !isTyping) {
      event.preventDefault()
      setKeyboardNavMode(true)
      const textarea = soapTextareaRefs.current[focusedSoapIndex]
      if (textarea) {
        textarea.focus()
        setIsEditingField(true)
      }
      return
    }

    if (!isTyping) {
      setKeyboardNavMode(true)

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const newIndex = event.key === 'ArrowDown'
          ? Math.min(focusedSoapIndex + 1, 3)
          : Math.max(focusedSoapIndex - 1, 0)
        setFocusedSoapIndex(newIndex)
        return
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const textarea = soapTextareaRefs.current[focusedSoapIndex]
        if (textarea) {
          textarea.focus()
          textarea.selectionStart = textarea.selectionEnd = textarea.value.length
          setIsEditingField(true)
        }
      }
    }
  }, [router, focusedSoapIndex, setKeyboardNavMode, appointment?.patient?.id])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Build URL for navigating to another appointment
  const buildAppointmentUrl = useCallback((targetApptId: string) => {
    return `/appointments/${targetApptId}`
  }, [])

  // Handle appointment selection from Visit Timeline (navigates to the appointment)
  const handleTimelineAppointmentSelect = useCallback(async (targetApptId: string) => {
    if (!appointment || targetApptId === appointmentId) return

    await flushSave()

    const currentApptDate = new Date(appointment.scheduledStart)
    const targetAppt = getAppointmentById(targetApptId)
    if (targetAppt) {
      const targetApptDate = new Date(targetAppt.scheduledStart)
      const direction = targetApptDate > currentApptDate ? 'down' : 'up'
      setSlideDirection(direction)
    }

    startTransition({ x: 0, y: 0, width: 0, height: 0 } as DOMRect, 'scheduled', appointment.patient?.id, isPatientCardsCollapsed)
    router.push(buildAppointmentUrl(targetApptId))
  }, [appointment, appointmentId, flushSave, setSlideDirection, startTransition, isPatientCardsCollapsed, router, buildAppointmentUrl])

  // Handle SOAP field changes
  const handleSoapChange = useCallback((key: SOAPKey, value: string) => {
    setSoapData(prev => ({ ...prev, [key]: value }))
  }, [])

  // Handle textarea focus
  const handleTextareaFocus = useCallback((index: number) => {
    setFocusedSoapIndex(index)
    setIsEditingField(true)
  }, [])

  // Handle SOAP section focus (for adaptive Patient Context)
  const handleSectionFocus = useCallback((section: FocusedSection) => {
    setFocusedSection(section)
  }, [])

  // Handle SOAP section blur (for adaptive Patient Context)
  const handleSectionBlur = useCallback(() => {
    setFocusedSection(null)
  }, [])

  if (!appointment) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Appointment not found</h1>
          <p className="text-sm text-muted-foreground mt-1">
            The appointment you're looking for doesn't exist.
          </p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-primary hover:underline">
            Go back
          </button>
        </div>
      </div>
    )
  }

  // Handle appointment click from PatientCards
  const handleAppointmentClick = (clickedAppointment: AppointmentWithRelations, rect?: DOMRect) => {
    if (clickedAppointment.id === appointmentId) {
      setSelectedAppointmentId(null)
      const patientId = clickedAppointment.patient?.id
      router.push(patientId ? `/?patient=${patientId}` : '/')
    } else {
      const currIndex = orderedAppointmentIds.indexOf(appointmentId)
      const newIndex = orderedAppointmentIds.indexOf(clickedAppointment.id)

      if (currIndex !== -1 && newIndex !== -1) {
        setSlideDirection(newIndex > currIndex ? 'down' : 'up')
      }

      if (rect) {
        startTransition(rect, 'appointment', appointment?.patient?.id, isPatientCardsCollapsed)
      }
      router.push(`/appointments/${clickedAppointment.id}`)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header with date display - spans full width (same as Today screen) */}
      <TimelineHeader
        selectedDate={contextDate}
      />

      {/* Content area: PatientCards | Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Patient Cards */}
        <div
          className={`flex flex-col relative flex-shrink-0 transition-[width] ease-out ${
            isPatientCardsCollapsed ? '' : PANEL_WIDTH_CLASS
          }`}
          style={{
            width: isPatientCardsCollapsed ? SIDEBAR_ANIMATION.collapsedWidth : undefined,
            transitionDuration: hasInitialized ? '300ms' : '0ms',
          }}
        >
          <div className="h-full">
            <PatientCards
              date={contextDate}
              onAppointmentClick={handleAppointmentClick}
              onAppointmentHover={setHoveredAppointmentId}
              hoveredAppointmentId={effectiveHoveredAppointmentId}
              selectedAppointmentId={selectedAppointmentIdForCards}
              selectedPatientId={appointment?.patient?.id}
              compact={isPatientCardsCollapsed}
              onToggleCompact={handleToggleCollapse}
              activeTimerAppointmentId={appointmentId}
              activeTimerSeconds={timer.timerSeconds}
              isTimerRunning={timer.isTimerRunning}
            />
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-border" />

        {/* Main content area */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Patient Info Header - full width */}
        {appointment.patient && (() => {
          const patient = appointment.patient
          const { display, full, isTruncated } = getCompactPatientName(
            patient.firstName,
            patient.lastName,
            patient.preferredName,
            20 // Allow longer names in full-width header
          )
          const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase()
          const age = patient.dateOfBirth
            ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null
          const sex = patient.sex === 'FEMALE' ? 'Female' : patient.sex === 'MALE' ? 'Male' : null
          const demographics = [age ? `${age} yo` : null, sex].filter(Boolean).join(', ')

          return (
            <div className="flex items-center justify-between px-3 h-14 border-b border-border flex-shrink-0 bg-background">
              {/* Left: Avatar + Patient name + demographics */}
              <div className="flex items-center gap-2">
                {/* Avatar */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {initials}
                </div>
                {/* Patient name + demographics */}
                <div className="flex flex-col min-w-0">
                  {isTruncated ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-sm font-semibold text-left hover:text-primary transition-colors">
                          {display}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" align="start" className="w-auto p-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold">{full}</span>
                          {demographics && (
                            <span className="text-xs text-muted-foreground">{demographics}</span>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span className="text-sm font-semibold">{display}</span>
                  )}
                  {demographics && (
                    <span className="text-xs text-muted-foreground">{demographics}</span>
                  )}
                </div>
              </div>

              {/* Right: Status + Billing button */}
              <div className="flex items-center gap-3">
                <StatusControls
                  status={appointment.status}
                  isSigned={appointment.isSigned}
                  onStatusChange={handleStatusChange}
                />
                <button
                  className="h-10 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Billing
                </button>
              </div>
            </div>
          )
        })()}

        {/* Content area: Visit Timeline | SOAP + Patient Context */}
        <div className="flex flex-1 overflow-hidden">
          {/* Visit History Column */}
          <AnimatePresence mode="wait" initial={animations.visitHistory.shouldAnimate}>
            <motion.div
              key={animations.visitHistory.key}
              className={`flex flex-col border-r border-border bg-card flex-shrink-0 ${VISIT_HISTORY_WIDTH_CLASS}`}
              initial={animations.visitHistory.shouldAnimate ? animations.visitHistory.initial : false}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={animations.visitHistory.shouldAnimate ? animations.visitHistory.exit : undefined}
              transition={animations.transition}
            >
              {/* Visit Timeline */}
              <ScrollableArea className="flex-1 py-3" deps={[appointmentId]} hideScrollbar>
                {appointment.patient && (
                  <VisitTimeline
                    patientId={appointment.patient.id}
                    currentAppointmentId={appointmentId}
                    onSelectAppointment={handleTimelineAppointmentSelect}
                  />
                )}
              </ScrollableArea>
            </motion.div>
          </AnimatePresence>

          {/* Right Content Column (SOAP + Patient Context) */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* SOAP Notes Panel (always visible) */}
            <div className="flex flex-1 flex-col overflow-hidden bg-background">
              <AnimatePresence mode="wait" initial={animations.soapPanel.shouldAnimate}>
                <motion.div
                  key={animations.soapPanel.key}
                  className="flex flex-1 flex-col overflow-hidden"
                  initial={animations.soapPanel.shouldAnimate ? animations.soapPanel.initial : false}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  exit={animations.soapPanel.shouldAnimate ? animations.soapPanel.exit : undefined}
                  transition={animations.transition}
                >
                  <ScrollableArea className="flex-1 p-3" deps={[appointmentId]}>
                    <div className="flex flex-col gap-4">
                      <SOAPSections
                        soapData={soapData}
                        onSoapChange={handleSoapChange}
                        isZoneFocused={true}
                        focusedIndex={focusedSoapIndex}
                        isEditing={isEditingField}
                        textareaRefs={soapTextareaRefs}
                        onTextareaFocus={handleTextareaFocus}
                        onSectionFocus={handleSectionFocus}
                        onSectionBlur={handleSectionBlur}
                        saveStatus={saveStatus}
                      />
                    </div>
                  </ScrollableArea>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Panel - Patient Context */}
            <div
              className="flex-shrink-0 border-l border-border overflow-hidden"
              style={{ width: APPOINTMENT_INFO_WIDTH }}
            >
              {appointment.patient && (
                <PatientContextAdaptive
                  patient={appointment.patient}
                  conditions={appointment.conditions ?? []}
                  contextData={getPatientContextData(appointment.patient.id)}
                  focusedSection={focusedSection}
                  appointmentId={appointmentId}
                  visitHistory={getPatientVisitHistory(appointment.patient.id)}
                />
              )}
            </div>

            {/* FAB */}
            <FABPanel
              appointment={appointment}
              isExpanded={isFabExpanded}
              onToggleExpanded={() => setIsFabExpanded(!isFabExpanded)}
              timer={timer}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
