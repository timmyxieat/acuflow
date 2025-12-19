'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Calendar, Home, Settings } from 'lucide-react'
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
    <aside className="flex h-full w-48 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-3 border-b border-sidebar-border">
        <Link href="/" onClick={handleHomeClick} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-sm font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">Acuflow</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => {
          const isHomeItem = item.href === '/'
          // Home is active if we're on "/" OR viewing a today appointment
          const isActive = pathname === item.href || (isHomeItem && header.isViewingTodayAppointment)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isHomeItem ? handleHomeClick : undefined}
              className={cn(
                'flex h-10 items-center gap-3 rounded-lg px-3 transition-colors',
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer - Practitioner info */}
      <div className="flex items-center gap-2 border-t border-sidebar-border p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent flex-shrink-0">
          <span className="text-sm font-medium text-sidebar-accent-foreground">SC</span>
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">Dr. Sarah Chen</p>
          <p className="text-xs text-sidebar-foreground/60 truncate">L.Ac., DAOM</p>
        </div>
      </div>
    </aside>
  )
}
