'use client'

import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { PatientSearchCommand } from './PatientSearchCommand'
import { HeaderProvider, useHeader } from '@/contexts/HeaderContext'
import { TransitionProvider } from '@/contexts/TransitionContext'
import { SearchProvider, useSearch } from '@/contexts/SearchContext'

interface AppShellProps {
  children: React.ReactNode
}

function AppShellContent({ children }: AppShellProps) {
  const { openSearch } = useSearch()
  const { header } = useHeader()

  // Global keyboard shortcut: ⌘K (Mac) / Ctrl+K (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openSearch])

  return (
    <div className="flex h-dvh w-dvw overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar - conditionally shown based on page */}
        {!header.hideGlobalTopbar && <Topbar />}

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Global Patient Search Command Palette */}
      <PatientSearchCommand />
    </div>
  )
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TransitionProvider>
      <HeaderProvider>
        <SearchProvider>
          <AppShellContent>{children}</AppShellContent>
        </SearchProvider>
      </HeaderProvider>
    </TransitionProvider>
  )
}
