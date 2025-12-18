'use client'

import { useState, useRef, useEffect } from 'react'
import { ClipboardCheck, CreditCard, MessageSquare, ChevronDown, Check } from 'lucide-react'
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
  onStatusChange?: (newStatus: AppointmentStatus, newIsSigned: boolean) => void
}

// =============================================================================
// Status Dropdown & Action Button Components
// =============================================================================

// Status order for dropdown and action button
const STATUS_ORDER = [
  { label: 'Scheduled', status: AppointmentStatus.SCHEDULED, isSigned: false },
  { label: 'Checked In', status: AppointmentStatus.CHECKED_IN, isSigned: false },
  { label: 'In Progress', status: AppointmentStatus.IN_PROGRESS, isSigned: false },
  { label: 'Unsigned', status: AppointmentStatus.COMPLETED, isSigned: false },
  { label: 'Completed', status: AppointmentStatus.COMPLETED, isSigned: true },
]

// Action button labels for advancing to next status
const NEXT_ACTION_LABELS: Record<string, string> = {
  'Scheduled': 'Check In',
  'Checked In': 'Start',
  'In Progress': 'Complete',
  'Unsigned': 'Sign',
}

function getStatusIndex(status: AppointmentStatus, isSigned: boolean): number {
  if (status === AppointmentStatus.SCHEDULED) return 0
  if (status === AppointmentStatus.CHECKED_IN) return 1
  if (status === AppointmentStatus.IN_PROGRESS) return 2
  if (status === AppointmentStatus.COMPLETED && !isSigned) return 3 // Unsigned
  if (status === AppointmentStatus.COMPLETED && isSigned) return 4 // Completed
  return 0 // Default for CANCELLED, NO_SHOW
}

interface StatusControlsProps {
  status: AppointmentStatus
  isSigned: boolean
  onStatusChange?: (newStatus: AppointmentStatus, newIsSigned: boolean) => void
}

function StatusControls({ status, isSigned, onStatusChange }: StatusControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentIndex = getStatusIndex(status, isSigned)
  const statusColor = getStatusColor(status, isSigned)
  const currentLabel = STATUS_ORDER[currentIndex]?.label ?? 'Unknown'

  const canAdvance = currentIndex < STATUS_ORDER.length - 1
  const nextActionLabel = NEXT_ACTION_LABELS[currentLabel]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStatusSelect = (index: number) => {
    const selected = STATUS_ORDER[index]
    onStatusChange?.(selected.status, selected.isSigned)
    setIsOpen(false)
  }

  const handleAdvance = () => {
    if (canAdvance) {
      const next = STATUS_ORDER[currentIndex + 1]
      onStatusChange?.(next.status, next.isSigned)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status dropdown - 44px touch target with 8px visual padding */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-11 flex items-center"
        >
          <span className="flex items-center justify-between gap-1.5 w-[100px] px-2 py-2 rounded-md hover:bg-muted/70 transition-colors">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              <span className="text-xs font-medium whitespace-nowrap">{currentLabel}</span>
            </span>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md py-1 z-50 min-w-[140px]">
            {STATUS_ORDER.map((item, index) => {
              const isCurrentStatus = index === currentIndex
              const itemColor = getStatusColor(item.status, item.isSigned)
              return (
                <button
                  key={`${item.status}-${item.isSigned}`}
                  onClick={() => handleStatusSelect(index)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/70 transition-colors ${
                    isCurrentStatus ? 'bg-muted/50' : ''
                  }`}
                >
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: itemColor }}
                  />
                  <span className="text-xs font-medium flex-1">{item.label}</span>
                  {isCurrentStatus && <Check className="h-3 w-3 text-primary" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Action button to advance - 44px touch target with 8px visual padding */}
      {canAdvance && nextActionLabel && (
        <button
          onClick={handleAdvance}
          className="h-11 flex items-center"
        >
          <span className="flex items-center justify-center gap-1.5 w-[90px] px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <span>{nextActionLabel}</span>
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getStatusColor(STATUS_ORDER[currentIndex + 1].status, STATUS_ORDER[currentIndex + 1].isSigned) }}
            />
          </span>
        </button>
      )}
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

        {/* Status controls on right */}
        <StatusControls
          status={appointment.status}
          isSigned={appointment.isSigned}
          onStatusChange={onStatusChange}
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
