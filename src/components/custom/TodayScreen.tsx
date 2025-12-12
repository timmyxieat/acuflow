'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Timeline } from './Timeline'
import { PatientCards } from './PatientCards'
import { useTransition } from '@/contexts/TransitionContext'
import { SIDEBAR_ANIMATION, CONTENT_SLIDE_ANIMATION } from '@/lib/animations'
import type { AppointmentWithRelations } from '@/data/mock-data'

export function TodayScreen() {
  const router = useRouter()
  const { startTransition, selectedAppointmentId, setSelectedAppointmentId } = useTransition()
  const [hoveredAppointmentId, setHoveredAppointmentId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Single click navigates directly to appointment with transition
  const handleAppointmentClick = (appointment: AppointmentWithRelations, rect?: DOMRect) => {
    // Store selection in context so it persists when navigating back
    setSelectedAppointmentId(appointment.id)
    if (rect) {
      startTransition(rect, 'today')
    }
    router.push(`/appointments/${appointment.id}`)
  }

  const handleAppointmentHover = (appointmentId: string | null) => {
    setHoveredAppointmentId(appointmentId)
  }

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Patient Cards - animated width */}
      <motion.div
        className="flex flex-col relative flex-shrink-0"
        initial={{ width: SIDEBAR_ANIMATION.expandedWidth }}
        animate={{
          width: isCollapsed
            ? SIDEBAR_ANIMATION.collapsedWidth
            : SIDEBAR_ANIMATION.expandedWidth
        }}
        transition={SIDEBAR_ANIMATION.transition}
      >
        <div className="h-full overflow-hidden">
          <PatientCards
            onAppointmentClick={handleAppointmentClick}
            onAppointmentHover={handleAppointmentHover}
            hoveredAppointmentId={hoveredAppointmentId}
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

      {/* Timeline - slides in/out when expanding/collapsing */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            key="timeline"
            className="flex-1"
            initial={CONTENT_SLIDE_ANIMATION.horizontal.initial}
            animate={CONTENT_SLIDE_ANIMATION.horizontal.animate}
            exit={CONTENT_SLIDE_ANIMATION.horizontal.exit}
            transition={CONTENT_SLIDE_ANIMATION.transition}
          >
            <Timeline
              onAppointmentClick={handleAppointmentClick}
              onAppointmentHover={handleAppointmentHover}
              hoveredAppointmentId={hoveredAppointmentId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
