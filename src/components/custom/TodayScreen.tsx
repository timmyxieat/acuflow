'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Timeline } from './Timeline'
import { PatientCards } from './PatientCards'
import type { AppointmentWithRelations } from '@/data/mock-data'

export function TodayScreen() {
  const router = useRouter()
  const [hoveredAppointmentId, setHoveredAppointmentId] = useState<string | null>(null)

  // Single click navigates directly to appointment
  const handleAppointmentClick = (appointment: AppointmentWithRelations) => {
    router.push(`/appointments/${appointment.id}`)
  }

  const handleAppointmentHover = (appointmentId: string | null) => {
    setHoveredAppointmentId(appointmentId)
  }

  return (
    <div className="flex h-full">
      {/* Patient Cards - width calculated so rail (48px) + cards ≈ 20% of viewport */}
      <div className="w-[calc(20vw-48px)] min-w-[180px] max-w-[240px] flex flex-col">
        <div className="h-full">
          <PatientCards
            onAppointmentClick={handleAppointmentClick}
            onAppointmentHover={handleAppointmentHover}
            hoveredAppointmentId={hoveredAppointmentId}
          />
        </div>
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-border" />

      {/* Timeline - takes remaining space */}
      <div className="flex-1">
        <Timeline
          onAppointmentClick={handleAppointmentClick}
          onAppointmentHover={handleAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
        />
      </div>
    </div>
  )
}
