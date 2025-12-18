'use client'

import { ClipboardCheck, CreditCard, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatTime } from '@/lib/dev-time'
import { type AppointmentWithRelations } from '@/data/mock-data'
import { AppointmentStatus } from '@/generated/prisma/browser'
import { getStatusColor } from '@/lib/constants'
import {
  type BillingData,
  type ScheduleData,
  type CommsData,
} from '@/components/custom'
import { getRelativeDate, APPOINTMENT_INFO_WIDTH } from '../lib/helpers'

// =============================================================================
// Types
// =============================================================================

export type TabType = 'medical' | 'billing' | 'comms'

export interface TopTabBarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  appointment: AppointmentWithRelations
  billingData: BillingData
  scheduleData: ScheduleData
  commsData: CommsData
  onStatusChange?: (direction: 'prev' | 'next') => void
}

// =============================================================================
// Status Slider Component
// =============================================================================

// Status order for the slider
const STATUS_ORDER = [
  { label: 'Scheduled', status: AppointmentStatus.SCHEDULED, isSigned: false },
  { label: 'Checked In', status: AppointmentStatus.CHECKED_IN, isSigned: false },
  { label: 'In Progress', status: AppointmentStatus.IN_PROGRESS, isSigned: false },
  { label: 'Unsigned', status: AppointmentStatus.COMPLETED, isSigned: false },
  { label: 'Completed', status: AppointmentStatus.COMPLETED, isSigned: true },
]

function getStatusIndex(status: AppointmentStatus, isSigned: boolean): number {
  if (status === AppointmentStatus.SCHEDULED) return 0
  if (status === AppointmentStatus.CHECKED_IN) return 1
  if (status === AppointmentStatus.IN_PROGRESS) return 2
  if (status === AppointmentStatus.COMPLETED && !isSigned) return 3 // Unsigned
  if (status === AppointmentStatus.COMPLETED && isSigned) return 4 // Completed
  return 0 // Default for CANCELLED, NO_SHOW
}

interface StatusSliderProps {
  status: AppointmentStatus
  isSigned: boolean
  onPrev?: () => void
  onNext?: () => void
}

function StatusSlider({ status, isSigned, onPrev, onNext }: StatusSliderProps) {
  const currentIndex = getStatusIndex(status, isSigned)
  const statusColor = getStatusColor(status, isSigned)
  const currentLabel = STATUS_ORDER[currentIndex]?.label ?? 'Unknown'

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < STATUS_ORDER.length - 1

  const prevLabel = canGoPrev ? STATUS_ORDER[currentIndex - 1].label : null
  const nextLabel = canGoNext ? STATUS_ORDER[currentIndex + 1].label : null

  return (
    <div className="flex items-center gap-1">
      {/* Previous button */}
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className={`flex items-center justify-center h-11 w-8 rounded-l-md transition-colors ${
          canGoPrev
            ? 'hover:bg-muted/70 text-muted-foreground hover:text-foreground'
            : 'text-muted-foreground/30 cursor-not-allowed'
        }`}
        title={prevLabel ? `Back to ${prevLabel}` : undefined}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Current status */}
      <div className="flex items-center gap-1.5 px-2 min-w-[100px] justify-center">
        <div
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
        />
        <span className="text-xs font-medium whitespace-nowrap">{currentLabel}</span>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`flex items-center justify-center h-11 w-8 rounded-r-md transition-colors ${
          canGoNext
            ? 'hover:bg-muted/70 text-muted-foreground hover:text-foreground'
            : 'text-muted-foreground/30 cursor-not-allowed'
        }`}
        title={nextLabel ? `Advance to ${nextLabel}` : undefined}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
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
  onStatusChange,
}: TopTabBarProps) {
  // Date and time info
  const appointmentDate = new Date(appointment.scheduledStart)
  const dateStr = appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const relativeDate = getRelativeDate(appointmentDate)
  const timeRange = `${formatTime(appointment.scheduledStart)} - ${formatTime(appointment.scheduledEnd)}`

  // Tab definitions
  const tabs: {
    key: TabType
    label: string
    icon: typeof ClipboardCheck
  }[] = [
    { key: 'medical', label: 'Charting', icon: ClipboardCheck },
    { key: 'billing', label: 'Billing', icon: CreditCard },
    { key: 'comms', label: 'Communication', icon: MessageSquare },
  ]

  return (
    <div className="flex h-14 border-b border-border bg-background flex-shrink-0">
      {/* Left: Date/Time + Status (fills space above SOAP editor) */}
      <div className="flex flex-1 items-center justify-between px-3">
        {/* Date + Time on left */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold">{dateStr}</span>
            <span className="text-muted-foreground">· {relativeDate}</span>
          </div>
          <span className="text-xs text-muted-foreground">{timeRange}</span>
        </div>

        {/* Status slider on right */}
        <StatusSlider
          status={appointment.status}
          isSigned={appointment.isSigned}
          onPrev={() => onStatusChange?.('prev')}
          onNext={() => onStatusChange?.('next')}
        />
      </div>

      {/* Right: Tabs (same width as Patient Context panel) */}
      <div
        className="flex flex-shrink-0 border-l border-border"
        style={{ width: APPOINTMENT_INFO_WIDTH }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center transition-colors ${
                isActive
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium mt-0.5">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
