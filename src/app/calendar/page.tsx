'use client'

import { useEffect } from 'react'
import { useHeader } from '@/contexts/HeaderContext'
import { TimelineHeader } from '@/components/custom'

export default function CalendarPage() {
  const { setHeader, resetHeader } = useHeader()

  // Hide the global topbar - this page manages its own header
  useEffect(() => {
    setHeader({ hideGlobalTopbar: true })
    return () => resetHeader()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TimelineHeader />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">Calendar</h2>
          <p className="mt-2 text-muted-foreground">Weekly/monthly calendar view coming soon</p>
        </div>
      </div>
    </div>
  )
}
