'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'

interface HeaderContent {
  // For default header (Today screen)
  title?: string
  subtitle?: string
  // For appointment detail header
  showBackButton?: boolean
  patientName?: string
  appointmentTime?: string
}

interface HeaderContextType {
  header: HeaderContent
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

  const setHeader = useCallback((content: HeaderContent) => {
    setHeaderState(content)
  }, [])

  const resetHeader = useCallback(() => {
    setHeaderState(defaultHeader)
  }, [])

  const value = useMemo(() => ({ header, setHeader, resetHeader }), [header, setHeader, resetHeader])

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
