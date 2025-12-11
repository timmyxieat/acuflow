/**
 * Shared constants for the application
 */

import { AppointmentStatus } from '@/generated/prisma/browser'

/**
 * Status colors for appointments
 * Used for left border on timeline cards and section headers on patient cards
 */
export const STATUS_COLORS: Record<string, string> = {
  [AppointmentStatus.IN_PROGRESS]: '#3b82f6', // blue-500
  [AppointmentStatus.CHECKED_IN]: '#22c55e', // green-500
  [AppointmentStatus.SCHEDULED]: '#eab308', // yellow-500
  [AppointmentStatus.COMPLETED]: '#94a3b8', // slate-400
  [AppointmentStatus.CANCELLED]: '#ef4444', // red-500
  [AppointmentStatus.NO_SHOW]: '#ef4444', // red-500
  // Special case: unsigned (completed but not signed)
  UNSIGNED: '#f59e0b', // amber-500
}

/**
 * Get status color, handling the unsigned special case
 */
export function getStatusColor(status: AppointmentStatus, isSigned?: boolean): string {
  if (status === AppointmentStatus.COMPLETED && !isSigned) {
    return STATUS_COLORS.UNSIGNED
  }
  return STATUS_COLORS[status] || STATUS_COLORS[AppointmentStatus.SCHEDULED]
}

/**
 * Tailwind class versions of status colors for headers
 */
export const STATUS_TEXT_COLORS: Record<string, string> = {
  [AppointmentStatus.IN_PROGRESS]: 'text-blue-600',
  [AppointmentStatus.CHECKED_IN]: 'text-green-600',
  [AppointmentStatus.SCHEDULED]: 'text-yellow-600',
  [AppointmentStatus.COMPLETED]: 'text-muted-foreground',
  [AppointmentStatus.CANCELLED]: 'text-red-600',
  [AppointmentStatus.NO_SHOW]: 'text-red-600',
  UNSIGNED: 'text-amber-600',
}

/**
 * Get status text color class
 */
export function getStatusTextColor(status: AppointmentStatus, isSigned?: boolean): string {
  if (status === AppointmentStatus.COMPLETED && !isSigned) {
    return STATUS_TEXT_COLORS.UNSIGNED
  }
  return STATUS_TEXT_COLORS[status] || STATUS_TEXT_COLORS[AppointmentStatus.SCHEDULED]
}

/**
 * Appointment type icon mapping
 * Maps appointment type IDs to lucide icon names
 */
export const APPOINTMENT_TYPE_ICONS: Record<string, string> = {
  'appt_type_001': 'ClipboardList', // Initial Consultation
  'appt_type_002': 'RefreshCw', // Follow-up Treatment
  'appt_type_003': 'Zap', // Brief Follow-up
}

/**
 * Default icon for unknown appointment types
 */
export const DEFAULT_APPOINTMENT_ICON = 'Calendar'
