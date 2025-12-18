'use client'

import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'

interface PatientNavHeaderProps {
  /** Current patient name to display */
  patientName: string
  /** Whether there's a previous patient to navigate to */
  hasPrevious: boolean
  /** Whether there's a next patient to navigate to */
  hasNext: boolean
  /** Called when navigating to previous patient */
  onPrevious: () => void
  /** Called when navigating to next patient */
  onNext: () => void
}

export function PatientNavHeader({
  patientName,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: PatientNavHeaderProps) {
  const { openSearch } = useSearch()

  return (
    <header className="relative flex h-14 items-center border-b border-border px-3 bg-sidebar flex-shrink-0">
      {/* Left area - empty for alignment */}
      <div className="flex-shrink-0 w-[100px]" />

      {/* Center area - Patient name with navigation arrows */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        {/* Previous patient */}
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
            hasPrevious
              ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
              : 'text-muted-foreground/30 cursor-not-allowed'
          }`}
          title={hasPrevious ? 'Previous patient' : 'No previous patient'}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Patient name */}
        <div className="min-w-[200px] flex justify-center">
          <span className="text-sm font-medium">{patientName}</span>
        </div>

        {/* Next patient */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
            hasNext
              ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
              : 'text-muted-foreground/30 cursor-not-allowed'
          }`}
          title={hasNext ? 'Next patient' : 'No next patient'}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Right area - Search button */}
      <div className="ml-auto flex-shrink-0">
        <button
          onClick={openSearch}
          className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Search className="h-4 w-4" />
          <span>Search patients...</span>
          <kbd className="ml-2 hidden rounded bg-muted px-1.5 py-0.5 text-xs font-medium sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  )
}
