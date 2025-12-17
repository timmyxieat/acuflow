'use client'

import { ClipboardCheck, CreditCard, Calendar, MessageSquare, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/dev-time'
import { getStatusDisplay, type AppointmentWithRelations } from '@/data/mock-data'
import { AppointmentStatus } from '@/generated/prisma/browser'
import { getStatusColor } from '@/lib/constants'
import {
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

// =============================================================================
// Status Track Component (Backwards N pattern)
// =============================================================================

// Status order: 0=Scheduled, 1=Checked-in, 2=In-progress, 3=Unsigned, 4=Completed
function getStatusIndex(status: AppointmentStatus, isSigned: boolean): number {
  if (status === AppointmentStatus.SCHEDULED) return 0
  if (status === AppointmentStatus.CHECKED_IN) return 1
  if (status === AppointmentStatus.IN_PROGRESS) return 2
  if (status === AppointmentStatus.COMPLETED && !isSigned) return 3 // Unsigned
  if (status === AppointmentStatus.COMPLETED && isSigned) return 4 // Completed
  return 0 // Default for CANCELLED, NO_SHOW
}

function StatusTrack({ status, isSigned }: { status: AppointmentStatus; isSigned: boolean }) {
  const currentIndex = getStatusIndex(status, isSigned)
  const statusColor = getStatusColor(status, isSigned)

  // Positions for the 5 dots in the backwards-N pattern
  // Left column: Scheduled (top), Checked-in (bottom)
  // Center: In-progress
  // Right column: Unsigned (top), Completed (bottom)
  const dots = [
    { x: 4, y: 4, label: 'Scheduled' },      // 0: top-left
    { x: 4, y: 20, label: 'Checked In' },    // 1: bottom-left
    { x: 24, y: 12, label: 'In Progress' },  // 2: center
    { x: 44, y: 4, label: 'Unsigned' },      // 3: top-right
    { x: 44, y: 20, label: 'Completed' },    // 4: bottom-right
  ]

  // Lines connecting the dots (following the flow)
  const lines = [
    { from: 0, to: 1 }, // Scheduled → Checked-in (vertical)
    { from: 1, to: 2 }, // Checked-in → In-progress (diagonal up)
    { from: 2, to: 3 }, // In-progress → Unsigned (diagonal up)
    { from: 3, to: 4 }, // Unsigned → Completed (vertical)
  ]

  const dotRadius = 3
  const activeDotRadius = 4

  return (
    <svg width="48" height="24" viewBox="0 0 48 24" className="flex-shrink-0">
      {/* Draw lines */}
      {lines.map((line, i) => {
        const from = dots[line.from]
        const to = dots[line.to]
        const isCompleted = currentIndex >= line.to
        const isActive = currentIndex >= line.from && currentIndex < line.to
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isCompleted ? '#d1d5db' : isActive ? statusColor : '#e5e7eb'}
            strokeWidth={1.5}
          />
        )
      })}

      {/* Draw dots */}
      {dots.map((dot, i) => {
        const isCurrent = i === currentIndex
        const isCompleted = i < currentIndex
        return (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={isCurrent ? activeDotRadius : dotRadius}
            fill={isCurrent ? statusColor : isCompleted ? '#d1d5db' : '#e5e7eb'}
            className="transition-all duration-200"
          />
        )
      })}
    </svg>
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
}: TopTabBarProps) {
  const medical = getCompactMedicalStatus(appointment.status, appointment.isSigned)

  // Date and time info
  const appointmentDate = new Date(appointment.scheduledStart)
  const dateStr = appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const relativeDay = getRelativeDay(appointmentDate)
  const timeRange = `${formatTime(appointment.scheduledStart)} - ${formatTime(appointment.scheduledEnd)}`

  // Status info
  const statusDisplay = getStatusDisplay(appointment.status, appointment.isSigned)
  const statusColor = getStatusColor(appointment.status, appointment.isSigned)

  // Appt tab context - confirmation or follow-up status
  const apptContext = scheduleData.currentAppointment.confirmedAt
    ? 'Confirmed'
    : scheduleData.followUp
      ? `Follow-up: ${scheduleData.followUp.recommendedInterval}`
      : 'Not confirmed'

  // Tab definitions with contextual info
  const tabs: {
    key: TabType
    label: string
    icon: typeof ClipboardCheck
    context: string
  }[] = [
    {
      key: 'medical',
      label: 'Chart',
      icon: ClipboardCheck,
      context: medical.text === '✓' ? 'Signed' : medical.text === 'Sign' ? 'Needs signature' : medical.text === 'Active' ? 'In progress' : medical.text === 'Ready' ? 'Patient ready' : 'Not started',
    },
    {
      key: 'billing',
      label: 'Bill',
      icon: CreditCard,
      context: billingData.status === 'paid' ? `$${billingData.totalCharges.toFixed(0)} paid` : billingData.status === 'no_charges' ? 'No charges' : `$${billingData.balanceDue.toFixed(0)} due`,
    },
    {
      key: 'schedule',
      label: 'Appt',
      icon: Calendar,
      context: apptContext,
    },
    {
      key: 'comms',
      label: 'Msgs',
      icon: MessageSquare,
      context: commsData.confirmationStatus === 'confirmed' ? 'Confirmed' : commsData.confirmationStatus === 'pending' ? 'Awaiting response' : commsData.unreadCount > 0 ? `${commsData.unreadCount} unread` : 'No messages',
    },
  ]

  // Determine available actions based on current status
  const canComplete = appointment.status === AppointmentStatus.IN_PROGRESS
  const canSign = appointment.status === AppointmentStatus.COMPLETED && !appointment.isSigned

  return (
    <div className="flex border-b border-border bg-background flex-shrink-0">
      {/* Left: Date/Time + Status in one container */}
      <div className="flex items-center justify-between px-3 border-r border-border min-w-[200px]">
        {/* Date + Time on left */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold">{dateStr}</span>
            <span className="text-muted-foreground">· {relativeDay}</span>
          </div>
          <span className="text-xs text-muted-foreground">{timeRange}</span>
        </div>

        {/* Status dropdown on right */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 hover:bg-muted/70 transition-colors ml-3">
              <div
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              <span className="text-xs font-medium">{statusDisplay.label}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            {/* Status track visualization */}
            <div className="flex justify-center mb-3">
              <StatusTrack status={appointment.status} isSigned={appointment.isSigned} />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                disabled={!canComplete}
              >
                Complete
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 text-xs"
                disabled={!canSign}
              >
                Sign
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Right: Tabs (equal width) */}
      {tabs.map((tab, index) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors border-l border-border ${
              isActive
                ? 'text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {/* Row 1: Icon + Label */}
            <div className="flex items-center gap-1.5">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </div>
            {/* Row 2: Contextual info */}
            <span className={`text-xs mt-0.5 ${isActive ? 'text-primary/70' : 'text-muted-foreground'}`}>
              {tab.context}
            </span>
          </button>
        )
      })}
    </div>
  )
}
