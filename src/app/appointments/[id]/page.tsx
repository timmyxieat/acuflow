'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollableArea, PatientCards, PatientContextAdaptive, BillingTab, CommsTab, type BillingData, type CommsData, type ScheduleData, type ViewScope } from '@/components/custom'
import { getBillingDataForAppointment, getPatientBillingHistory, type PatientBillingHistory } from '@/data/mock-billing'
import { useHeader } from '@/contexts/HeaderContext'
import { useTransition } from '@/contexts/TransitionContext'
import { useHoverWithKeyboardNav } from '@/hooks/useHoverWithKeyboardNav'
import { useAutoSave } from '@/hooks/useAutoSave'
import { saveVisitSOAP, loadVisitSOAP } from '@/lib/api/visits'
import { SIDEBAR_ANIMATION } from '@/lib/animations'
import {
  getAppointmentById,
  getAppointmentsByStatusForDate,
  getPatientDisplayName,
  getPatientVisitHistory,
  getPatientContextData,
  type AppointmentWithRelations,
} from '@/data/mock-data'
import { parseDateFromUrl, formatDateForUrl } from '@/lib/date-utils'

// Local components and hooks
import {
  VisitTimeline,
  SOAPSections,
  FABPanel,
  TopTabBar,
  type SOAPData,
  type SOAPKey,
  type TabType,
  type FocusedSection,
} from './components'
import { useTimer, usePageAnimations } from './hooks'
import { PANEL_WIDTH_CLASS, VISIT_HISTORY_WIDTH_CLASS, APPOINTMENT_INFO_WIDTH } from './lib/helpers'

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

  // Read collapse state from URL on mount
  useEffect(() => {
    const collapsedFromUrl = searchParams.get('cards')
    if (collapsedFromUrl === 'expanded') {
      setPatientCardsCollapsed(false)
    } else if (collapsedFromUrl === 'collapsed') {
      setPatientCardsCollapsed(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  // Update URL when collapse state changes
  const handleToggleCollapse = useCallback(() => {
    const newCollapsed = !isPatientCardsCollapsed
    setPatientCardsCollapsed(newCollapsed)

    const params = new URLSearchParams(searchParams.toString())
    params.set('cards', newCollapsed ? 'collapsed' : 'expanded')
    const newUrl = `/appointments/${appointmentId}${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newUrl, { scroll: false })
  }, [isPatientCardsCollapsed, setPatientCardsCollapsed, searchParams, router, appointmentId])

  // FAB state
  const [isFabExpanded, setIsFabExpanded] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('medical')

  // View scope state for tabs (This Visit / All toggle)
  const [viewScope, setViewScope] = useState<ViewScope>('thisVisit')

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

  // Find the appointment from mock data
  const appointment = getAppointmentById(appointmentId)

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

  // Billing data
  const billingData: BillingData = useMemo(() => {
    const patientId = appointment?.patient?.id || ''
    const isCompleted = appointment?.status === 'COMPLETED'
    const usedEstim = appointment?.usedEstim ?? false
    return getBillingDataForAppointment(appointmentId, patientId, isCompleted, usedEstim)
  }, [appointmentId, appointment?.patient?.id, appointment?.status, appointment?.usedEstim])

  // Billing history for "All" view
  const billingHistory: PatientBillingHistory = useMemo(() => {
    const patientId = appointment?.patient?.id || ''
    return getPatientBillingHistory(patientId)
  }, [appointment?.patient?.id])

  // Handle tab change - reset viewScope to "This Visit"
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
    setViewScope('thisVisit')
  }, [])

  // Reset viewScope when appointment changes
  useEffect(() => {
    setViewScope('thisVisit')
  }, [appointmentId])

  // Mock comms data
  const commsData: CommsData = useMemo(() => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const isInProgress = appointment?.status === 'IN_PROGRESS'
    const isCheckedIn = appointment?.status === 'CHECKED_IN'
    const confirmedAt = (isInProgress || isCheckedIn) ? new Date(yesterday.getTime() + 2 * 60 * 60 * 1000) : undefined
    const appointmentStart = appointment?.scheduledStart ? new Date(appointment.scheduledStart) : now

    return {
      messages: [
        {
          id: 'msg_001',
          type: 'reminder' as const,
          content: `Reminder: Your appointment is tomorrow at ${appointmentStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`,
          timestamp: yesterday,
          status: 'delivered' as const,
        },
        ...(isInProgress || isCheckedIn ? [{
          id: 'msg_002',
          type: 'patient_response' as const,
          content: 'Confirmed! See you then.',
          timestamp: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000),
          status: 'read' as const,
          isFromPatient: true,
        }] : []),
      ],
      notes: [
        { id: 'note_001', content: 'Patient prefers afternoon appointments when possible.', createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), createdBy: 'Dr. Smith', isPinned: true },
        { id: 'note_002', content: 'Mentioned work deadline stress affecting sleep.', createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), createdBy: 'Dr. Smith' },
      ],
      confirmationStatus: (isInProgress || isCheckedIn) ? 'confirmed' as const : 'pending' as const,
      reminderSentAt: yesterday,
      confirmedAt,
      unreadCount: 0,
    }
  }, [appointment?.status, appointment?.scheduledStart])

  // Mock schedule data
  const scheduleData: ScheduleData = useMemo(() => {
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const isInProgress = appointment?.status === 'IN_PROGRESS'
    const isCheckedIn = appointment?.status === 'CHECKED_IN'
    const confirmedAt = (isInProgress || isCheckedIn) ? new Date(yesterday.getTime() + 2 * 60 * 60 * 1000) : undefined
    const appointmentStart = appointment?.scheduledStart ? new Date(appointment.scheduledStart) : now
    const appointmentEnd = appointment?.scheduledEnd ? new Date(appointment.scheduledEnd) : new Date(now.getTime() + 60 * 60 * 1000)
    const duration = Math.round((appointmentEnd.getTime() - appointmentStart.getTime()) / (1000 * 60))

    return {
      currentAppointment: { date: appointmentStart, startTime: appointmentStart, endTime: appointmentEnd, type: appointment?.appointmentType?.name ?? 'Follow-up Treatment', duration, confirmedAt },
      followUp: { recommendedInterval: '1 week', nextAvailable: new Date(oneWeekFromNow.setHours(10, 30, 0, 0)) },
      recentVisits: [
        { id: 'visit_001', date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), type: 'Follow-up', status: 'Completed' },
        { id: 'visit_002', date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), type: 'Follow-up', status: 'Completed' },
        { id: 'visit_003', date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), type: 'Initial Consultation', status: 'Completed' },
      ],
      upcomingAppointments: [],
    }
  }, [appointment?.status, appointment?.scheduledStart, appointment?.scheduledEnd, appointment?.appointmentType?.name])

  // Get the viewing context date from URL (preserved when navigating between appointments)
  // If not present, use the appointment's date (initial navigation from Today screen)
  const viewDateFromUrl = useMemo(() => {
    const viewDateStr = searchParams.get('viewDate')
    return viewDateStr ? parseDateFromUrl(viewDateStr) : null
  }, [searchParams])

  // The "context date" for navigation - either from URL or the appointment's date
  const contextDate = viewDateFromUrl ?? (appointment ? new Date(appointment.scheduledStart) : new Date())

  // Set the global header when this page mounts
  // Include currentDate so back button returns to the correct day's view
  useEffect(() => {
    if (appointment) {
      setHeader({
        showBackButton: true,
        currentPatientId: appointment.patient?.id,
        currentDate: contextDate,
      })
    }
    return () => { resetHeader() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, viewDateFromUrl])

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

  // Build URL for navigating to another appointment while preserving viewDate context
  const buildAppointmentUrl = useCallback((targetApptId: string) => {
    const params = new URLSearchParams()
    // Preserve the viewing context date (use current contextDate)
    params.set('viewDate', formatDateForUrl(contextDate))
    return `/appointments/${targetApptId}?${params.toString()}`
  }, [contextDate])

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
    <div className="flex h-full overflow-hidden">
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
      <div className="relative flex flex-1 overflow-hidden">
        {/* Visit History Column (with patient header) */}
        <AnimatePresence mode="wait" initial={animations.visitHistory.shouldAnimate}>
          <motion.div
            key={animations.visitHistory.key}
            className={`flex flex-col border-r border-border bg-card flex-shrink-0 ${VISIT_HISTORY_WIDTH_CLASS}`}
            initial={animations.visitHistory.shouldAnimate ? animations.visitHistory.initial : false}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={animations.visitHistory.shouldAnimate ? animations.visitHistory.exit : undefined}
            transition={animations.transition}
          >
            {/* Patient Info Header */}
            {appointment.patient && (
              <div className="flex items-center gap-2 px-3 h-14 border-b border-border flex-shrink-0">
                {/* Avatar */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {`${appointment.patient.firstName?.[0] || ''}${appointment.patient.lastName?.[0] || ''}`.toUpperCase()}
                </div>
                {/* Patient name + demographics */}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{getPatientDisplayName(appointment.patient)}</span>
                  <span className="text-xs text-muted-foreground">
                    {appointment.patient.dateOfBirth ? `${Math.floor((Date.now() - new Date(appointment.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yo` : ''}
                    {appointment.patient.sex && appointment.patient.dateOfBirth ? ', ' : ''}
                    {appointment.patient.sex === 'FEMALE' ? 'Female' : appointment.patient.sex === 'MALE' ? 'Male' : ''}
                  </span>
                </div>
              </div>
            )}

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

        {/* Right Content Column (TopTabBar + Tab Content) */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Tab Bar */}
          <TopTabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            appointment={appointment}
            billingData={billingData}
            scheduleData={scheduleData}
            commsData={commsData}
          />

          {/* Tab Content Area */}
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

            {/* Right Panel - content changes based on tab */}
            <div
              className="flex-shrink-0 border-l border-border overflow-hidden"
              style={{ width: APPOINTMENT_INFO_WIDTH }}
            >
              {activeTab === 'medical' && appointment.patient && (
                <PatientContextAdaptive
                  patient={appointment.patient}
                  conditions={appointment.conditions ?? []}
                  contextData={getPatientContextData(appointment.patient.id)}
                  focusedSection={focusedSection}
                  appointmentId={appointmentId}
                  visitHistory={getPatientVisitHistory(appointment.patient.id)}
                />
              )}

              {activeTab === 'billing' && (
                <BillingTab
                  appointmentId={appointmentId}
                  billingData={billingData}
                  billingHistory={billingHistory}
                  viewScope={viewScope}
                  onViewScopeChange={setViewScope}
                />
              )}

              {activeTab === 'comms' && (
                <CommsTab
                  appointmentId={appointmentId}
                  commsData={commsData}
                  patientName={appointment.patient ? getPatientDisplayName(appointment.patient) : 'Patient'}
                  viewScope={viewScope}
                  onViewScopeChange={setViewScope}
                />
              )}
            </div>

            {/* FAB - only visible on medical tab */}
            {activeTab === 'medical' && (
              <FABPanel
                appointment={appointment}
                isExpanded={isFabExpanded}
                onToggleExpanded={() => setIsFabExpanded(!isFabExpanded)}
                timer={timer}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
