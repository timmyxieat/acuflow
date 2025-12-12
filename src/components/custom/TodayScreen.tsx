'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Timeline } from './Timeline'
import { PatientCards } from './PatientCards'
import { useTransition } from '@/contexts/TransitionContext'
import type { AppointmentWithRelations } from '@/data/mock-data'

// Width constants
const EXPANDED_WIDTH = 200 // pixels for animation
const COLLAPSED_WIDTH = 72

export function TodayScreen() {
  const router = useRouter()
  const { startTransition } = useTransition()
  const [hoveredAppointmentId, setHoveredAppointmentId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Single click navigates directly to appointment with transition
  const handleAppointmentClick = (appointment: AppointmentWithRelations, rect?: DOMRect) => {
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
      {/* Patient Cards - animated width (expands from compact when returning) */}
      <motion.div
        className="flex flex-col relative flex-shrink-0"
        initial={{ width: 64 }}
        animate={{ width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="h-full overflow-hidden">
          <PatientCards
            onAppointmentClick={handleAppointmentClick}
            onAppointmentHover={handleAppointmentHover}
            hoveredAppointmentId={hoveredAppointmentId}
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

      {/* Timeline - slides in from the left when returning */}
      <motion.div
        className="flex-1"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
          delay: 0.05,
        }}
      >
        <Timeline
          onAppointmentClick={handleAppointmentClick}
          onAppointmentHover={handleAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
        />
      </motion.div>
    </div>
  )
}
