'use client'

import { motion } from 'framer-motion'

// =============================================================================
// Types
// =============================================================================

export type ViewScope = 'thisVisit' | 'all'

export interface SegmentedToggleProps {
  value: ViewScope
  onChange: (value: ViewScope) => void
  className?: string
}

// =============================================================================
// SegmentedToggle Component
// =============================================================================

/**
 * iOS-style segmented control for switching between "This Visit" and "All" views.
 * Used in Billing, Schedule, and Comms tabs to toggle scope.
 */
export function SegmentedToggle({ value, onChange, className = '' }: SegmentedToggleProps) {
  return (
    <div className={`inline-flex p-1 rounded-lg bg-muted ${className}`}>
      <button
        onClick={() => onChange('thisVisit')}
        className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          value === 'thisVisit'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {value === 'thisVisit' && (
          <motion.div
            layoutId="segmented-toggle-bg"
            className="absolute inset-0 bg-background rounded-md shadow-sm"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
          />
        )}
        <span className="relative z-10">This Visit</span>
      </button>
      <button
        onClick={() => onChange('all')}
        className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          value === 'all'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {value === 'all' && (
          <motion.div
            layoutId="segmented-toggle-bg"
            className="absolute inset-0 bg-background rounded-md shadow-sm"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
          />
        )}
        <span className="relative z-10">All</span>
      </button>
    </div>
  )
}
