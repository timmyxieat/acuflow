'use client'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { HeaderProvider } from '@/contexts/HeaderContext'
import { TransitionProvider } from '@/contexts/TransitionContext'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TransitionProvider>
      <HeaderProvider>
        <div className="flex h-dvh w-dvw overflow-hidden bg-background">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Topbar */}
            <Topbar />

            {/* Page content */}
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </HeaderProvider>
    </TransitionProvider>
  )
}
