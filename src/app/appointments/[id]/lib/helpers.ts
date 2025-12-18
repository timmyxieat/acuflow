import { ClipboardCheck, RefreshCw, Sparkles, Calendar } from 'lucide-react'

// =============================================================================
// Panel Width Constants
// =============================================================================

// CSS clamp value for consistent responsive width (20vw, min 180px, max 280px)
// Used for PatientCards panel
export const PANEL_WIDTH_CLASS = 'w-[clamp(180px,20vw,280px)]'

// Narrower width for Visit History panel (compact two-row cards)
export const VISIT_HISTORY_WIDTH_CLASS = 'w-[clamp(160px,16vw,220px)]'

// Width for appointment info section (TopTabBar) and Patient Context panel
// These should match so they align vertically
export const APPOINTMENT_INFO_WIDTH = 280
export const APPOINTMENT_INFO_WIDTH_CLASS = `w-[${APPOINTMENT_INFO_WIDTH}px]`

// Default needle retention time in minutes (would come from clinic settings)
export const DEFAULT_NEEDLE_RETENTION_MINUTES = 25

// =============================================================================
// Appointment Type Icons
// =============================================================================

// Map appointment type IDs to icons (same as Timeline.tsx)
export const APPOINTMENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'appt_type_001': ClipboardCheck, // Initial Consultation
  'appt_type_002': RefreshCw, // Follow-up Treatment
  'appt_type_003': Sparkles, // Brief Follow-up
}

// =============================================================================
// Timeline Colors (matches PatientCards status colors)
// =============================================================================

export const TIMELINE_COLORS = {
  scheduled: '#94a3b8',  // Slate - future appointments not yet started
  checkedIn: '#22c55e',  // Green - patient arrived, waiting
  inProgress: '#3b82f6', // Blue - currently being treated
  unsigned: '#f59e0b',   // Amber - needs signature
  completed: '#94a3b8',  // Slate - signed and done
  editing: '#3b82f6',    // Blue - currently editing this appointment
}

// Fixed card height for timeline cards
export const TIMELINE_CARD_HEIGHT = 'h-[52px]'

// =============================================================================
// Date/Time Helper Functions
// =============================================================================

/**
 * Get contextual time status for an appointment
 * Returns strings like "in 5 min", "30 min remaining", "ended 1h ago"
 */
export function getContextualTimeStatus(scheduledStart: Date, scheduledEnd: Date): string {
  const now = new Date()
  const start = new Date(scheduledStart)
  const end = new Date(scheduledEnd)

  // Before appointment starts
  if (now < start) {
    const diffMs = start.getTime() - now.getTime()
    const diffMin = Math.round(diffMs / 60000)
    if (diffMin < 60) {
      return `in ${diffMin} min`
    }
    const diffHours = Math.round(diffMin / 60)
    return `in ${diffHours}h`
  }

  // During appointment (between start and end)
  if (now >= start && now < end) {
    const diffMs = end.getTime() - now.getTime()
    const diffMin = Math.round(diffMs / 60000)
    if (diffMin < 60) {
      return `${diffMin} min remaining`
    }
    const diffHours = Math.floor(diffMin / 60)
    const remainingMin = diffMin % 60
    if (remainingMin === 0) {
      return `${diffHours}h remaining`
    }
    return `${diffHours}h ${remainingMin}m remaining`
  }

  // After appointment end
  const diffMs = now.getTime() - end.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 60) {
    return `ended ${diffMin} min ago`
  }
  const diffHours = Math.round(diffMin / 60)
  return `ended ${diffHours}h ago`
}

/**
 * Get relative date string for Visit Timeline cards
 * Returns strings like "Today", "Yesterday", "3d ago", "2w ago", "1m ago"
 */
export function getRelativeDate(date: Date): string {
  const now = new Date()
  const visitDate = new Date(date)

  // Reset times to compare dates only
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate())

  const diffMs = nowDate.getTime() - targetDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Handle future dates
  if (diffDays < 0) {
    const futureDays = Math.abs(diffDays)
    if (futureDays === 1) return 'Tomorrow'
    if (futureDays < 7) return `in ${futureDays}d`
    const weeks = Math.floor(futureDays / 7)
    if (futureDays < 30) return `in ${weeks}w`
    const months = Math.floor(futureDays / 30)
    if (futureDays < 365) return `in ${months}mo`
    const years = Math.floor(futureDays / 365)
    return `in ${years}y`
  }

  // Past dates - abbreviated format
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  const weeks = Math.floor(diffDays / 7)
  if (diffDays < 30) return `${weeks}w ago`
  const months = Math.floor(diffDays / 30)
  if (diffDays < 365) return `${months}mo ago`
  const years = Math.floor(diffDays / 365)
  return `${years}y ago`
}

/**
 * Get relative day string for appointment header
 * Returns "Today", "Tomorrow", "Yesterday", "in 3d", "2d ago", or weekday name
 */
export function getRelativeDay(date: Date): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()

  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, tomorrow)) return 'Tomorrow'
  if (isSameDay(date, yesterday)) return 'Yesterday'

  // Calculate days difference
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0 && diffDays <= 7) return `in ${diffDays}d`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}d ago`

  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

/**
 * Format seconds as MM:SS timer string
 * Handles negative values (overtime) with minus sign
 */
export function formatTimer(seconds: number): string {
  const mins = Math.floor(Math.abs(seconds) / 60)
  const secs = Math.abs(seconds) % 60
  const sign = seconds < 0 ? '-' : ''
  return `${sign}${mins}:${secs.toString().padStart(2, '0')}`
}
