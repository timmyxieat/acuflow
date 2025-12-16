'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Timeline } from './Timeline'
import { PatientCards } from './PatientCards'
import { useTransition } from '@/contexts/TransitionContext'
import { useHoverWithKeyboardNav } from '@/hooks/useHoverWithKeyboardNav'
import { SIDEBAR_ANIMATION, CONTENT_SLIDE_ANIMATION } from '@/lib/animations'
import { getAppointmentsByStatus, getPatientTodayAppointmentId, type AppointmentWithRelations } from '@/data/mock-data'

// CSS clamp value for consistent responsive width
const PANEL_WIDTH_CLASS = 'w-[clamp(180px,20vw,280px)]'

export function TodayScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    startTransition,
    selectedAppointmentId,
    setSelectedAppointmentId,
    lastSelectedAppointmentId,
    setKeyboardNavMode,
    isTransitioning,
    transitionSource,
    completeTransition,
  } = useTransition()
  const [, setHoveredAppointmentId, effectiveHoveredId] = useHoverWithKeyboardNav<string>()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Read patient selection from URL query param
  // This runs when URL changes (e.g., navigating back from appointment detail)
  useEffect(() => {
    const patientFromUrl = searchParams.get('patient')
    if (patientFromUrl) {
      // Find appointment for this patient
      const targetAppointmentId = getPatientTodayAppointmentId(patientFromUrl)
      if (targetAppointmentId && targetAppointmentId !== selectedAppointmentId) {
        // Only update if the target differs from current selection
        setSelectedAppointmentId(targetAppointmentId)
      }
    }
  }, [searchParams, selectedAppointmentId, setSelectedAppointmentId])

  // Update URL when selection changes (for keyboard navigation)
  // Uses patient ID for persistence across navigation
  const updateUrlSelection = useCallback((appointmentId: string | null, patientId?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (patientId) {
      params.set('patient', patientId)
    } else {
      params.delete('patient')
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/'
    router.replace(newUrl, { scroll: false })
  }, [searchParams, router])

  // Get flat ordered list of all appointments (same order as PatientCards)
  const orderedAppointments = useMemo(() => {
    const grouped = getAppointmentsByStatus()
    return [
      ...grouped.inProgress,
      ...grouped.checkedIn,
      ...grouped.scheduled,
      ...grouped.unsigned,
      ...grouped.completed,
    ]
  }, [])

  // Get flat ordered list of all appointment IDs (same order as PatientCards)
  const orderedAppointmentIds = useMemo(() => {
    return orderedAppointments.map(a => a.id)
  }, [orderedAppointments])

  // Map appointment ID to patient ID for URL updates
  const appointmentToPatientId = useMemo(() => {
    const map = new Map<string, string>()
    orderedAppointments.forEach(a => {
      if (a.patient?.id) {
        map.set(a.id, a.patient.id)
      }
    })
    return map
  }, [orderedAppointments])

  // Single click navigates directly to appointment with transition
  const handleAppointmentClick = (appointment: AppointmentWithRelations, rect?: DOMRect) => {
    // Store selection in context so it persists when navigating back
    setSelectedAppointmentId(appointment.id)
    if (rect) {
      startTransition(rect, 'today', undefined, isCollapsed)
    }
    router.push(`/appointments/${appointment.id}`)
  }

  const handleAppointmentHover = useCallback((appointmentId: string | null) => {
    setHoveredAppointmentId(appointmentId)
  }, [setHoveredAppointmentId])

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => !prev)
  }

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // ESC: deselect the card and stay on Today
    if (event.key === 'Escape' && selectedAppointmentId) {
      setSelectedAppointmentId(null)
      updateUrlSelection(null, undefined)
    }
    // Enter: if card selected, go to appointment; if no card, just select the last one
    if (event.key === 'Enter') {
      if (selectedAppointmentId) {
        // Card selected: navigate to appointment detail
        router.push(`/appointments/${selectedAppointmentId}`)
      } else if (lastSelectedAppointmentId) {
        // No card selected: just highlight the last selected card (don't navigate)
        setSelectedAppointmentId(lastSelectedAppointmentId)
        const patientId = appointmentToPatientId.get(lastSelectedAppointmentId)
        updateUrlSelection(lastSelectedAppointmentId, patientId)
      }
    }
    // Arrow keys: navigate between cards
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault() // Prevent page scroll
      if (orderedAppointmentIds.length === 0) return

      // Enter keyboard nav mode (disables hover highlighting)
      setKeyboardNavMode(true)

      // If nothing selected, start from lastSelected or first/last
      if (!selectedAppointmentId) {
        const startId = lastSelectedAppointmentId ||
          (event.key === 'ArrowDown' ? orderedAppointmentIds[0] : orderedAppointmentIds[orderedAppointmentIds.length - 1])
        setSelectedAppointmentId(startId)
        const patientId = appointmentToPatientId.get(startId)
        updateUrlSelection(startId, patientId)
        return
      }

      const currentIndex = orderedAppointmentIds.indexOf(selectedAppointmentId)

      let newIndex: number
      if (event.key === 'ArrowDown') {
        // Wrap to first if at end
        newIndex = currentIndex >= orderedAppointmentIds.length - 1
          ? 0
          : currentIndex + 1
      } else {
        // Wrap to last if at beginning
        newIndex = currentIndex <= 0
          ? orderedAppointmentIds.length - 1
          : currentIndex - 1
      }

      const newId = orderedAppointmentIds[newIndex]
      setSelectedAppointmentId(newId)
      const patientId = appointmentToPatientId.get(newId)
      updateUrlSelection(newId, patientId)
    }
  }, [selectedAppointmentId, setSelectedAppointmentId, lastSelectedAppointmentId, router, orderedAppointmentIds, setKeyboardNavMode, updateUrlSelection, appointmentToPatientId])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Complete transition after back animation
  useEffect(() => {
    if (isTransitioning && transitionSource === 'back') {
      const timer = setTimeout(() => {
        completeTransition()
      }, 400) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [isTransitioning, transitionSource, completeTransition])

  // Determine if we should animate (coming back from appointment)
  const shouldAnimateBack = isTransitioning && transitionSource === 'back'

  return (
    <div className="flex h-full overflow-hidden">
      {/* Patient Cards - CSS handles expanded width, Framer handles collapse animation */}
      <div
        className={`flex flex-col relative flex-shrink-0 transition-[width] duration-300 ease-out ${
          isCollapsed ? '' : PANEL_WIDTH_CLASS
        }`}
        style={isCollapsed ? { width: SIDEBAR_ANIMATION.collapsedWidth } : undefined}
      >
        <div className="h-full overflow-hidden">
          <PatientCards
            onAppointmentClick={handleAppointmentClick}
            onAppointmentHover={handleAppointmentHover}
            hoveredAppointmentId={effectiveHoveredId}
            selectedAppointmentId={selectedAppointmentId ?? undefined}
            compact={isCollapsed}
            onToggleCompact={toggleCollapsed}
          />
        </div>
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-border" />

      {/* Timeline - animate on back navigation */}
      <motion.div
        className="flex-1"
        initial={shouldAnimateBack ? { x: -100, opacity: 0 } : false}
        animate={{ x: 0, opacity: 1 }}
        transition={CONTENT_SLIDE_ANIMATION.transition}
      >
        <Timeline
          onAppointmentClick={handleAppointmentClick}
          onAppointmentHover={handleAppointmentHover}
          hoveredAppointmentId={effectiveHoveredId}
          selectedAppointmentId={selectedAppointmentId ?? undefined}
        />
      </motion.div>
    </div>
  )
}
