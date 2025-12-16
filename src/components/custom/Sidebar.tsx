'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Calendar, Home, Settings } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTransition } from '@/contexts/TransitionContext'
import { useHeader } from '@/contexts/HeaderContext'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Today', href: '/', icon: Home },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { startTransition, isPatientCardsCollapsed } = useTransition()
  const { header } = useHeader()

  // Check if we're on an appointment detail page
  const isOnAppointmentPage = pathname.startsWith('/appointments/')

  // Handle navigation with animation for home button
  const handleHomeClick = (e: React.MouseEvent) => {
    if (isOnAppointmentPage) {
      e.preventDefault()
      // Trigger back animation (same as back button), pass current collapsed state
      startTransition({ x: 0, y: 0, width: 0, height: 0 } as DOMRect, 'back', undefined, isPatientCardsCollapsed)
      // Navigate to Today with patient selection preserved
      if (header.currentPatientId) {
        router.push(`/?patient=${header.currentPatientId}`)
      } else {
        router.push('/')
      }
    }
    // Otherwise, let the Link handle navigation normally
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full w-12 flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-14 items-center justify-center border-b border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/" onClick={handleHomeClick} className="flex items-center justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-sm font-bold text-primary-foreground">A</span>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Acuflow</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col items-center gap-1 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const isHomeItem = item.href === '/'

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={isHomeItem ? handleHomeClick : undefined}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Footer - Practitioner avatar */}
        <div className="flex justify-center border-t border-sidebar-border py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent transition-colors hover:bg-sidebar-accent/80">
                <span className="text-sm font-medium text-sidebar-accent-foreground">SC</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">Dr. Sarah Chen</p>
              <p className="text-xs text-muted-foreground">L.Ac., DAOM</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
