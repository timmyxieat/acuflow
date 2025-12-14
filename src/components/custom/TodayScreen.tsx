'use client'

import { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Timeline } from './Timeline'
import { PatientCards } from './PatientCards'
import { useTransition } from '@/contexts/TransitionContext'
import { useHoverWithKeyboardNav } from '@/hooks/useHoverWithKeyboardNav'
import { SIDEBAR_ANIMATION } from '@/lib/animations'
import { getAppointmentsByStatus, type AppointmentWithRelations } from '@/data/mock-data'

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
  } = useTransition()
  const [, setHoveredAppointmentId, effectiveHoveredId] = useHoverWithKeyboardNav<string>()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Dynamic expanded width (calculated client-side)
  const [expandedWidth, setExpandedWidth] = useState(SIDEBAR_ANIMATION.getExpandedWidth())

  // Recalculate width on window resize
  useLayoutEffect(() => {
    const updateWidth = () => setExpandedWidth(SIDEBAR_ANIMATION.getExpandedWidth())
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Read selection from URL query param on mount
  useEffect(() => {
    const selectedFromUrl = searchParams.get('selected')
    if (selectedFromUrl && !selectedAppointmentId) {
      setSelectedAppointmentId(selectedFromUrl)
    }
  }, [searchParams, selectedAppointmentId, setSelectedAppointmentId])

  // Update URL when selection changes (for keyboard navigation)
  const updateUrlSelection = useCallback((appointmentId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (appointmentId) {
      params.set('selected', appointmentId)
    } else {
      params.delete('selected')
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/'
    router.replace(newUrl, { scroll: false })
  }, [searchParams, router])

  // Get flat ordered list of all appointment IDs (same order as PatientCards)
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

  // Single click navigates directly to appointment with transition
  const handleAppointmentClick = (appointment: AppointmentWithRelations, rect?: DOMRect) => {
    // Store selection in context so it persists when navigating back
    setSelectedAppointmentId(appointment.id)
    if (rect) {
      startTransition(rect, 'today')
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
      updateUrlSelection(null)
    }
    // Enter: if card selected, go to appointment; if no card, just select the last one
    if (event.key === 'Enter') {
      if (selectedAppointmentId) {
        // Card selected: navigate to appointment detail
        router.push(`/appointments/${selectedAppointmentId}`)
      } else if (lastSelectedAppointmentId) {
        // No card selected: just highlight the last selected card (don't navigate)
        setSelectedAppointmentId(lastSelectedAppointmentId)
        updateUrlSelection(lastSelectedAppointmentId)
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
        updateUrlSelection(startId)
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
      updateUrlSelection(newId)
    }
  }, [selectedAppointmentId, setSelectedAppointmentId, lastSelectedAppointmentId, router, orderedAppointmentIds, setKeyboardNavMode, updateUrlSelection])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Patient Cards - animated width (responsive: 20vw, min 180px, max 280px) */}
      <motion.div
        className={`flex flex-col relative flex-shrink-0 ${!isCollapsed ? PANEL_WIDTH_CLASS : ''}`}
        initial={{ width: expandedWidth }}
        animate={{
          width: isCollapsed
            ? SIDEBAR_ANIMATION.collapsedWidth
            : expandedWidth
        }}
        transition={SIDEBAR_ANIMATION.transition}
      >
        <div className="h-full overflow-hidden">
          <PatientCards
            onAppointmentClick={handleAppointmentClick}
            onAppointmentHover={handleAppointmentHover}
            hoveredAppointmentId={effectiveHoveredId}
            selectedAppointmentId={selectedAppointmentId ?? undefined}
            compact={isCollapsed}
          />
        </div>

        {/* Collapse/Expand toggle button */}
        <button
          onClick={toggleCollapsed}
          className="absolute top-1/2 -right-3 z-10 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-sidebar border border-border shadow-sm hover:bg-muted transition-colors"
          aria-label={isCollapsed ? 'Expand patient cards' : 'Collapse patient cards'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </motion.div>

      {/* Vertical divider */}
      <div className="w-px bg-border" />

      {/* Timeline - always visible */}
      <div className="flex-1">
        <Timeline
          onAppointmentClick={handleAppointmentClick}
          onAppointmentHover={handleAppointmentHover}
          hoveredAppointmentId={effectiveHoveredId}
        />
      </div>
    </div>
  )
}
