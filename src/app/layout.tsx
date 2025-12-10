import type { Metadata } from 'next'
import { AppShell } from '@/components/custom'
import './globals.css'

export const metadata: Metadata = {
  title: 'Acuflow - Acupuncture EHR',
  description: 'Modern acupuncture practice management software',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
