'use client'

import { Check } from 'lucide-react'

interface SaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
}

export function SaveStatus({ status }: SaveStatusProps) {
  switch (status) {
    case 'saving':
      return (
        <span className="text-xs text-muted-foreground animate-pulse">
          Saving...
        </span>
      )
    case 'saved':
      return (
        <span className="text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Saved
        </span>
      )
    case 'error':
      return (
        <span className="text-xs text-destructive">
          Save failed
        </span>
      )
    default:
      return null
  }
}
