'use client'

import { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react'

interface HeaderContent {
  // For default header (Today screen)
  title?: string
  subtitle?: string
  // For detail pages (appointment, patient, etc.)
  showBackButton?: boolean
  // Patient ID for back navigation (to restore selection)
  currentPatientId?: string
}

interface HeaderContextType {
  header: HeaderContent
  previousTitle: string | null // Title of the page we came from
  setHeader: (content: HeaderContent) => void
  resetHeader: () => void
}

const defaultHeader: HeaderContent = {
  title: 'Today',
  subtitle: new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }),
  showBackButton: false,
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<HeaderContent>(defaultHeader)
  const previousTitleRef = useRef<string | null>(null)

  const setHeader = useCallback((content: HeaderContent) => {
    setHeaderState((current) => {
      // Store the current title as previous before changing
      // Only store if current header has a title (not a detail page)
      if (current.title && !current.showBackButton) {
        previousTitleRef.current = current.title
      }
      return content
    })
  }, [])

  const resetHeader = useCallback(() => {
    setHeaderState(defaultHeader)
  }, [])

  const value = useMemo(
    () => ({ header, previousTitle: previousTitleRef.current, setHeader, resetHeader }),
    [header, setHeader, resetHeader]
  )

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider')
  }
  return context
}
