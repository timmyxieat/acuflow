'use client'

import { Search } from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'

export function TimelineHeader() {
  const { openSearch } = useSearch()

  return (
    <header className="flex h-14 items-center border-b border-border px-3 bg-background flex-shrink-0">
      {/* Search button only */}
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
