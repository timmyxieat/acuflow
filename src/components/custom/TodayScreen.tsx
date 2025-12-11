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
    setSelectedAppointment(appointment)
  }

  const handleClosePreview = () => {
    setSelectedAppointment(null)
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Timeline - Left 2/3 */}
      <div className="w-2/3">
        <Timeline
          onAppointmentClick={handleAppointmentClick}
          selectedAppointmentId={selectedAppointment?.id}
        />
      </div>

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
