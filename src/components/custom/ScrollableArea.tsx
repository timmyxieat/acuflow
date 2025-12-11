'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ScrollableAreaProps {
  children: ReactNode
  className?: string
  /** Additional dependencies that should trigger a scroll check when changed */
  deps?: unknown[]
}

/**
 * A scrollable container with gradient fade indicators at top/bottom
 * when content is scrollable in that direction.
 */
export function ScrollableArea({ children, className, deps = [] }: ScrollableAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        setCanScrollUp(scrollTop > 10)
        setCanScrollDown(scrollTop + clientHeight < scrollHeight - 10)
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
      <div ref={scrollRef} className={cn('h-full scrollbar-always', className)}>
        {children}
      </div>
    </div>
  )
}
