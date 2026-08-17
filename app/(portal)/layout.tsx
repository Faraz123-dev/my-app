import AppShell from '@/app/(portal)/components/AppShell'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}