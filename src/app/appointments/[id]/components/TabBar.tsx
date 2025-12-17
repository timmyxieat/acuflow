'use client'

import { ClipboardCheck, CreditCard, Calendar, MessageSquare } from 'lucide-react'
import { getStatusDisplay, type AppointmentWithRelations } from '@/data/mock-data'
import { getStatusColor } from '@/lib/constants'
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
  const medicalStatus = getStatusDisplay(appointment.status, appointment.isSigned)
  const billingPreview = getBillingStatusPreview(billingData)
  const schedulePreview = getScheduleStatusPreview(scheduleData)
  const commsPreview = getCommsStatusPreview(commsData)

  return (
    <div className="h-11 flex border-t border-border bg-background flex-shrink-0">
      {/* Medical Tab */}
      <button
        onClick={() => onTabChange('medical')}
        className={`flex-1 flex items-center justify-center gap-2 transition-colors ${
          activeTab === 'medical'
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <ClipboardCheck className="h-4 w-4" />
        <span
          className="text-xs font-medium"
          style={{ color: activeTab === 'medical' ? undefined : getStatusColor(appointment.status, appointment.isSigned) }}
        >
          {medicalStatus.label}
        </span>
      </button>

      {/* Billing Tab */}
      <button
        onClick={() => onTabChange('billing')}
        className={`flex-1 flex items-center justify-center gap-2 border-l border-border transition-colors ${
          activeTab === 'billing'
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <CreditCard className="h-4 w-4" />
        <span className={`text-xs font-medium ${activeTab === 'billing' ? '' : billingPreview.color}`}>
          {billingPreview.text}
        </span>
      </button>

      {/* Schedule Tab */}
      <button
        onClick={() => onTabChange('schedule')}
        className={`flex-1 flex items-center justify-center gap-2 border-l border-border transition-colors ${
          activeTab === 'schedule'
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <Calendar className="h-4 w-4" />
        <span className={`text-xs font-medium ${activeTab === 'schedule' ? '' : schedulePreview.color}`}>
          {schedulePreview.text}
        </span>
      </button>

      {/* Comms Tab */}
      <button
        onClick={() => onTabChange('comms')}
        className={`flex-1 flex items-center justify-center gap-2 border-l border-border transition-colors ${
          activeTab === 'comms'
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <MessageSquare className="h-4 w-4" />
        <span className={`text-xs font-medium ${activeTab === 'comms' ? '' : commsPreview.color}`}>
          {commsPreview.text}
        </span>
      </button>
    </div>
  )
}
