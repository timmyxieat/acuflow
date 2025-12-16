'use client'

import { ScrollableArea } from './ScrollableArea'
import { Calendar, Clock, Check, CalendarPlus, X, ChevronRight } from 'lucide-react'

// =============================================================================
// Type Definitions
// =============================================================================

export interface ScheduleAppointment {
  date: Date
  startTime: Date
  endTime: Date
  type: string
  duration: number
  confirmedAt?: Date
}

export interface FollowUpInfo {
  recommendedInterval: string
  nextAvailable?: Date
}

export interface RecentVisit {
  date: Date
  type: string
  status: string
}

export interface UpcomingAppointment {
  id: string
  date: Date
  time: Date
  type: string
  isConfirmed: boolean
}

export interface ScheduleData {
  currentAppointment: ScheduleAppointment
  followUp?: FollowUpInfo
  recentVisits: RecentVisit[]
  upcomingAppointments: UpcomingAppointment[]
}

interface ScheduleTabProps {
  appointmentId: string
  scheduleData: ScheduleData
  patientName: string
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).toUpperCase()
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// =============================================================================
// ScheduleTab Component
// =============================================================================

export function ScheduleTab({ appointmentId, scheduleData, patientName }: ScheduleTabProps) {
  const { currentAppointment, followUp, recentVisits, upcomingAppointments } = scheduleData

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Schedule</h2>
      </div>

      <ScrollableArea className="flex-1 px-4 py-4" deps={[appointmentId]}>
        <div className="flex flex-col gap-6 max-w-2xl">
          {/* This Appointment Section */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              This Appointment
            </h3>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Date and Time */}
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {formatDate(currentAppointment.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatTime(currentAppointment.startTime)} - {formatTime(currentAppointment.endTime)}
                      <span className="mx-1">·</span>
                      {currentAppointment.duration} min
                    </span>
                  </div>
                  {/* Appointment Type */}
                  <p className="text-sm">{currentAppointment.type}</p>
                </div>

                {/* Confirmation Status */}
                {currentAppointment.confirmedAt && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                    <Check className="h-3 w-3" />
                    <span>Confirmed</span>
                  </div>
                )}
              </div>

              {/* Confirmation timestamp */}
              {currentAppointment.confirmedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Confirmed on {formatDateShort(currentAppointment.confirmedAt)} at {formatTime(currentAppointment.confirmedAt)}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button className="flex-1 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
                  Reschedule
                </button>
                <button className="flex-1 h-10 text-sm font-medium rounded-md border border-border text-destructive hover:bg-destructive/10 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </section>

          {/* Follow-Up Section */}
          {followUp && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Follow-Up
              </h3>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">
                    Recommended: <span className="font-medium">{followUp.recommendedInterval}</span>
                  </span>
                </div>

                {followUp.nextAvailable && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Next available: {formatDate(followUp.nextAvailable)} at {formatTime(followUp.nextAvailable)}
                  </p>
                )}

                <div className="flex gap-2">
                  {followUp.nextAvailable && (
                    <button className="flex-1 h-10 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                      <CalendarPlus className="h-4 w-4" />
                      Schedule {formatDateShort(followUp.nextAvailable)}
                    </button>
                  )}
                  <button className="flex-1 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Pick Time
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Upcoming Appointments Section */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Upcoming Appointments
            </h3>
            {upcomingAppointments.length > 0 ? (
              <div className="rounded-lg border border-border bg-card divide-y divide-border">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatDateShort(appt.date)}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(appt.time)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{appt.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {appt.isConfirmed ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Confirmed
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600">Pending</span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No upcoming appointments</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Schedule a follow-up to continue care
                </p>
                <button className="mt-3 h-9 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mx-auto">
                  <CalendarPlus className="h-4 w-4" />
                  Schedule Appointment
                </button>
              </div>
            )}
          </section>

          {/* Visit History Section */}
          {recentVisits.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Visit History
                </h3>
                <button className="text-xs font-medium text-primary hover:text-primary/80">
                  View All
                </button>
              </div>
              <div className="rounded-lg border border-border bg-card divide-y divide-border">
                {recentVisits.slice(0, 5).map((visit, index) => (
                  <div key={index} className="flex items-center justify-between p-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">{formatDateShort(visit.date)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{visit.type}</span>
                    <span className="text-xs text-muted-foreground ml-4">{visit.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </ScrollableArea>
    </div>
  )
}

// =============================================================================
// Status Preview Helper
// =============================================================================

export interface ScheduleStatusPreview {
  text: string
  color: string
  icon?: 'check' | 'calendar'
}

/**
 * Get a short status preview for the schedule tab bar
 */
export function getScheduleStatusPreview(scheduleData: ScheduleData): ScheduleStatusPreview {
  const { currentAppointment, followUp, upcomingAppointments } = scheduleData

  // If current appointment is confirmed
  if (currentAppointment.confirmedAt) {
    return { text: 'Confirmed', color: 'text-green-600', icon: 'check' }
  }

  // If there's an upcoming appointment
  if (upcomingAppointments.length > 0) {
    const nextAppt = upcomingAppointments[0]
    const dateStr = nextAppt.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { text: `Next: ${dateStr}`, color: 'text-muted-foreground', icon: 'calendar' }
  }

  // If follow-up is recommended but not scheduled
  if (followUp?.nextAvailable) {
    return { text: 'Book follow-up', color: 'text-amber-600' }
  }

  return { text: 'Not scheduled', color: 'text-muted-foreground' }
}
