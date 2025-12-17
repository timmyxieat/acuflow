'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useHeader } from '@/contexts/HeaderContext'
import { useTransition } from '@/contexts/TransitionContext'
import { useSearch } from '@/contexts/SearchContext'
import { CONTENT_SLIDE_ANIMATION } from '@/lib/animations'
import { isToday, formatDateForUrl } from '@/lib/date-utils'

export function Topbar() {
  const router = useRouter()
  const { header } = useHeader()
  const { startTransition, isTransitioning, transitionSource } = useTransition()
  const { openSearch } = useSearch()

  const showBackToToday = header.showDateNavigation && header.selectedDate && !isToday(header.selectedDate)

  // Light orange background when viewing a non-today date
  const headerBgClass = showBackToToday ? 'bg-orange-50' : 'bg-sidebar'

  return (
    <header className={`relative flex h-14 items-center border-b border-border px-3 ${headerBgClass}`}>
      {/* Left area - Back button when on detail pages OR Back to Today when viewing other dates */}
      <div className="flex-shrink-0">
        {header.showBackButton ? (
          <button
            onClick={() => {
              // Trigger back animation
              startTransition({ x: 0, y: 0, width: 0, height: 0 } as DOMRect, 'back')
              // Build URL with patient selection and date preserved
              const params = new URLSearchParams()
              if (header.currentPatientId) {
                params.set('patient', header.currentPatientId)
              }
              if (header.currentDate && !isToday(header.currentDate)) {
                params.set('date', formatDateForUrl(header.currentDate))
              }
              const url = params.toString() ? `/?${params.toString()}` : '/'
              router.push(url)
            }}
            className="flex h-14 items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Today</span>
          </button>
        ) : showBackToToday ? (
          <button
            onClick={() => {
              router.replace('/', { scroll: false })
            }}
            className="flex h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Today</span>
          </button>
        ) : null}
      </div>

      {/* Center area - Navigation controls and title (on Today screen) */}
      {!header.showBackButton && header.showDateNavigation && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
          initial={isTransitioning && transitionSource === 'back' ? { y: -20, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={CONTENT_SLIDE_ANIMATION.transition}
        >
          {/* Navigation row */}
          <div className="flex items-center gap-1">
            {/* Week back */}
            <button
              onClick={() => header.onNavigateDate?.(-7)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Previous week"
            >
              <ChevronsLeft className="h-5 w-5" />
            </button>

            {/* Day back */}
            <button
              onClick={() => header.onNavigateDate?.(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Previous day"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Title - fixed width to prevent arrow shifting */}
            <div className="flex flex-col items-center w-[200px]">
              <h1 className="text-xl font-semibold">{header.title || 'Today'}</h1>
              <span className="text-sm text-muted-foreground">
                {header.subtitle || new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Day forward */}
            <button
              onClick={() => header.onNavigateDate?.(1)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Next day"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Week forward */}
            <button
              onClick={() => header.onNavigateDate?.(7)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Next week"
            >
              <ChevronsRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Center area - Simple title (for non-date-nav pages without back button) */}
      {!header.showBackButton && !header.showDateNavigation && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
          initial={isTransitioning && transitionSource === 'back' ? { y: -20, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={CONTENT_SLIDE_ANIMATION.transition}
        >
          <h1 className="text-xl font-semibold">{header.title || 'Today'}</h1>
          <span className="text-sm text-muted-foreground">
            {header.subtitle || new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </motion.div>
      )}

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
