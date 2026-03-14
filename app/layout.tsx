import type { Metadata } from 'next'
import './globals.css'
import AppShell from '@/app/components/AppShell'

export const metadata: Metadata = {
  title: 'Aamir & Sons Trading',
  description: 'Fleet Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}