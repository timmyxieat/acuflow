'use client'

import { useState } from 'react'
import { Timeline } from './Timeline'
import { PatientCards } from './PatientCards'
import { AppointmentPreview } from './AppointmentPreview'
import type { AppointmentWithRelations } from '@/data/mock-data'

export function TodayScreen() {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(
    null
  )

  const handleAppointmentClick = (appointment: AppointmentWithRelations) => {
    // Toggle selection - clicking same appointment unselects it
    if (selectedAppointment?.id === appointment.id) {
      setSelectedAppointment(null)
    } else {
      setSelectedAppointment(appointment)
    }
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

  return (
    <div className="flex h-full">
      {/* Timeline - Left 2/3 */}
      <div className="w-2/3" onClick={handleTimelineBackgroundClick}>
        <Timeline
          onAppointmentClick={handleAppointmentClick}
          selectedAppointmentId={selectedAppointment?.id}
        />
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-border" />

      {/* Right 1/3 - Patient Cards or Appointment Preview */}
      <div className="w-1/3">
        {selectedAppointment ? (
          <AppointmentPreview
            appointment={selectedAppointment}
            onClose={handleClosePreview}
          />
        ) : (
          <PatientCards onAppointmentClick={handleAppointmentClick} />
        )}
      </div>
    </div>
  )
}
