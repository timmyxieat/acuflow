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

  // Use ref for onSave to avoid recreating save callback when onSave changes
  // This is critical - inline onSave functions would otherwise reset the debounce timer every render
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  // Use ref for data to access latest in save callback without recreating it
  const dataRef = useRef(data)
  dataRef.current = data

  // Serialize data for comparison
  const serializedData = JSON.stringify(data)
  const serializedDataRef = useRef(serializedData)
  serializedDataRef.current = serializedData

  // Save function - uses refs so it doesn't need to be recreated
  const save = useCallback(async () => {
    const currentSerialized = serializedDataRef.current
    const currentData = dataRef.current

    // Skip if data hasn't changed
    if (currentSerialized === lastSavedDataRef.current) {
      return
    }

    setStatus('saving')

    try {
      await onSaveRef.current(currentData)
      lastSavedDataRef.current = currentSerialized
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
  }, [savedDisplayMs])

  // Function to mark data as already saved (e.g., when loading from storage)
  // Can pass data directly to avoid timing issues with state updates
  const markAsSaved = useCallback((dataOverride?: T) => {
    if (dataOverride !== undefined) {
      lastSavedDataRef.current = JSON.stringify(dataOverride)
    } else {
      lastSavedDataRef.current = serializedDataRef.current
    }
  }, [])

  // Debounced effect - triggers save after delay
  useEffect(() => {
    if (!enabled) return

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

  return { status, markAsSaved }
}
