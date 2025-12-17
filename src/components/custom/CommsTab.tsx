'use client'

import { useState } from 'react'
import { ScrollableArea } from './ScrollableArea'
import { SegmentedToggle, type ViewScope } from './SegmentedToggle'
import { Bell, Check, AlertTriangle, Send, Plus, Clock, X, MessageSquare } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

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
  appointmentId?: string // For filtering to "this visit"
}

interface PractitionerNote {
  id: string
  content: string
  createdAt: Date
  createdBy: string
  isPinned?: boolean
  visitId?: string // For filtering to "this visit"
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
  viewScope: ViewScope
  onViewScopeChange: (scope: ViewScope) => void
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
// This Visit Content
// =============================================================================

function ThisVisitContent({
  commsData,
  appointmentId,
}: {
  commsData: CommsData
  appointmentId: string
}) {
  const { messages, notes, confirmationStatus, reminderSentAt, confirmedAt, unreadCount } = commsData

  // Filter to this visit only
  const visitMessages = messages.filter(m => !m.appointmentId || m.appointmentId === appointmentId)
  const visitNotes = notes.filter(n => !n.visitId || n.visitId === appointmentId)

  // Sort notes: pinned first, then by date
  const sortedNotes = [...visitNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

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
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Confirmation Status */}
      <section className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3">
          <ConfirmationBadge status={confirmationStatus} />
          {confirmedAt && (
            <span className="text-xs text-muted-foreground">
              {formatDate(confirmedAt)} at {formatTime(confirmedAt)}
            </span>
          )}
        </div>
      </section>

      {/* Status Timeline */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3 py-2 border-b border-border">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">
            {reminderSentAt ? (
              <>
                Reminder sent {formatDate(reminderSentAt)} at {formatTime(reminderSentAt)}
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
      </section>

      {/* Messages for this visit */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Messages
        </h3>
        {visitMessages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {visitMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No messages for this visit</p>
          </div>
        )}
      </section>

      {/* Notes for this visit */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Notes
          </h3>
          <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80">
            <Plus className="h-3.5 w-3.5" />
            Add Note
          </button>
        </div>

        {sortedNotes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {sortedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="text-sm text-muted-foreground">No notes for this visit</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add notes about this appointment
            </p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
          <Send className="h-4 w-4" />
          Send Reminder
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
          <Send className="h-4 w-4" />
          Send Intake Form
        </button>
      </section>
    </div>
  )
}

// =============================================================================
// All Comms Content
// =============================================================================

function AllCommsContent({ commsData }: { commsData: CommsData }) {
  const { messages, notes, unreadCount } = commsData

  // Sort notes: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* All Messages */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          All Messages
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        {messages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        )}
      </section>

      {/* All Notes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            All Notes ({notes.length})
          </h3>
          <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80">
            <Plus className="h-3.5 w-3.5" />
            Add Note
          </button>
        </div>

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
      </section>

      {/* Quick Actions */}
      <section className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
          <Send className="h-4 w-4" />
          Send Reminder
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
          <Send className="h-4 w-4" />
          Send Intake Form
        </button>
      </section>
    </div>
  )
}

// =============================================================================
// CommsTab Component
// =============================================================================

export function CommsTab({ appointmentId, commsData, patientName, viewScope, onViewScopeChange }: CommsTabProps) {
  const { confirmationStatus } = commsData

  return (
    <div className="flex flex-col h-full">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Communications</h2>
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
              <ThisVisitContent commsData={commsData} appointmentId={appointmentId} />
            ) : (
              <AllCommsContent commsData={commsData} />
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
