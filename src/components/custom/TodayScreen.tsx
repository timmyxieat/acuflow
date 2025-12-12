'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Timeline } from './Timeline'
import { PatientCards } from './PatientCards'
import { AppointmentPreview } from './AppointmentPreview'
import type { AppointmentWithRelations } from '@/data/mock-data'

export function TodayScreen() {
  const router = useRouter()
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(
    null
  )
  const [hoveredAppointmentId, setHoveredAppointmentId] = useState<string | null>(null)

  // Handle Escape key to deselect appointment
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedAppointment) {
        setSelectedAppointment(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAppointment])

  const handleAppointmentClick = (appointment: AppointmentWithRelations) => {
    // Toggle selection - clicking same appointment unselects it
    if (selectedAppointment?.id === appointment.id) {
      setSelectedAppointment(null)
    } else {
      setSelectedAppointment(appointment)
    }
  }

  const handleAppointmentDoubleClick = (appointment: AppointmentWithRelations) => {
    router.push(`/appointments/${appointment.id}`)
  }

  const handleClosePreview = () => {
    setSelectedAppointment(null)
  }

  // Close preview when clicking on the timeline background (not on an appointment)
  const handleTimelineBackgroundClick = () => {
    if (selectedAppointment) {
      setSelectedAppointment(null)
    }
  }

  const handleAppointmentHover = (appointmentId: string | null) => {
    setHoveredAppointmentId(appointmentId)
  }

  return (
    <div className="flex h-full">
      {/* Timeline - Left 2/3 */}
      <div className="w-2/3" onClick={handleTimelineBackgroundClick}>
        <Timeline
          onAppointmentClick={handleAppointmentClick}
          onAppointmentDoubleClick={handleAppointmentDoubleClick}
          onAppointmentHover={handleAppointmentHover}
          selectedAppointmentId={selectedAppointment?.id}
          hoveredAppointmentId={hoveredAppointmentId}
        />
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-border" />

      {/* Right 1/3 - Patient Cards + Appointment Preview (split when selected) */}
      <div className="w-1/3 flex flex-col">
        {/* Patient Cards - full height or top half */}
        <div className={selectedAppointment ? 'h-1/2 border-b border-border' : 'h-full'}>
          <PatientCards
            onAppointmentClick={handleAppointmentClick}
            onAppointmentDoubleClick={handleAppointmentDoubleClick}
            onAppointmentHover={handleAppointmentHover}
            hoveredAppointmentId={hoveredAppointmentId}
            selectedAppointmentId={selectedAppointment?.id}
          />
        </div>

        {/* Appointment Preview - bottom half when selected */}
        {selectedAppointment && (
          <div className="h-1/2">
            <AppointmentPreview
              appointment={selectedAppointment}
              onClose={handleClosePreview}
            />
          </div>
        )}
      </div>
    </div>
  )
}
