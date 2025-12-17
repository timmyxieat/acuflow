'use client'

import { ClipboardCheck, CreditCard, Calendar, MessageSquare } from 'lucide-react'
import { formatTime } from '@/lib/dev-time'
import { type AppointmentWithRelations } from '@/data/mock-data'
import {
  getBillingStatusPreview,
  getScheduleStatusPreview,
  getCommsStatusPreview,
  type BillingData,
  type ScheduleData,
  type CommsData,
} from '@/components/custom'
import { getRelativeDay } from '../lib/helpers'

// =============================================================================
// Types
// =============================================================================

export type TabType = 'medical' | 'billing' | 'schedule' | 'comms'

export interface TopTabBarProps {
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
  if (billingData.status === 'paid') {
    return { text: `$${billingData.totalCharges.toFixed(0)} ✓`, color: 'text-green-600' }
  }
  if (billingData.status === 'no_charges' || billingData.totalCharges === 0) {
    return { text: '$0', color: 'text-muted-foreground' }
  }
  if (billingData.status === 'failed') {
    return { text: `$${billingData.totalCharges.toFixed(0)} !`, color: 'text-red-600' }
  }
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
// Top Tab Bar Component
// =============================================================================

export function TopTabBar({
  activeTab,
  onTabChange,
  appointment,
  billingData,
  scheduleData,
  commsData,
}: TopTabBarProps) {
  const medical = getCompactMedicalStatus(appointment.status, appointment.isSigned)
  const billing = getCompactBillingStatus(billingData)
  const schedule = getCompactScheduleStatus(scheduleData)
  const comms = getCompactCommsStatus(commsData)

  // Date and time info
  const appointmentDate = new Date(appointment.scheduledStart)
  const dateStr = appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const relativeDay = getRelativeDay(appointmentDate)
  const timeRange = `${formatTime(appointment.scheduledStart)} - ${formatTime(appointment.scheduledEnd)}`

  return (
    <div className="h-14 flex items-center justify-between border-b border-border bg-background px-3 flex-shrink-0">
      {/* Left side: Date + Time */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold">{dateStr}</span>
          <span className="text-muted-foreground">· {relativeDay}</span>
        </div>
        <span className="text-xs text-muted-foreground">{timeRange}</span>
      </div>

      {/* Right side: Tabs */}
      <div className="flex items-center">
        {/* Chart Tab */}
        <button
          onClick={() => onTabChange('medical')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'medical'
              ? 'text-primary bg-primary/10'
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'billing'
              ? 'text-primary bg-primary/10'
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'schedule'
              ? 'text-primary bg-primary/10'
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'comms'
              ? 'text-primary bg-primary/10'
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
    </div>
  )
}
