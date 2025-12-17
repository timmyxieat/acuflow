'use client'

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { isToday, isTomorrow, isYesterday, isSameDay } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  /** Currently selected date */
  selectedDate: Date
  /** Called when a date is selected */
  onDateSelect: (date: Date) => void
  /** Title to display (e.g., "Today" or "December 18") */
  title: string
  /** Subtitle to display (e.g., "Wednesday, December 17") */
  subtitle: string
  /** Compact mode for smaller text (used in appointment detail header) */
  compact?: boolean
  /** Optional className for the trigger */
  className?: string
}

export function DatePicker({
  selectedDate,
  onDateSelect,
  title,
  subtitle,
  compact = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const today = React.useMemo(() => new Date(), [])

  // Quick pick dates
  const yesterday = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d
  }, [])

  const tomorrow = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
  }, [])

  const handleDateSelect = React.useCallback(
    (date: Date | undefined) => {
      if (date) {
        onDateSelect(date)
        setOpen(false)
      }
    },
    [onDateSelect]
  )

  const handleQuickPick = React.useCallback(
    (date: Date) => {
      onDateSelect(date)
      setOpen(false)
    },
    [onDateSelect]
  )

  // Check which quick pick is currently selected
  const isTodaySelected = isToday(selectedDate)
  const isYesterdaySelected = isYesterday(selectedDate)
  const isTomorrowSelected = isTomorrow(selectedDate)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex flex-col items-center rounded-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            compact ? 'px-2 py-1' : 'px-3 py-1.5',
            className
          )}
        >
          <span className={cn(
            'font-semibold',
            compact ? 'text-sm' : 'text-xl'
          )}>{title}</span>
          <span className={cn(
            'text-muted-foreground',
            compact ? 'text-xs' : 'text-sm'
          )}>{subtitle}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center" sideOffset={8}>
        {/* Quick picks */}
        <div className="flex gap-2 border-b border-border p-3">
          <Button
            variant={isYesterdaySelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickPick(yesterday)}
            className="flex-1"
          >
            Yesterday
          </Button>
          <Button
            variant={isTodaySelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickPick(today)}
            className="flex-1"
          >
            Today
          </Button>
          <Button
            variant={isTomorrowSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickPick(tomorrow)}
            className="flex-1"
          >
            Tomorrow
          </Button>
        </div>
        {/* Calendar */}
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          defaultMonth={selectedDate}
          modifiers={{
            today: today,
          }}
          modifiersClassNames={{
            today: 'ring-2 ring-primary ring-offset-2',
          }}
          className="p-3"
          classNames={{
            day: 'h-10 w-10 text-sm',
            head_cell: 'w-10 font-normal text-muted-foreground',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
