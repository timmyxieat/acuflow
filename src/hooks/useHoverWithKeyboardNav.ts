'use client'

import { useState, useCallback } from 'react'
import { useTransition } from '@/contexts/TransitionContext'

/**
 * Hook that manages hover state with keyboard navigation awareness.
 * When in keyboard nav mode, hover is suppressed (returns null).
 * When mouse moves, keyboard nav mode ends and hover takes over.
 *
 * @returns [hoveredId, setHoveredId, effectiveHoveredId]
 * - hoveredId: the raw hover state
 * - setHoveredId: function to update hover state
 * - effectiveHoveredId: null when in keyboard nav mode, otherwise hoveredId
 */
export function useHoverWithKeyboardNav<T = string>(): [
  T | null,
  (id: T | null) => void,
  T | null
] {
  const { isKeyboardNavMode } = useTransition()
  const [hoveredId, setHoveredIdState] = useState<T | null>(null)

  const setHoveredId = useCallback((id: T | null) => {
    setHoveredIdState(id)
  }, [])

  // When in keyboard nav mode, suppress hover
  const effectiveHoveredId = isKeyboardNavMode ? null : hoveredId

  return [hoveredId, setHoveredId, effectiveHoveredId]
}
