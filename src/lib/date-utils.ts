/**
 * Date utilities for date navigation in the Today screen
 */

/**
 * Check if two dates are the same calendar day
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return isSameDay(date, tomorrow)
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

/**
 * Get the start of week (Sunday) for a given date
 */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Check if a date is in the same week as today
 */
export function isSameWeek(date: Date): boolean {
  const today = new Date()
  const startOfThisWeek = getStartOfWeek(today)
  const startOfDateWeek = getStartOfWeek(date)
  return isSameDay(startOfThisWeek, startOfDateWeek)
}

/**
 * Get the week difference between a date and today
 * Negative = past, Positive = future
 */
export function getWeekDifference(date: Date): number {
  const today = new Date()
  const startOfThisWeek = getStartOfWeek(today)
  const startOfDateWeek = getStartOfWeek(date)
  const diffMs = startOfDateWeek.getTime() - startOfThisWeek.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return Math.round(diffDays / 7)
}

/**
 * Get the title for the date navigation header
 * Returns "Today" or "December 18"
 */
export function getDateTitle(date: Date): string {
  if (isToday(date)) {
    return 'Today'
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get the subtitle for the date navigation header
 * Contextual based on which day is being viewed
 */
export function getDateSubtitle(date: Date): string {
  // Today: Full date "Wednesday, December 17"
  if (isToday(date)) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  // Tomorrow
  if (isTomorrow(date)) {
    return 'Tomorrow'
  }

  // Yesterday
  if (isYesterday(date)) {
    return 'Yesterday'
  }

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const weekDiff = getWeekDifference(date)

  // Same week (but not today/tomorrow/yesterday)
  if (weekDiff === 0) {
    return dayName
  }

  // Last week
  if (weekDiff === -1) {
    return `Last Week · ${dayName}`
  }

  // Next week
  if (weekDiff === 1) {
    return `Next Week · ${dayName}`
  }

  // 2+ weeks ago
  if (weekDiff < -1) {
    const weeksAgo = Math.abs(weekDiff)
    return `${weeksAgo} weeks ago · ${dayName}`
  }

  // 2+ weeks ahead
  if (weekDiff > 1) {
    return `In ${weekDiff} weeks · ${dayName}`
  }

  // Fallback (shouldn't reach here)
  return dayName
}

/**
 * Format a date for URL parameter (YYYY-MM-DD)
 */
export function formatDateForUrl(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get the label for a back button that returns to a specific date
 * Returns "Back to Today", "Back to Tomorrow", "Back to December 24", etc.
 */
export function getBackButtonLabel(date: Date): string {
  if (isToday(date)) {
    return 'Back to Today'
  }
  if (isTomorrow(date)) {
    return 'Back to Tomorrow'
  }
  if (isYesterday(date)) {
    return 'Back to Yesterday'
  }
  // For other dates, use the month and day
  return `Back to ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
}

/**
 * Parse a date from URL parameter
 * Returns null if invalid
 */
export function parseDateFromUrl(str: string | null): Date | null {
  if (!str) return null

  // Match YYYY-MM-DD format
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const [, yearStr, monthStr, dayStr] = match
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1 // 0-indexed
  const day = parseInt(dayStr, 10)

  // Validate ranges
  if (month < 0 || month > 11) return null
  if (day < 1 || day > 31) return null

  const date = new Date(year, month, day)

  // Verify the date is valid (handles cases like Feb 30)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}
