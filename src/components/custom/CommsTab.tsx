'use client'

import { useState } from 'react'
import { ScrollableArea } from './ScrollableArea'
import { MessageSquare, Bell, Check, AlertTriangle, Send, Plus, Clock, Calendar, CalendarPlus, X } from 'lucide-react'

// Message types
type MessageType = 'reminder' | 'confirmation' | 'custom' | 'patient_response'
type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

interface Message {
  id: string
  type: MessageType
  content: string
  timestamp: Date
  status: MessageStatus
  isFromPatient?: boolean
}

interface AppointmentNote {
  id: string
  content: string
  createdAt: Date
  createdBy: string
  isPinned?: boolean
}

interface ScheduleInfo {
  currentAppointment: {
    date: Date
    startTime: Date
    endTime: Date
    type: string
    duration: number
    confirmedAt?: Date
  }
  followUp?: {
    recommendedInterval: string
    nextAvailable?: Date
  }
  recentVisits: Array<{
    date: Date
    type: string
    status: string
  }>
}

export type ConfirmationStatus = 'pending' | 'confirmed' | 'no_response' | 'cancelled'

export interface CommsData {
  messages: Message[]
  notes: AppointmentNote[]
  confirmationStatus: ConfirmationStatus
  reminderSentAt?: Date
  confirmedAt?: Date
  unreadCount: number
  schedule: ScheduleInfo
}

interface CommsTabProps {
  appointmentId: string
  commsData: CommsData
  patientName: string
}

// Confirmation status badge
function ConfirmationBadge({ status }: { status: ConfirmationStatus }) {
  const config = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: Check },
    no_response: { label: 'No Response', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
    cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600', icon: X },
  }

  const { label, color, icon: Icon } = config[status]

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${color}`}>
      {Icon && <Icon className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  )
}

// Message bubble component
function MessageBubble({ message }: { message: Message }) {
  const isFromPatient = message.isFromPatient

  const typeLabel = {
    reminder: 'Reminder',
    confirmation: 'Confirmation Request',
    custom: 'Message',
    patient_response: 'Patient',
  }[message.type]

  return (
    <div className={`flex ${isFromPatient ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isFromPatient
            ? 'bg-muted'
            : 'bg-primary/10'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">
            {typeLabel}
          </span>
          {message.status === 'read' && !isFromPatient && (
            <Check className="h-3 w-3 text-green-600" />
          )}
        </div>
        <p className="text-sm">{message.content}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

// Note card component
function NoteCard({ note }: { note: AppointmentNote }) {
  return (
    <div className={`rounded-lg border p-3 ${note.isPinned ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
      <p className="text-sm">{note.content}</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <span>{note.createdBy}</span>
        <span>·</span>
        <span>
          {note.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  )
}

export function CommsTab({ appointmentId, commsData, patientName }: CommsTabProps) {
  const { messages, notes, confirmationStatus, reminderSentAt, confirmedAt, unreadCount, schedule } = commsData
  const [activeSection, setActiveSection] = useState<'messages' | 'notes'>('messages')

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with status */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Communications</h2>
        <ConfirmationBadge status={confirmationStatus} />
      </div>

      {/* Section toggle */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveSection('messages')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeSection === 'messages'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Messages
          {unreadCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('notes')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeSection === 'notes'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Notes & Schedule
        </button>
      </div>

      <ScrollableArea className="flex-1 px-4 py-4" deps={[appointmentId, activeSection]}>
        <div className="max-w-2xl">
          {activeSection === 'messages' ? (
            <div className="flex flex-col gap-4">
              {/* Status timeline */}
              <div className="flex items-center gap-3 py-2 border-b border-border">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">
                  {reminderSentAt ? (
                    <>
                      Reminder sent{' '}
                      {formatDate(reminderSentAt)} at {formatTime(reminderSentAt)}
                    </>
                  ) : (
                    'No reminder sent'
                  )}
                </div>
              </div>

              {confirmedAt && (
                <div className="flex items-center gap-3 py-2 border-b border-border">
                  <Check className="h-4 w-4 text-green-600" />
                  <div className="text-xs text-green-600">
                    Confirmed {formatDate(confirmedAt)} at {formatTime(confirmedAt)}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No messages yet
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Practitioner Notes */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Practitioner Notes
                  </h3>
                  <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
                {notes.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {notes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-2">
                    No notes yet
                  </p>
                )}
              </section>

              {/* This Appointment */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  This Appointment
                </h3>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(schedule.currentAppointment.date)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(schedule.currentAppointment.startTime)} - {formatTime(schedule.currentAppointment.endTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {schedule.currentAppointment.type} · {schedule.currentAppointment.duration} min
                      </p>
                    </div>
                    {schedule.currentAppointment.confirmedAt && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Check className="h-3 w-3" />
                        <span>Confirmed</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 h-9 text-xs font-medium rounded-md border border-border hover:bg-muted transition-colors">
                      Reschedule
                    </button>
                    <button className="flex-1 h-9 text-xs font-medium rounded-md border border-border text-destructive hover:bg-destructive/10 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </section>

              {/* Schedule Follow-up */}
              {schedule.followUp && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Schedule Follow-up
                  </h3>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-sm">
                      Recommended: <span className="font-medium">{schedule.followUp.recommendedInterval}</span>
                    </p>
                    {schedule.followUp.nextAvailable && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Next available: {formatDate(schedule.followUp.nextAvailable)} at {formatTime(schedule.followUp.nextAvailable)}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {schedule.followUp.nextAvailable && (
                        <button className="flex-1 h-9 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Schedule {formatDate(schedule.followUp.nextAvailable)}
                        </button>
                      )}
                      <button className="flex-1 h-9 text-xs font-medium rounded-md border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Pick Time
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Recent Visits */}
              {schedule.recentVisits.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Recent Visits
                  </h3>
                  <div className="space-y-1">
                    {schedule.recentVisits.map((visit, index) => (
                      <div key={index} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="text-muted-foreground">{formatDate(visit.date)}</span>
                        <span>{visit.type}</span>
                        <span className="text-xs text-muted-foreground">{visit.status}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </ScrollableArea>

      {/* Actions - only show on Messages tab */}
      {activeSection === 'messages' && (
        <div className="flex gap-2 p-3 border-t border-border">
          <button className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
            <Send className="h-4 w-4" />
            Send Message
          </button>
        </div>
      )}
    </div>
  )
}

// Helper to get comms status preview for tab bar
export function getCommsStatusPreview(commsData: CommsData): { text: string; color: string; icon?: 'check' | 'warning' | 'badge' } {
  const { confirmationStatus, unreadCount, schedule } = commsData

  if (unreadCount > 0) {
    return { text: `${unreadCount} unread`, color: 'text-blue-600', icon: 'badge' }
  }

  if (confirmationStatus === 'confirmed') {
    return { text: 'Confirmed', color: 'text-green-600', icon: 'check' }
  }

  if (confirmationStatus === 'no_response') {
    return { text: 'No response', color: 'text-red-600', icon: 'warning' }
  }

  if (confirmationStatus === 'pending') {
    return { text: 'Pending', color: 'text-amber-600' }
  }

  // Show follow-up info if available and confirmed
  if (schedule.followUp?.nextAvailable) {
    const nextDate = schedule.followUp.nextAvailable
    const dateStr = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { text: `Follow-up: ${dateStr}`, color: 'text-muted-foreground' }
  }

  return { text: 'No comms', color: 'text-muted-foreground' }
}
