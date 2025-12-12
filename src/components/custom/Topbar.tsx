'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, User, Calendar, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/dev-time'
import { useHeader } from '@/contexts/HeaderContext'
import {
  searchPatients,
  getAppointmentsForDate,
  getPatientDisplayName,
  calculateAge,
  type Patient,
  type AppointmentWithRelations,
} from '@/data/mock-data'

type SearchMode = 'patient' | 'date'

interface SearchResult {
  type: 'patient' | 'appointment'
  patient: Patient
  appointment?: AppointmentWithRelations
}

export function Topbar() {
  const router = useRouter()
  const { header, previousTitle } = useHeader()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchMode, setSearchMode] = useState<SearchMode>('patient')
  const [query, setQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchMode === 'patient') {
      inputRef.current?.focus()
    } else if (isSearchOpen && searchMode === 'date') {
      dateInputRef.current?.focus()
    }
  }, [isSearchOpen, searchMode])

  // Search patients by text
  useEffect(() => {
    if (searchMode === 'patient' && query.length >= 2) {
      const patients = searchPatients(query)
      setResults(patients.map((p) => ({ type: 'patient', patient: p })))
    } else if (searchMode === 'patient') {
      setResults([])
    }
  }, [query, searchMode])

  // Search by date
  useEffect(() => {
    if (searchMode === 'date' && selectedDate) {
      const date = new Date(selectedDate)
      const appointments = getAppointmentsForDate(date)
      setResults(
        appointments
          .filter((a) => a.patient)
          .map((a) => ({
            type: 'appointment',
            patient: a.patient!,
            appointment: a,
          }))
      )
    } else if (searchMode === 'date') {
      setResults([])
    }
  }, [selectedDate, searchMode])

  const handleClose = () => {
    setIsSearchOpen(false)
    setQuery('')
    setSelectedDate('')
    setResults([])
  }

  const handlePatientClick = (patient: Patient) => {
    // TODO: Navigate to patient profile
    console.log('Navigate to patient:', patient.id)
    handleClose()
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-sidebar px-6">
      {/* Page title area - contextual based on route */}
      <div className="flex items-center gap-4">
        {header.showBackButton ? (
          <>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Today</span>
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">{header.title || 'Today'}</h1>
            <span className="text-sm text-muted-foreground">
              {header.subtitle || new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </>
        )}
      </div>

      {/* Search area */}
      <div className="relative">
        {!isSearchOpen ? (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Search className="h-4 w-4" />
            <span>Search patients...</span>
            <kbd className="ml-2 hidden rounded bg-muted px-1.5 py-0.5 text-xs font-medium sm:inline-block">
              ⌘K
            </kbd>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Search mode toggle */}
            <div className="flex rounded-lg border border-input bg-background p-1">
              <button
                onClick={() => {
                  setSearchMode('patient')
                  setResults([])
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  searchMode === 'patient'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <User className="h-3.5 w-3.5" />
                Patient
              </button>
              <button
                onClick={() => {
                  setSearchMode('date')
                  setResults([])
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  searchMode === 'date'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                Date
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              {searchMode === 'patient' ? (
                <div className="flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name, phone, or email..."
                    className="h-10 w-72 rounded-lg border border-input bg-background pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 w-72 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              )}

              {/* Results dropdown */}
              {results.length > 0 && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-popover p-2 shadow-lg">
                  <div className="max-h-80 overflow-y-auto">
                    {results.map((result, index) => (
                      <button
                        key={`${result.patient.id}-${index}`}
                        onClick={() => handlePatientClick(result.patient)}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <span className="text-sm font-medium">
                            {result.patient.firstName[0]}
                            {result.patient.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-sm font-medium">
                            {getPatientDisplayName(result.patient)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {result.type === 'appointment' && result.appointment ? (
                              <>
                                {formatTime(result.appointment.scheduledStart)} -{' '}
                                {result.appointment.appointmentType?.name}
                              </>
                            ) : (
                              <>
                                {calculateAge(result.patient.dateOfBirth)}yo •{' '}
                                {result.patient.phone}
                              </>
                            )}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results message */}
              {((searchMode === 'patient' && query.length >= 2 && results.length === 0) ||
                (searchMode === 'date' && selectedDate && results.length === 0)) && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-popover p-4 text-center shadow-lg">
                  <p className="text-sm text-muted-foreground">No results found</p>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
