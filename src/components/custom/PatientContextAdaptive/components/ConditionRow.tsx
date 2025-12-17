'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import type { PatientCondition } from '@/data/mock-data'
import {
  CONDITION_STATUSES,
  CONDITION_STATUS_COLORS,
  type ConditionStatus,
} from '../types'

// =============================================================================
// Props
// =============================================================================

interface ConditionRowProps {
  condition: PatientCondition
  onStatusChange?: (conditionId: string, newStatus: string) => void
}

// =============================================================================
// Component
// =============================================================================

export function ConditionRow({ condition, onStatusChange }: ConditionRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<ConditionStatus>(
    condition.status as ConditionStatus
  )
  const dropdownRef = useRef<HTMLDivElement>(null)
  const colors = CONDITION_STATUS_COLORS[currentStatus] || CONDITION_STATUS_COLORS.ACTIVE

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleStatusSelect = (status: ConditionStatus) => {
    setCurrentStatus(status)
    setIsOpen(false)
    onStatusChange?.(condition.id, status)
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-foreground truncate flex-1">{condition.name}</span>
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity`}
        >
          {currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase()}
          <ChevronDown className="h-2.5 w-2.5" />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[100px]">
            {CONDITION_STATUSES.map((status) => {
              const statusColors = CONDITION_STATUS_COLORS[status]
              return (
                <button
                  key={status}
                  onClick={() => handleStatusSelect(status)}
                  className={`w-full text-left px-2 py-1 text-[10px] hover:bg-muted transition-colors ${
                    status === currentStatus ? 'font-medium' : ''
                  }`}
                >
                  <span className={`inline-block px-1 py-0.5 rounded ${statusColors.bg} ${statusColors.text}`}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
