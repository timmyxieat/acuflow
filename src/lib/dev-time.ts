/**
 * Development Time Utility
 *
 * Shifts the current time to always be between 11:00 AM and 12:00 PM
 * for testing in-progress appointment states.
 *
 * Only active in development mode.
 */

const DEV_TARGET_HOUR = 11 // Target hour (11 AM)
const DEV_TARGET_MINUTE_RANGE = 60 // Minutes cycle through 0-59

/**
 * Get the current time, shifted for development if needed.
 * In production, returns actual Date.now()
 * In development, returns a time shifted to be between 11:00-11:59 AM
 */
export function getDevNow(): number {
  if (process.env.NODE_ENV === 'production') {
    return Date.now()
  }

  const now = new Date()
  const currentMinutes = now.getMinutes()
  const currentSeconds = now.getSeconds()
  const currentMs = now.getMilliseconds()

  // Create a new date at 11:XX AM today, preserving minutes/seconds
  const devTime = new Date()
  devTime.setHours(DEV_TARGET_HOUR, currentMinutes, currentSeconds, currentMs)

  return devTime.getTime()
}

/**
 * Get a Date object with dev time offset applied
 */
export function getDevDate(): Date {
  return new Date(getDevNow())
}

/**
 * Calculate the offset in milliseconds between real time and dev time
 */
export function getDevTimeOffset(): number {
  if (process.env.NODE_ENV === 'production') {
    return 0
  }

  const now = new Date()
  const devNow = new Date(getDevNow())
  return devNow.getTime() - now.getTime()
}
