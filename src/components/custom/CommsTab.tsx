'use client'

import { useState } from 'react'
import { ScrollableArea } from './ScrollableArea'
import { Bell, Check, AlertTriangle, Send, Plus, Clock, X } from 'lucide-react'

// =============================================================================
// Type Definitions
// =============================================================================

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

interface PractitionerNote {
  id: string
  content: string
  createdAt: Date
  createdBy: string
  isPinned?: boolean
}

export type ConfirmationStatus = 'pending' | 'confirmed' | 'no_response' | 'cancelled'

export interface CommsData {
  messages: Message[]
  notes: PractitionerNote[]
  confirmationStatus: ConfirmationStatus
  reminderSentAt?: Date
  confirmedAt?: Date
  unreadCount: number
}

interface CommsTabProps {
  appointmentId: string
  commsData: CommsData
  patientName: string
}

// =============================================================================
// Helper Components
// =============================================================================

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

function NoteCard({ note }: { note: PractitionerNote }) {
  return (
    <div className={`rounded-lg border p-3 ${note.isPinned ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
      {note.isPinned && (
        <span className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1 block">
          Pinned
        </span>
      )}
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

// =============================================================================
// CommsTab Component
// =============================================================================

export function CommsTab({ appointmentId, commsData, patientName }: CommsTabProps) {
  const { messages, notes, confirmationStatus, reminderSentAt, confirmedAt, unreadCount } = commsData
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

  // Sort notes: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header with status */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Communications</h2>
        <ConfirmationBadge status={confirmationStatus} />
      </div>

      {/* Section toggle - Messages vs Notes */}
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
          Notes ({notes.length})
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
            <div className="flex flex-col gap-4">
              {/* Add Note button */}
              <div className="flex justify-end">
                <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80">
                  <Plus className="h-3.5 w-3.5" />
                  Add Note
                </button>
              </div>

              {/* Notes list */}
              {sortedNotes.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {sortedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Add notes about patient preferences, concerns, or follow-up reminders
                  </p>
                </div>
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

// =============================================================================
// Status Preview Helper
// =============================================================================

export interface CommsStatusPreview {
  text: string
  color: string
  icon?: 'check' | 'warning' | 'badge'
}

/**
 * Get a short status preview for the comms tab bar
 */
export function getCommsStatusPreview(commsData: CommsData): CommsStatusPreview {
  const { confirmationStatus, unreadCount } = commsData

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

  if (confirmationStatus === 'cancelled') {
    return { text: 'Cancelled', color: 'text-slate-600' }
  }

  return { text: 'No comms', color: 'text-muted-foreground' }
}
