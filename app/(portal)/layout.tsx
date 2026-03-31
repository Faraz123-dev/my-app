import type { Metadata } from 'next'
import '@/app/globals.css'
import AppShell from '@/app/(portal)/components/AppShell'

export const metadata: Metadata = {
  title: 'Aamir & Sons Trading',
  description: 'Fleet Management System',
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <body style={{ margin: 0, padding: 0 }}>
      <AppShell>{children}</AppShell>
    </body>
  )
}