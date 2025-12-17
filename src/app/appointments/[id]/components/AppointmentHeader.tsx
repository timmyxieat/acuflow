'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { formatTime } from '@/lib/dev-time'
import { getStatusDisplay, getPatientDisplayName, calculateAge, type AppointmentWithRelations } from '@/data/mock-data'
import { getStatusColor } from '@/lib/constants'
import { PANEL_WIDTH_CLASS, VISIT_HISTORY_WIDTH_CLASS, getRelativeDay } from '../lib/helpers'
import { type AnimationConfig, pageTransition } from '../lib/animation-config'

// =============================================================================
// Appointment Header Component
// =============================================================================

export interface AppointmentHeaderProps {
  appointment: AppointmentWithRelations
  visitCount: number
  firstVisitDate: Date | null
  activeTab: 'medical' | 'billing' | 'schedule' | 'comms'
  // Animation configs from usePageAnimations hook
  headerLeftConfig: AnimationConfig
  headerCenterConfig: AnimationConfig
  headerRightConfig: AnimationConfig
}

export function AppointmentHeader({
  appointment,
  visitCount,
  firstVisitDate,
  activeTab,
  headerLeftConfig,
  headerCenterConfig,
  headerRightConfig,
}: AppointmentHeaderProps) {
  const statusDisplay = getStatusDisplay(appointment.status, appointment.isSigned)
  const statusColor = getStatusColor(appointment.status, appointment.isSigned)

  const appointmentDate = new Date(appointment.scheduledStart)
  const dateStr = appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const relativeDay = getRelativeDay(appointmentDate)
  const timeRange = `${formatTime(appointment.scheduledStart)} - ${formatTime(appointment.scheduledEnd)}`

  // Patient info
  const patient = appointment.patient
  const patientName = patient ? getPatientDisplayName(patient) : 'Unknown Patient'
  const initials = patient
    ? `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase()
    : '??'

  // First visit date formatted
  const firstVisitStr = firstVisitDate
    ? `Since ${firstVisitDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    : 'New patient'

  return (
    <div className="flex h-14 items-stretch border-b border-border">
      {/* Left section: Avatar + Patient name + demographics */}
      {/* Static for same-patient nav, animated for different patient or from Today */}
      <AnimatePresence mode="wait" initial={headerLeftConfig.shouldAnimate}>
        <motion.div
          key={headerLeftConfig.key}
          className={`flex items-center gap-2 px-3 border-r border-border flex-shrink-0 ${VISIT_HISTORY_WIDTH_CLASS}`}
          initial={headerLeftConfig.shouldAnimate ? headerLeftConfig.initial : false}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={headerLeftConfig.shouldAnimate ? headerLeftConfig.exit : undefined}
          transition={pageTransition}
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {initials}
          </div>
          {/* Patient name + demographics */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{patientName}</span>
            <span className="text-xs text-muted-foreground">
              {patient?.dateOfBirth ? `${calculateAge(patient.dateOfBirth)} yo` : ''}
              {patient?.sex && patient?.dateOfBirth ? ', ' : ''}
              {patient?.sex === 'FEMALE' ? 'Female' : patient?.sex === 'MALE' ? 'Male' : ''}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Center section: Date + Time + Status */}
      <AnimatePresence mode="wait" initial={true}>
        <motion.div
          key={headerCenterConfig.key}
          className="flex flex-1 items-center justify-between px-3"
          initial={headerCenterConfig.initial}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={headerCenterConfig.exit}
          transition={pageTransition}
        >
          {/* Date · Relative on row 1, Time Range on row 2 */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="font-semibold">{dateStr}</span>
              <span className="text-muted-foreground">· {relativeDay}</span>
            </div>
            <span className="text-xs text-muted-foreground">{timeRange}</span>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-xs font-medium text-foreground">
              {statusDisplay.label}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Right section: Visit count + First visit date (only on Medical tab) */}
      {activeTab === 'medical' && (
        <AnimatePresence mode="wait" initial={true}>
          <motion.div
            key={headerRightConfig.key}
            className={`flex flex-col justify-center px-3 border-l border-border flex-shrink-0 ${PANEL_WIDTH_CLASS}`}
            initial={headerRightConfig.initial}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={headerRightConfig.exit}
            transition={pageTransition}
          >
            <span className="text-sm font-semibold">Visits ({visitCount})</span>
            <span className="text-xs text-muted-foreground">{firstVisitStr}</span>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
