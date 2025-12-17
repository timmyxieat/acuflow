'use client'

import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_NEEDLE_RETENTION_MINUTES } from '../lib/helpers'

export interface UseTimerReturn {
  timerSeconds: number | null
  timerDuration: number
  isTimerRunning: boolean
  selectedPresetMinutes: number
  timerProgress: number
  handleStartTimer: (minutes?: number) => void
  handleStopTimer: () => void
  handleResumeTimer: () => void
  handleResetTimer: () => void
  handleAddTime: (minutes: number) => void
  handleSelectPreset: (minutes: number) => void
}

export function useTimer(): UseTimerReturn {
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const [timerDuration, setTimerDuration] = useState(DEFAULT_NEEDLE_RETENTION_MINUTES * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [selectedPresetMinutes, setSelectedPresetMinutes] = useState(DEFAULT_NEEDLE_RETENTION_MINUTES)

  // Timer countdown effect
  useEffect(() => {
    if (!isTimerRunning || timerSeconds === null) return

    // Allow timer to go negative (over time)
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, timerSeconds])

  // Calculate timer progress (0 to 1, can exceed 1 when over)
  const timerProgress = timerSeconds !== null && timerDuration > 0
    ? Math.max(0, timerSeconds) / timerDuration
    : 0

  const handleStartTimer = useCallback((minutes?: number) => {
    const durationSeconds = (minutes ?? DEFAULT_NEEDLE_RETENTION_MINUTES) * 60
    setTimerDuration(durationSeconds)
    setTimerSeconds(durationSeconds)
    setIsTimerRunning(true)
  }, [])

  const handleStopTimer = useCallback(() => {
    setIsTimerRunning(false)
  }, [])

  const handleResumeTimer = useCallback(() => {
    setIsTimerRunning(true)
  }, [])

  const handleResetTimer = useCallback(() => {
    setIsTimerRunning(false)
    setTimerSeconds(null)
  }, [])

  const handleAddTime = useCallback((minutes: number) => {
    if (timerSeconds !== null) {
      setTimerSeconds(prev => (prev !== null ? prev + minutes * 60 : null))
      setTimerDuration(prev => prev + minutes * 60)
    }
  }, [timerSeconds])

  const handleSelectPreset = useCallback((minutes: number) => {
    setSelectedPresetMinutes(minutes)
    // If timer is already running, also update the current timer
    if (timerSeconds !== null) {
      const durationSeconds = minutes * 60
      setTimerDuration(durationSeconds)
      setTimerSeconds(durationSeconds)
    }
  }, [timerSeconds])

  return {
    timerSeconds,
    timerDuration,
    isTimerRunning,
    selectedPresetMinutes,
    timerProgress,
    handleStartTimer,
    handleStopTimer,
    handleResumeTimer,
    handleResetTimer,
    handleAddTime,
    handleSelectPreset,
  }
}
