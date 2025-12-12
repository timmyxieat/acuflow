'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface TransitionOrigin {
  x: number
  y: number
  width: number
  height: number
}

type TransitionSource = 'today' | 'appointment'
type SlideDirection = 'up' | 'down' | null

interface TransitionContextType {
  origin: TransitionOrigin | null
  isTransitioning: boolean
  transitionSource: TransitionSource
  slideDirection: SlideDirection
  selectedAppointmentId: string | null
  startTransition: (rect: DOMRect, source: TransitionSource) => void
  setSlideDirection: (direction: SlideDirection) => void
  setSelectedAppointmentId: (id: string | null) => void
  completeTransition: () => void
}

const TransitionContext = createContext<TransitionContextType | null>(null)

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [origin, setOrigin] = useState<TransitionOrigin | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionSource, setTransitionSource] = useState<TransitionSource>('today')
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)

  const startTransition = useCallback((rect: DOMRect, source: TransitionSource) => {
    setOrigin({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    })
    setTransitionSource(source)
    setIsTransitioning(true)
  }, [])

  const completeTransition = useCallback(() => {
    setIsTransitioning(false)
    // Keep origin briefly for exit animations, then clear
    setTimeout(() => setOrigin(null), 500)
  }, [])

  return (
    <TransitionContext.Provider
      value={{
        origin,
        isTransitioning,
        transitionSource,
        slideDirection,
        selectedAppointmentId,
        startTransition,
        setSlideDirection,
        setSelectedAppointmentId,
        completeTransition,
      }}
    >
      {children}
    </TransitionContext.Provider>
  )
}

export function useTransition() {
  const context = useContext(TransitionContext)
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider')
  }
  return context
}
