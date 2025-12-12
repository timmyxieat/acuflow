'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ScrollPosition {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

export interface ScrollableAreaRef {
  scrollTo: (options: ScrollToOptions) => void
  getScrollPosition: () => ScrollPosition | null
}

interface ScrollableAreaProps {
  children: ReactNode
  className?: string
  /** Additional dependencies that should trigger a scroll check when changed */
  deps?: unknown[]
  /** Callback when scroll position changes */
  onScroll?: (position: ScrollPosition) => void
  /** Hide the scrollbar while maintaining scroll functionality */
  hideScrollbar?: boolean
}

/**
 * A scrollable container with gradient fade indicators at top/bottom
 * when content is scrollable in that direction.
 *
 * Usage:
 * - Pass left-only padding in className (e.g., "pl-4 py-4" not "p-4")
 * - Scrollbar is always visible on the right edge
 * - Use ref to access scrollTo() and getScrollPosition()
 */
export const ScrollableArea = forwardRef<ScrollableAreaRef, ScrollableAreaProps>(
  function ScrollableArea({ children, className, deps = [], onScroll, hideScrollbar = false }, ref) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollUp, setCanScrollUp] = useState(false)
    const [canScrollDown, setCanScrollDown] = useState(false)
    const [isScrolling, setIsScrolling] = useState(false)
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Expose scrollTo and getScrollPosition via ref
    useImperativeHandle(ref, () => ({
      scrollTo: (options: ScrollToOptions) => {
        scrollRef.current?.scrollTo(options)
      },
      getScrollPosition: () => {
        if (!scrollRef.current) return null
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        return { scrollTop, scrollHeight, clientHeight }
      },
    }))

    useEffect(() => {
      const checkScroll = () => {
        if (scrollRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
          setCanScrollUp(scrollTop > 10)
          setCanScrollDown(scrollTop + clientHeight < scrollHeight - 10)
          onScroll?.({ scrollTop, scrollHeight, clientHeight })

          // Show scrollbar on scroll
          if (!hideScrollbar) {
            setIsScrolling(true)
            // Clear existing timeout
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current)
            }
            // Hide scrollbar after 1.5s of no scrolling
            scrollTimeoutRef.current = setTimeout(() => {
              setIsScrolling(false)
            }, 1500)
          }
        }
      }

      // Initial check after render
      checkScroll()
      // Also check after a brief delay to ensure content is fully rendered
      const timeoutId = setTimeout(checkScroll, 100)

      const container = scrollRef.current
      container?.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)

      return () => {
        clearTimeout(timeoutId)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        container?.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return (
      <div className="relative flex-1 overflow-hidden">
        {/* Scroll indicator - top fade */}
        {canScrollUp && (
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-gray-400/15 to-transparent pointer-events-none z-10" />
        )}

        {/* Scroll indicator - bottom fade */}
        {canScrollDown && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-400/15 to-transparent pointer-events-none z-10" />
        )}

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className={cn(
            'h-full',
            hideScrollbar ? 'scrollbar-none' : 'scrollbar-auto',
            !hideScrollbar && isScrolling && 'is-scrolling',
            className
          )}
        >
          {children}
        </div>
      </div>
    )
  }
)
