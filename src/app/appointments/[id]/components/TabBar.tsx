'use client'

import { ClipboardCheck, CreditCard, Calendar, MessageSquare } from 'lucide-react'
import { type AppointmentWithRelations } from '@/data/mock-data'
import {
  getBillingStatusPreview,
  getScheduleStatusPreview,
  getCommsStatusPreview,
  type BillingData,
  type ScheduleData,
  type CommsData,
} from '@/components/custom'

// =============================================================================
// Types
// =============================================================================

export type TabType = 'medical' | 'billing' | 'schedule' | 'comms'

export interface TabBarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  appointment: AppointmentWithRelations
  billingData: BillingData
  scheduleData: ScheduleData
  commsData: CommsData
}

// =============================================================================
// Helpers
// =============================================================================

function getCompactMedicalStatus(status: string, isSigned: boolean): { text: string; color: string } {
  if (status === 'COMPLETED' && isSigned) {
    return { text: '✓', color: 'text-slate-500' }
  }
  if (status === 'COMPLETED' && !isSigned) {
    return { text: 'Sign', color: 'text-amber-600' }
  }
  if (status === 'IN_PROGRESS') {
    return { text: 'Active', color: 'text-blue-600' }
  }
  if (status === 'CHECKED_IN') {
    return { text: 'Ready', color: 'text-green-600' }
  }
  // SCHEDULED, CANCELLED, NO_SHOW
  return { text: '–', color: 'text-muted-foreground' }
}

function getCompactBillingStatus(billingData: BillingData): { text: string; color: string } {
  const preview = getBillingStatusPreview(billingData)
  // Transform: "$120 · Paid" → "$120 ✓", "$95 · Due" → "$95", "No charges" → "$0"
  if (billingData.status === 'paid') {
    return { text: `$${billingData.totalCharges.toFixed(0)} ✓`, color: 'text-green-600' }
  }
  if (billingData.status === 'no_charges' || billingData.totalCharges === 0) {
    return { text: '$0', color: 'text-muted-foreground' }
  }
  if (billingData.status === 'failed') {
    return { text: `$${billingData.totalCharges.toFixed(0)} !`, color: 'text-red-600' }
  }
  // pending or partial - show amount due
  return { text: `$${billingData.balanceDue.toFixed(0)}`, color: preview.color }
}

function getCompactScheduleStatus(scheduleData: ScheduleData): { text: string; color: string } {
  const preview = getScheduleStatusPreview(scheduleData)
  if (scheduleData.currentAppointment.confirmedAt) {
    return { text: '✓', color: 'text-green-600' }
  }
  if (scheduleData.upcomingAppointments.length > 0) {
    const nextAppt = scheduleData.upcomingAppointments[0]
    const dateStr = nextAppt.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { text: dateStr, color: 'text-muted-foreground' }
  }
  if (scheduleData.followUp) {
    return { text: 'Book', color: 'text-amber-600' }
  }
  return { text: '–', color: preview.color }
}

function getCompactCommsStatus(commsData: CommsData): { text: string; color: string } {
  if (commsData.unreadCount > 0) {
    return { text: `${commsData.unreadCount}`, color: 'text-blue-600' }
  }
  if (commsData.confirmationStatus === 'confirmed') {
    return { text: '✓', color: 'text-green-600' }
  }
  if (commsData.confirmationStatus === 'no_response') {
    return { text: '!', color: 'text-red-600' }
  }
  if (commsData.confirmationStatus === 'pending') {
    return { text: '…', color: 'text-amber-600' }
  }
  return { text: '–', color: 'text-muted-foreground' }
}

// =============================================================================
// Tab Bar Component
// =============================================================================

export function TabBar({
  activeTab,
  onTabChange,
  appointment,
  billingData,
  scheduleData,
  commsData,
}: TabBarProps) {
  const medical = getCompactMedicalStatus(appointment.status, appointment.isSigned)
  const billing = getCompactBillingStatus(billingData)
  const schedule = getCompactScheduleStatus(scheduleData)
  const comms = getCompactCommsStatus(commsData)

  return (
    <div className="h-11 flex border-t border-border bg-background flex-shrink-0">
      {/* Chart Tab */}
      <button
        onClick={() => onTabChange('medical')}
        className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
          activeTab === 'medical'
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <ClipboardCheck className="h-4 w-4" />
        <span className="text-xs">Chart</span>
        <span className={`text-xs font-medium ${activeTab === 'medical' ? '' : medical.color}`}>
          · {medical.text}
        </span>
      </button>

      {/* Bill Tab */}
      <button
        onClick={() => onTabChange('billing')}
        className={`flex-1 flex items-center justify-center gap-1.5 border-l border-border transition-colors ${
          activeTab === 'billing'
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <CreditCard className="h-4 w-4" />
        <span className="text-xs">Bill</span>
        <span className={`text-xs font-medium ${activeTab === 'billing' ? '' : billing.color}`}>
          · {billing.text}
        </span>
      </button>

      {/* Appt Tab */}
      <button
        onClick={() => onTabChange('schedule')}
        className={`flex-1 flex items-center justify-center gap-1.5 border-l border-border transition-colors ${
          activeTab === 'schedule'
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <Calendar className="h-4 w-4" />
        <span className="text-xs">Appt</span>
        <span className={`text-xs font-medium ${activeTab === 'schedule' ? '' : schedule.color}`}>
          · {schedule.text}
        </span>
      </button>

      {/* Msgs Tab */}
      <button
        onClick={() => onTabChange('comms')}
        className={`flex-1 flex items-center justify-center gap-1.5 border-l border-border transition-colors ${
          activeTab === 'comms'
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="text-xs">Msgs</span>
        <span className={`text-xs font-medium ${activeTab === 'comms' ? '' : comms.color}`}>
          · {comms.text}
        </span>
      </button>
    </div>
  )
}
