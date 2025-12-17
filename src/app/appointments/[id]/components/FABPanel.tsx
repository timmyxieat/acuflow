'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Play, StopCircle, PenLine, LogOut, Plus, X } from 'lucide-react'
import { formatTime } from '@/lib/dev-time'
import { getStatusDisplay, type AppointmentWithRelations } from '@/data/mock-data'
import { getStatusColor } from '@/lib/constants'
import { formatTimer } from '../lib/helpers'
import { type UseTimerReturn } from '../hooks/useTimer'

// =============================================================================
// Types
// =============================================================================

export interface FABPanelProps {
  appointment: AppointmentWithRelations
  isExpanded: boolean
  onToggleExpanded: () => void
  timer: UseTimerReturn
}

// =============================================================================
// FAB Panel Component
// =============================================================================

export function FABPanel({
  appointment,
  isExpanded,
  onToggleExpanded,
  timer,
}: FABPanelProps) {
  const fabRef = useRef<HTMLDivElement>(null)

  const {
    timerSeconds,
    timerProgress,
    isTimerRunning,
    selectedPresetMinutes,
    handleStartTimer,
    handleStopTimer,
    handleResumeTimer,
    handleAddTime,
    handleSelectPreset,
  } = timer

  // Close FAB when clicking outside
  useEffect(() => {
    if (!isExpanded) return

    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        onToggleExpanded()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded, onToggleExpanded])

  return (
    <div ref={fabRef} className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-[220px] rounded-lg bg-background border border-border shadow-lg p-3"
          >
            <div className="flex flex-col gap-3">
              {/* Timer Section */}
              <div className="flex flex-col gap-2">
                {/* Large timer display */}
                <div className={`text-3xl font-semibold tabular-nums text-center ${
                  timerSeconds !== null && timerSeconds <= 0
                    ? 'text-red-600'
                    : timerSeconds !== null
                      ? 'text-blue-600'
                      : 'text-foreground'
                }`}>
                  {timerSeconds !== null ? formatTimer(timerSeconds) : formatTimer(selectedPresetMinutes * 60)}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 rounded-full ${
                      timerSeconds !== null && timerSeconds <= 0
                        ? 'bg-red-500'
                        : timerSeconds !== null
                          ? 'bg-blue-500'
                          : 'bg-muted-foreground/30'
                    }`}
                    style={{ width: timerSeconds !== null ? `${timerProgress * 100}%` : '100%' }}
                  />
                </div>

                {/* Presets: [10][25][40][+5] */}
                <div className="grid grid-cols-4 gap-1">
                  {[10, 25, 40].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleSelectPreset(mins)}
                      className={`h-8 text-xs font-medium rounded transition-colors ${
                        selectedPresetMinutes === mins && timerSeconds === null
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {mins}
                    </button>
                  ))}
                  <button
                    onClick={() => handleAddTime(5)}
                    disabled={timerSeconds === null}
                    className="h-8 text-xs font-medium rounded bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +5
                  </button>
                </div>

                {/* Start/Pause button */}
                {isTimerRunning ? (
                  <button
                    onClick={handleStopTimer}
                    className="h-11 text-sm font-medium rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <StopCircle className="h-4 w-4" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => timerSeconds !== null ? handleResumeTimer() : handleStartTimer(selectedPresetMinutes)}
                    className="h-11 text-sm font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {timerSeconds !== null ? 'Resume' : `Start ${selectedPresetMinutes} min`}
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border -mx-3" />

              {/* Status Section */}
              <div className="flex flex-col gap-3">
                {/* Progress dots - 3 steps */}
                {(() => {
                  const getCompletedSteps = () => {
                    if (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') return 1
                    if (appointment.status === 'IN_PROGRESS') return 2
                    if (appointment.status === 'COMPLETED') return 3
                    return 1
                  }
                  const completedSteps = getCompletedSteps()

                  return (
                    <div className="flex items-center justify-center gap-0">
                      {/* Step 1: Scheduled */}
                      <div className={`h-3 w-3 rounded-full ${
                        completedSteps >= 1 ? 'bg-primary' : 'border-2 border-muted-foreground'
                      }`} />
                      {/* Line 1 */}
                      <div className={`h-0.5 w-12 ${
                        completedSteps >= 2 ? 'bg-primary' : 'bg-muted'
                      }`} />
                      {/* Step 2: In Progress */}
                      <div className={`h-3 w-3 rounded-full ${
                        completedSteps >= 2 ? 'bg-primary' : 'border-2 border-muted-foreground'
                      }`} />
                      {/* Line 2 */}
                      <div className={`h-0.5 w-12 ${
                        completedSteps >= 3 ? 'bg-primary' : 'bg-muted'
                      }`} />
                      {/* Step 3: Complete */}
                      <div className={`h-3 w-3 rounded-full ${
                        completedSteps >= 3 ? 'bg-primary' : 'border-2 border-muted-foreground'
                      }`} />
                    </div>
                  )
                })()}

                {/* Current status with colored dot */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getStatusColor(appointment.status, appointment.isSigned) }}
                    />
                    <span className="text-sm font-semibold">
                      {getStatusDisplay(appointment.status, appointment.isSigned).label}
                    </span>
                  </div>
                  {/* Timestamp */}
                  <div className="text-xs text-muted-foreground pl-[18px]">
                    {appointment.status === 'SCHEDULED' && 'Waiting to start'}
                    {appointment.status === 'CHECKED_IN' && appointment.checkedInAt && (
                      <>Checked in {formatTime(appointment.checkedInAt)}</>
                    )}
                    {appointment.status === 'IN_PROGRESS' && appointment.startedAt && (
                      <>Started {formatTime(appointment.startedAt)}</>
                    )}
                    {appointment.status === 'COMPLETED' && !appointment.isSigned && 'Ready to sign'}
                    {appointment.status === 'COMPLETED' && appointment.isSigned && 'Visit complete'}
                  </div>
                </div>

                {/* Status action button */}
                {(appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') && (
                  <button
                    onClick={onToggleExpanded}
                    className="h-11 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Visit
                  </button>
                )}
                {appointment.status === 'IN_PROGRESS' && (
                  <button
                    onClick={onToggleExpanded}
                    className="h-11 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <StopCircle className="h-4 w-4" />
                    End Visit
                  </button>
                )}
                {appointment.status === 'COMPLETED' && !appointment.isSigned && (
                  <button
                    onClick={onToggleExpanded}
                    className="h-11 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <PenLine className="h-4 w-4" />
                    Sign Note
                  </button>
                )}
                {appointment.status === 'COMPLETED' && appointment.isSigned && (
                  <div className="h-11 text-sm font-medium rounded-md bg-green-100 text-green-700 flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    Signed
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border -mx-3" />

              {/* Total Section */}
              <div className="flex flex-col gap-2">
                {/* Total + description inline */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold tabular-nums">
                    ${appointment.usedEstim ? 100 : 85}
                  </span>
                  <span className="text-muted-foreground truncate">
                    {appointment.appointmentType?.name ?? 'Visit'}
                  </span>
                </div>

                {/* Checkout button */}
                <button
                  onClick={onToggleExpanded}
                  className="h-11 text-sm font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Check Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB toggle button */}
      <button
        onClick={onToggleExpanded}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all ${
          isExpanded
            ? 'bg-muted text-foreground hover:bg-muted/80'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
      >
        {isExpanded ? (
          <X className="h-5 w-5" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </button>
    </div>
  )
}
