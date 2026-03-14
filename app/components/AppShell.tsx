'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useUser } from '@/lib/useUser'

const navItems = [
  { label: 'Dashboard', icon: '⊞', href: '/' },
  { label: 'Inventory', icon: '☰', href: '/inventory' },
  { label: 'Truck Intake', icon: '📋', href: '/truck-intake' },
  { label: 'Invoices', icon: '🧾', href: '/invoices' },
  { label: 'Reports', icon: '📊', href: '/reports' },
  { label: 'Calculator', icon: '⚙', href: '/calculator' },
  { label: 'Settings', icon: '⚙', href: '/settings' },
  { label: 'Tutorial', icon: '📖', href: '/Tutorial' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()
  const supabase = createClient()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login')
    }
  }, [user, loading, pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Get display name from user metadata or email
  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'User'

  // Don't show shell on login page
  if (pathname === '/login') return <>{children}</>
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#555', fontFamily: 'system-ui, sans-serif' }}>
      Loading...
    </div>
  )
  if (!user) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', fontFamily: 'system-ui, sans-serif', color: '#e5e5e5' }}>

      {/* Sidebar */}
      {sidebarOpen && (
        <aside style={{ width: 220, background: '#111', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 30 }}>
          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1e1e1e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#EAB308', fontWeight: 700, flexShrink: 0 }}>A&S</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>AAMIR & SONS</div>
                <div style={{ fontSize: 10, color: '#555' }}>TRADING LTD.</div>
              </div>
            </div>
          </div>

          <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, color: '#444', padding: '0 8px', marginBottom: 8, letterSpacing: '0.1em' }}>MENU</div>
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <a key={item.label} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  borderRadius: 6, marginBottom: 2, cursor: 'pointer', textDecoration: 'none',
                  background: isActive ? '#1c1c1c' : 'transparent',
                  color: isActive ? '#EAB308' : '#777',
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                  borderLeft: isActive ? '2px solid #EAB308' : '2px solid transparent',
                  transition: 'all 0.1s',
                }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#aaa' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#777' }}
                >
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  {item.label}
                </a>
              )
            })}
          </nav>

          {/* User section at bottom of sidebar */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e1e' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EAB308', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{displayName}</div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: '4px', borderRadius: 4 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}
              >⎋</button>
            </div>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: sidebarOpen ? 220 : 0, transition: 'margin-left 0.2s' }}>

        {/* Top bar */}
        <header style={{ height: 52, background: '#111', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 20 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 18 }}>☰</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Profit Sim button */}
            <a href="/calculator" style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc',
              borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}>📈 Profit Sim</a>

            {/* New Intake button */}
            <a href="/truck-intake" style={{
              background: '#EAB308', border: 'none', color: '#000',
              borderRadius: 6, padding: '6px 14px', fontSize: 12,
              fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
            }}>+ New Intake</a>

            {/* User name display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid #2a2a2a', paddingLeft: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EAB308', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#000' }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: '#888' }}>{displayName}</span>
              <button
                onClick={handleSignOut}
                title="Sign out"
                style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12, padding: '2px 6px', borderRadius: 4 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}
              >Sign out</button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}