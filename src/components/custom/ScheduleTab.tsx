'use client'

import { ScrollableArea } from './ScrollableArea'
import { SegmentedToggle, type ViewScope } from './SegmentedToggle'
import { Calendar, Clock, Check, CalendarPlus, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

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
  id: string
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
  viewScope: ViewScope
  onViewScopeChange: (scope: ViewScope) => void
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
// This Visit Content
// =============================================================================

function ThisVisitContent({ scheduleData }: { scheduleData: ScheduleData }) {
  const { currentAppointment, followUp } = scheduleData

  return (
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

      {/* If no follow-up recommended, show a simple book button */}
      {!followUp && (
        <section>
          <button className="w-full h-12 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            Book Follow-up
          </button>
        </section>
      )}
    </div>
  )
}

// =============================================================================
// All Schedule Content
// =============================================================================

function AllScheduleContent({ scheduleData }: { scheduleData: ScheduleData }) {
  const { recentVisits, upcomingAppointments } = scheduleData

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Upcoming Appointments Section */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Upcoming Appointments
        </h3>
        {upcomingAppointments.length > 0 ? (
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {upcomingAppointments.map((appt) => (
              <button
                key={appt.id}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0 text-left">
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
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No upcoming appointments</p>
            <p className="text-xs text-muted-foreground mt-1">
              Schedule a follow-up to continue care
            </p>
          </div>
        )}

        {/* Book new appointment button */}
        <button className="w-full mt-3 h-10 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
          <CalendarPlus className="h-4 w-4" />
          Schedule Appointment
        </button>
      </section>

      {/* Visit History Section */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Visit History
        </h3>

        {recentVisits.length > 0 ? (
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {recentVisits.map((visit) => (
              <button
                key={visit.id}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 text-left">
                  <span className="text-sm font-medium">{formatDateShort(visit.date)}</span>
                  <span className="text-sm text-muted-foreground">{visit.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{visit.status}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">No visit history</p>
            <p className="text-xs text-muted-foreground mt-1">First visit</p>
          </div>
        )}
      </section>
    </div>
  )
}

// =============================================================================
// ScheduleTab Component
// =============================================================================

export function ScheduleTab({ appointmentId, scheduleData, patientName, viewScope, onViewScopeChange }: ScheduleTabProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Schedule</h2>
        <SegmentedToggle value={viewScope} onChange={onViewScopeChange} />
      </div>

      <ScrollableArea className="flex-1 px-4 py-4" deps={[appointmentId, viewScope]}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewScope}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {viewScope === 'thisVisit' ? (
              <ThisVisitContent scheduleData={scheduleData} />
            ) : (
              <AllScheduleContent scheduleData={scheduleData} />
            )}
          </motion.div>
        </AnimatePresence>
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
