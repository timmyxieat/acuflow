import { useState, useEffect, useRef, useCallback } from 'react'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveOptions<T> {
  /** Data to save */
  data: T
  /** Save function that returns a promise */
  onSave: (data: T) => Promise<void>
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number
  /** How long to show "saved" status before returning to idle (default: 2000) */
  savedDisplayMs?: number
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean
}

/**
 * Hook for auto-saving data with debounce
 *
 * Features:
 * - Debounced saves (default 1s delay)
 * - Skips save if content unchanged
 * - Returns status: 'idle' | 'saving' | 'saved' | 'error'
 * - "Saved" status resets to "idle" after 2s
 *
 * @example
 * const { status } = useAutoSave({
 *   data: soapData,
 *   onSave: async (data) => {
 *     await saveVisitSOAP({ appointmentId, soap: data })
 *   },
 * })
 */
export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 1000,
  savedDisplayMs = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')

  // Track last saved data to skip unnecessary saves
  const lastSavedDataRef = useRef<string | null>(null)

  // Track debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Track "saved" display timer
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Serialize data for comparison
  const serializedData = JSON.stringify(data)

  // Save function
  const save = useCallback(async () => {
    // Skip if data hasn't changed
    if (serializedData === lastSavedDataRef.current) {
      return
    }

    setStatus('saving')

    try {
      await onSave(data)
      lastSavedDataRef.current = serializedData
      setStatus('saved')

      // Reset to idle after delay
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
      }
      savedTimerRef.current = setTimeout(() => {
        setStatus('idle')
      }, savedDisplayMs)
    } catch (error) {
      console.error('[useAutoSave] Save failed:', error)
      setStatus('error')
    }
  }, [data, serializedData, onSave, savedDisplayMs])

  // Debounced effect - triggers save after delay
  useEffect(() => {
    if (!enabled) return

    // Skip if this is the initial render with empty data
    const isEmpty = serializedData === JSON.stringify({ subjective: '', objective: '', assessment: '', plan: '' })
    if (isEmpty && lastSavedDataRef.current === null) {
      return
    }

    // Skip if data hasn't changed from last save
    if (serializedData === lastSavedDataRef.current) {
      return
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      save()
    }, debounceMs)

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [serializedData, enabled, debounceMs, save])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
      }
    }
  }, [])

  return { status }
}
