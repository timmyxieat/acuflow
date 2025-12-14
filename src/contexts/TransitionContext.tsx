'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

interface TransitionOrigin {
  x: number
  y: number
  width: number
  height: number
}

type TransitionSource = 'today' | 'appointment' | 'scheduled'
type SlideDirection = 'up' | 'down' | null

interface TransitionContextType {
  origin: TransitionOrigin | null
  isTransitioning: boolean
  transitionSource: TransitionSource
  slideDirection: SlideDirection
  selectedAppointmentId: string | null
  lastSelectedAppointmentId: string | null
  isKeyboardNavMode: boolean
  showFutureAppointments: boolean
  transitionPatientId: string | null
  isPatientCardsCollapsed: boolean
  startTransition: (rect: DOMRect, source: TransitionSource, patientId?: string) => void
  setSlideDirection: (direction: SlideDirection) => void
  setSelectedAppointmentId: (id: string | null) => void
  setKeyboardNavMode: (active: boolean) => void
  setShowFutureAppointments: (show: boolean) => void
  setPatientCardsCollapsed: (collapsed: boolean) => void
  completeTransition: () => void
}

const TransitionContext = createContext<TransitionContextType | null>(null)

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [origin, setOrigin] = useState<TransitionOrigin | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionSource, setTransitionSource] = useState<TransitionSource>('today')
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(null)
  const [selectedAppointmentId, setSelectedAppointmentIdState] = useState<string | null>(null)
  const [lastSelectedAppointmentId, setLastSelectedAppointmentId] = useState<string | null>(null)
  const [isKeyboardNavMode, setIsKeyboardNavMode] = useState(false)
  const [showFutureAppointments, setShowFutureAppointments] = useState(false)
  const [transitionPatientId, setTransitionPatientId] = useState<string | null>(null)
  const [isPatientCardsCollapsed, setPatientCardsCollapsed] = useState(true) // Start collapsed on appointment detail

  // Global mouse move listener to exit keyboard nav mode
  useEffect(() => {
    const handleMouseMove = () => {
      if (isKeyboardNavMode) {
        setIsKeyboardNavMode(false)
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isKeyboardNavMode])

  // Set data attribute on body for CSS-based hover suppression
  useEffect(() => {
    if (isKeyboardNavMode) {
      document.body.setAttribute('data-keyboard-nav', 'true')
    } else {
      document.body.removeAttribute('data-keyboard-nav')
    }
  }, [isKeyboardNavMode])

  // Wrap setKeyboardNavMode to be callable from anywhere
  const setKeyboardNavMode = useCallback((active: boolean) => {
    setIsKeyboardNavMode(active)
  }, [])

  // Wrap setSelectedAppointmentId to save "last selected" when deselecting
  const setSelectedAppointmentId = useCallback((id: string | null) => {
    setSelectedAppointmentIdState((currentId) => {
      // When deselecting (setting to null), remember the current selection
      if (id === null && currentId !== null) {
        setLastSelectedAppointmentId(currentId)
      }
      return id
    })
  }, [])

  const startTransition = useCallback((rect: DOMRect, source: TransitionSource, patientId?: string) => {
    // Clear any lingering transition state first to prevent double animations
    setIsTransitioning(false)

    // Then set up the new transition
    setOrigin({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    })
    setTransitionSource(source)
    setTransitionPatientId(patientId ?? null)
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
        lastSelectedAppointmentId,
        isKeyboardNavMode,
        showFutureAppointments,
        transitionPatientId,
        isPatientCardsCollapsed,
        startTransition,
        setSlideDirection,
        setSelectedAppointmentId,
        setKeyboardNavMode,
        setShowFutureAppointments,
        setPatientCardsCollapsed,
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
