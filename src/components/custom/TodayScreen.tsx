'use client'

import { useState } from 'react'
import { Timeline } from './Timeline'
import { PatientCards } from './PatientCards'
import type { AppointmentWithRelations } from '@/data/mock-data'

export function TodayScreen() {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(
    null
  )

  const handleAppointmentClick = (appointment: AppointmentWithRelations) => {
    setSelectedAppointment(appointment)
    // TODO: Navigate to appointment/patient view or open modal
    console.log('Selected appointment:', appointment.id, appointment.patient?.firstName)
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Timeline - Left 2/3 */}
      <div className="w-2/3">
        <Timeline onAppointmentClick={handleAppointmentClick} />
      </div>

      {/* Patient Cards - Right 1/3 */}
      <div className="w-1/3">
        <PatientCards onAppointmentClick={handleAppointmentClick} />
      </div>
    </div>
  )
}
