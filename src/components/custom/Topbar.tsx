'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useHeader } from '@/contexts/HeaderContext'
import { useTransition } from '@/contexts/TransitionContext'
import { useSearch } from '@/contexts/SearchContext'
import { CONTENT_SLIDE_ANIMATION } from '@/lib/animations'
import { isToday, formatDateForUrl, getBackButtonLabel } from '@/lib/date-utils'
import { getStatusColor } from '@/lib/constants'
import { AppointmentStatus } from '@/generated/prisma/browser'

// Helper to get patient initials
function getPatientInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}

// Helper to get patient display name (preferredName or firstName)
function getDisplayName(firstName: string, lastName: string, preferredName?: string): string {
  const first = preferredName || firstName
  return `${first} ${lastName}`
}

// Helper to calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Helper to check if date is today
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}

export function Topbar() {
  const router = useRouter()
  const { header } = useHeader()
  const { startTransition, isTransitioning, transitionSource } = useTransition()
  const { openSearch } = useSearch()

  const showBackToToday = header.showDateNavigation && header.selectedDate && !isToday(header.selectedDate)

  // Show accent line when viewing a non-today date (either on Today screen or appointment detail)
  const showAccentLine = showBackToToday || (header.showBackButton && header.currentDate && !isToday(header.currentDate))

  // Check if we have patient info to show (appointment detail page)
  const hasPatientInfo = header.patient && header.appointment

  // Calculate status dot color (only for today's appointments)
  const statusDotColor = hasPatientInfo && header.appointment
    ? isSameDay(new Date(header.appointment.scheduledStart), new Date())
      ? getStatusColor(header.appointment.status as AppointmentStatus, header.appointment.isSigned)
      : null
    : null

  // Patient display info
  const patientInitials = hasPatientInfo ? getPatientInitials(header.patient!.firstName, header.patient!.lastName) : ''
  const patientName = hasPatientInfo ? getDisplayName(header.patient!.firstName, header.patient!.lastName, header.patient!.preferredName) : ''
  const patientAge = hasPatientInfo && header.patient?.dateOfBirth ? calculateAge(new Date(header.patient.dateOfBirth)) : null
  const patientSex = hasPatientInfo ? header.patient?.sex : null

  return (
    <header className="relative flex h-14 items-center border-b border-border px-3 bg-sidebar">
      {/* Orange accent line when viewing non-today date */}
      {showAccentLine && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-400" />
      )}
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
            <span>{header.currentDate ? getBackButtonLabel(header.currentDate) : 'Back to Today'}</span>
          </button>
        ) : showBackToToday ? (
          <button
            onClick={() => {
              router.replace('/', { scroll: false })
            }}
            className="flex h-14 items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Today</span>
          </button>
        ) : null}
      </div>

      {/* Center area - Patient info (on appointment detail pages) */}
      {header.showBackButton && hasPatientInfo && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
          initial={isTransitioning && transitionSource === 'back' ? { y: -20, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={CONTENT_SLIDE_ANIMATION.transition}
        >
          {/* Avatar with status dot */}
          <div className="relative flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {patientInitials}
            </div>
            {statusDotColor && (
              <div
                className="absolute top-[1px] right-[1px] h-2 w-2 rounded-full"
                style={{ backgroundColor: statusDotColor }}
              />
            )}
          </div>
          {/* Patient name + demographics */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{patientName}</span>
            <span className="text-xs text-muted-foreground">
              {patientAge !== null ? `${patientAge}y` : ''}
              {patientAge !== null && patientSex ? ', ' : ''}
              {patientSex === 'FEMALE' ? 'F' : patientSex === 'MALE' ? 'M' : ''}
            </span>
          </div>
        </motion.div>
      )}

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
