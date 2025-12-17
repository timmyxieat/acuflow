'use client'

import { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react'

// Patient info for appointment detail header
interface PatientInfo {
  id: string
  firstName: string
  lastName: string
  preferredName?: string
  dateOfBirth: Date
  sex?: 'MALE' | 'FEMALE' | 'OTHER'
}

// Appointment info for appointment detail header
interface AppointmentInfo {
  id: string
  scheduledStart: Date
  scheduledEnd: Date
  status: string
  isSigned?: boolean
}

interface HeaderContent {
  // For default header (Today screen)
  title?: string
  subtitle?: string
  // For detail pages (appointment, patient, etc.)
  showBackButton?: boolean
  // Patient ID for back navigation (to restore selection)
  currentPatientId?: string
  // Date for back navigation (to return to the same day's view)
  currentDate?: Date
  // Date navigation (for Today screen)
  selectedDate?: Date
  onNavigateDate?: (offset: number) => void
  showDateNavigation?: boolean
  // Appointment detail page info
  patient?: PatientInfo
  appointment?: AppointmentInfo
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
