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

// Bottom nav shows only the 5 most used items on mobile
const bottomNavItems = [
  { label: 'Dashboard', icon: '⊞', href: '/' },
  { label: 'Inventory', icon: '☰', href: '/inventory' },
  { label: 'Intake', icon: '📋', href: '/truck-intake' },
  { label: 'Reports', icon: '📊', href: '/reports' },
  { label: 'More', icon: '•••', href: null },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [dark, setDark] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) setDark(saved === 'dark')
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
      setShowMoreMenu(false)
    }
  }, [pathname, isMobile])

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') router.push('/login')
  }, [user, loading, pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  if (pathname === '/login') return <>{children}</>
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: dark ? '#050505' : '#f8f8f6' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '2px solid transparent', borderTopColor: '#EAB308', borderRightColor: '#EAB30844', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ color: '#888', fontSize: 13, fontFamily: 'system-ui' }}>Loading...</span>
      </div>
    </div>
  )
  if (!user) return null

  const currentPage = navItems.find(n => n.href === pathname || (n.href !== '/' && pathname.startsWith(n.href)))

  const t = {
    bg: dark ? '#050505' : '#f5f5f0',
    sidebar: dark ? 'linear-gradient(180deg,#0c0c0c,#080808,#060606)' : 'linear-gradient(180deg,#ffffff,#fafaf8)',
    sidebarBorder: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    topbar: dark ? 'rgba(5,5,5,0.95)' : 'rgba(250,250,248,0.95)',
    topbarBorder: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
    bottomNav: dark ? 'rgba(8,8,8,0.97)' : 'rgba(255,255,255,0.97)',
    bottomNavBorder: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    navActive: dark ? 'linear-gradient(135deg,rgba(234,179,8,0.12),rgba(234,179,8,0.04))' : 'linear-gradient(135deg,rgba(234,179,8,0.15),rgba(234,179,8,0.06))',
    navHover: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    navColor: dark ? '#4a4a4a' : '#888',
    text: dark ? '#e5e5e5' : '#1a1a1a',
    subtext: dark ? '#555' : '#999',
    mutedtext: dark ? '#333' : '#bbb',
    brandTitle: dark ? '#fff' : '#111',
    brandSub: dark ? '#3a3a3a' : '#bbb',
    divider: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    userCardBg: dark ? 'linear-gradient(135deg,rgba(234,179,8,0.07),rgba(255,255,255,0.02))' : 'linear-gradient(135deg,rgba(234,179,8,0.1),rgba(0,0,0,0.02))',
    userCardBorder: dark ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.25)',
    shadow: dark ? '0 8px 40px rgba(0,0,0,0.8)' : '0 4px 24px rgba(0,0,0,0.12)',
    moreMenu: dark ? '#111' : '#fff',
    moreMenuBorder: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root[data-theme="dark"] {
          --bg: #050505; --surface: #0c0c0c; --surface2: #111111;
          --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.04);
          --text: #e5e5e5; --text2: #888; --text3: #444; --text4: #2a2a2a;
          --gold: #EAB308; --gold-dim: rgba(234,179,8,0.15);
          --card-bg: rgba(255,255,255,0.03); --card-border: rgba(255,255,255,0.07);
          --input-bg: #0f0f0f; --input-border: #2a2a2a;
          --hover: rgba(255,255,255,0.04); --active: rgba(234,179,8,0.1);
          --shadow: 0 8px 40px rgba(0,0,0,0.6);
          --green: #22c55e; --red: #ef4444; --orange: #f97316; --blue: #38bdf8;
        }
        :root[data-theme="light"] {
          --bg: #f5f5f0; --surface: #ffffff; --surface2: #f8f8f5;
          --border: rgba(0,0,0,0.08); --border2: rgba(0,0,0,0.05);
          --text: #1a1a1a; --text2: #666; --text3: #aaa; --text4: #ccc;
          --gold: #ca8a04; --gold-dim: rgba(202,138,4,0.12);
          --card-bg: rgba(255,255,255,0.9); --card-border: rgba(0,0,0,0.08);
          --input-bg: #ffffff; --input-border: #d4d4d4;
          --hover: rgba(0,0,0,0.04); --active: rgba(202,138,4,0.1);
          --shadow: 0 4px 24px rgba(0,0,0,0.1);
          --green: #16a34a; --red: #dc2626; --orange: #ea580c; --blue: #0284c7;
        }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--gold); }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        body { background: var(--bg); color: var(--text); transition: background 0.3s, color 0.3s; }

        .nav-link {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 14px; border-radius: 10px; margin-bottom: 3px;
          cursor: pointer; text-decoration: none; font-size: 13.5px;
          border: 1px solid transparent; transition: all 0.18s ease;
          color: var(--text3); font-weight: 400; position: relative;
        }
        .nav-link:hover { color: var(--text2); background: var(--hover); border-color: var(--border2); }
        .nav-link.active {
          color: var(--gold); font-weight: 600;
          background: var(--active); border-color: var(--gold-dim);
          box-shadow: inset 0 1px 0 rgba(234,179,8,0.1);
        }
        .topbar-pill {
          background: var(--hover); border: 1px solid var(--border);
          color: var(--text2); border-radius: 99px; padding: 6px 14px; font-size: 12px;
          cursor: pointer; text-decoration: none; display: flex; align-items: center;
          gap: 6px; transition: all 0.18s; white-space: nowrap; font-weight: 500;
        }
        .topbar-pill:hover { background: var(--card-bg); color: var(--text); }
        .cta-btn {
          background: linear-gradient(135deg, #EAB308 0%, #f59e0b 50%, #d97706 100%);
          border: none; color: #000; border-radius: 99px; padding: 7px 18px;
          font-size: 12px; font-weight: 800; cursor: pointer; text-decoration: none;
          transition: all 0.18s; white-space: nowrap;
          box-shadow: 0 4px 20px rgba(234,179,8,0.35), inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .cta-btn:hover { box-shadow: 0 6px 28px rgba(234,179,8,0.55); transform: translateY(-1px); }
        .theme-toggle {
          display: flex; align-items: center; gap: 7px;
          background: var(--hover); border: 1px solid var(--border);
          border-radius: 99px; padding: 5px 10px; cursor: pointer;
          transition: all 0.18s; font-size: 12px; color: var(--text2); font-weight: 500;
        }
        .theme-toggle:hover { border-color: var(--gold); color: var(--gold); }
        .toggle-track {
          width: 32px; height: 18px; border-radius: 99px;
          position: relative; transition: background 0.25s; flex-shrink: 0;
        }
        .toggle-thumb {
          position: absolute; top: 2px; width: 14px; height: 14px;
          border-radius: 50%; background: #fff; transition: all 0.25s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .page-content { animation: fadeUp 0.22s ease; }

        /* ── BOTTOM NAV ── */
        .bottom-nav-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px; flex: 1; padding: 8px 4px; cursor: pointer;
          text-decoration: none; transition: all 0.15s; border: none; background: none;
          -webkit-tap-highlight-color: transparent; min-height: 56px;
        }
        .bottom-nav-item .icon { font-size: 20px; transition: transform 0.15s; }
        .bottom-nav-item .label { font-size: 10px; font-weight: 500; transition: color 0.15s; }
        .bottom-nav-item:active .icon { transform: scale(0.88); }
        .bottom-nav-item.active .icon { filter: drop-shadow(0 0 6px rgba(234,179,8,0.6)); }

        /* More menu */
        .more-menu-item {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; text-decoration: none; font-size: 14px;
          transition: background 0.15s; -webkit-tap-highlight-color: transparent;
          border-radius: 10px; margin: 2px 8px;
        }
        .more-menu-item:active { background: var(--hover); }

        /* Mobile page padding — accounts for bottom nav */
        @media (max-width: 767px) {
          .mobile-page-padding { padding-bottom: 80px !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: "'Inter',system-ui,-apple-system,sans-serif", color: t.text, transition: 'background 0.3s,color 0.3s' }}>

        {/* Mobile overlay for sidebar */}
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 29, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
        )}

        {/* More menu overlay */}
        {isMobile && showMoreMenu && (
          <div onClick={() => setShowMoreMenu(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
        )}

        {/* ── SIDEBAR (desktop only) ── */}
        {!isMobile && (
          <aside style={{
            width: 232, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 30,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex', flexDirection: 'column',
            background: t.sidebar, borderRight: `1px solid ${t.sidebarBorder}`,
            boxShadow: sidebarOpen ? t.shadow : 'none',
          }}>
            <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${t.divider}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="AamirandSons-Logo.png" alt="Aamir & Sons" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: t.brandTitle, letterSpacing: '0.04em' }}>AAMIR & SONS</div>
                  <div style={{ fontSize: 9.5, color: t.brandSub, letterSpacing: '0.1em', fontWeight: 500, marginTop: 1 }}>TRADING LTD.</div>
                </div>
              </div>
              <div style={{ marginTop: 18, height: 1, background: `linear-gradient(90deg,rgba(234,179,8,${dark ? '0.4' : '0.6'}),transparent)` }} />
            </div>

            <nav style={{ padding: '16px 10px', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: 9.5, color: t.mutedtext, padding: '0 14px', marginBottom: 12, letterSpacing: '0.15em', fontWeight: 700 }}>NAVIGATION</div>
              {navItems.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <a key={item.label} href={item.href} className={`nav-link${isActive ? ' active' : ''}`}>
                    <span style={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isActive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 10px var(--gold),0 0 20px rgba(234,179,8,0.4)', flexShrink: 0, animation: 'shimmer 2s ease infinite' }} />}
                  </a>
                )
              })}
            </nav>

            <div style={{ padding: '14px 12px', borderTop: `1px solid ${t.divider}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: t.userCardBg, border: `1px solid ${t.userCardBorder}` }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#EAB308,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#000', boxShadow: '0 3px 12px rgba(234,179,8,0.4)' }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: t.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                  <div style={{ fontSize: 10, color: '#22c55e', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block' }} /> Online
                  </div>
                </div>
                <button onClick={handleSignOut} title="Sign out" style={{ background: 'none', border: 'none', color: t.mutedtext, cursor: 'pointer', fontSize: 16, padding: '3px', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = t.mutedtext)}>⎋</button>
              </div>
            </div>
          </aside>
        )}

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: (!isMobile && sidebarOpen) ? 232 : 0, transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)' }}>

          {/* Topbar */}
          <header style={{
            height: isMobile ? 52 : 58, flexShrink: 0, position: 'sticky', top: 0, zIndex: 20,
            background: t.topbar, borderBottom: `1px solid ${t.topbarBorder}`,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 20px',
            boxShadow: dark ? '0 1px 0 rgba(255,255,255,0.04),0 8px 32px rgba(0,0,0,0.4)' : '0 1px 0 rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
              {/* On mobile show logo instead of hamburger */}
              {isMobile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/AamirandSons-Logo.png" alt="Aamir & Sons" style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                    {currentPage?.label || 'Aamir & Sons'}
                  </span>
                </div>
              ) : (
                <>
                  <button onClick={() => setSidebarOpen(s => !s)}
                    style={{ background: 'none', border: 'none', color: t.subtext, cursor: 'pointer', fontSize: 18, padding: '6px 8px', borderRadius: 8, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-dim)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = t.subtext; e.currentTarget.style.background = 'none' }}>☰</button>
                  {currentPage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: t.mutedtext, fontSize: 14 }}>/</span>
                      <span style={{ fontSize: 13, color: t.subtext, fontWeight: 600 }}>{currentPage.label}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
              {!isMobile && <a href="/calculator" className="topbar-pill">📈 Profit Sim</a>}
              <a href="/truck-intake" className="cta-btn">+ {isMobile ? 'Intake' : 'New Intake'}</a>

              <button onClick={() => setDark(d => !d)} className="theme-toggle" title={dark ? 'Light mode' : 'Dark mode'}>
                <span style={{ fontSize: 14 }}>{dark ? '☀️' : '🌙'}</span>
                {!isMobile && (
                  <>
                    <span>{dark ? 'Light' : 'Dark'}</span>
                    <div className="toggle-track" style={{ background: dark ? '#EAB30855' : '#00000022' }}>
                      <div className="toggle-thumb" style={{ left: dark ? '14px' : '2px', background: dark ? '#EAB308' : '#888' }} />
                    </div>
                  </>
                )}
              </button>

              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: `1px solid ${t.divider}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#EAB308,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#000', boxShadow: '0 3px 14px rgba(234,179,8,0.4)' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, color: t.subtext, fontWeight: 500 }}>{displayName}</span>
                  <button onClick={handleSignOut} title="Sign out" style={{ background: 'none', border: 'none', color: t.mutedtext, cursor: 'pointer', fontSize: 13, padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = t.mutedtext)}>⎋</button>
                </div>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className={`page-content${isMobile ? ' mobile-page-padding' : ''}`} style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', transition: 'background 0.3s' }}>
            {children}
          </main>
        </div>

        {/* ── BOTTOM NAV (mobile only) ── */}
        {isMobile && (
          <>
            {/* More menu popup */}
            {showMoreMenu && (
              <div style={{
                position: 'fixed', bottom: 70, left: 12, right: 12, zIndex: 50,
                background: t.moreMenu, border: `1px solid ${t.moreMenuBorder}`,
                borderRadius: 20, padding: '12px 0',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
                animation: 'slideUp 0.2s ease',
              }}>
                {/* User info at top */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px 16px', borderBottom: `1px solid ${t.divider}`, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#EAB308,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#000' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{displayName}</div>
                    <div style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Online
                    </div>
                  </div>
                </div>

                {/* Extra nav items */}
                {[
                  { label: 'Invoices', icon: '🧾', href: '/invoices' },
                  { label: 'Calculator', icon: '⚙', href: '/calculator' },
                  { label: 'Settings', icon: '⚙', href: '/settings' },
                  { label: 'Tutorial', icon: '📖', href: '/Tutorial' },
                ].map(item => (
                  <a key={item.label} href={item.href} className="more-menu-item"
                    style={{ color: pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? 'var(--gold)' : t.text }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{item.icon}</span>
                    <span style={{ fontWeight: 500 }}>{item.label}</span>
                    {(pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) && (
                      <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
                    )}
                  </a>
                ))}

                {/* Sign out */}
                <div style={{ margin: '8px 0 0', borderTop: `1px solid ${t.divider}`, paddingTop: 8 }}>
                  <button onClick={handleSignOut} className="more-menu-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', textAlign: 'left' }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>⎋</span>
                    <span style={{ fontWeight: 500 }}>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom nav bar */}
            <nav style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
              background: t.bottomNav, borderTop: `1px solid ${t.bottomNavBorder}`,
              display: 'flex', alignItems: 'center',
              paddingBottom: 'env(safe-area-inset-bottom)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
            }}>
              {[
                { label: 'Dashboard', icon: '⊞', href: '/' },
                { label: 'Inventory', icon: '☰', href: '/inventory' },
                { label: 'Intake', icon: '📋', href: '/truck-intake' },
                { label: 'Reports', icon: '📊', href: '/reports' },
              ].map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <a key={item.label} href={item.href} className={`bottom-nav-item${isActive ? ' active' : ''}`}>
                    <span className="icon" style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(234,179,8,0.7))' : 'none' }}>{item.icon}</span>
                    <span className="label" style={{ color: isActive ? 'var(--gold)' : t.subtext }}>{item.label}</span>
                  </a>
                )
              })}

              {/* More button */}
              <button onClick={() => setShowMoreMenu(m => !m)} className={`bottom-nav-item${showMoreMenu ? ' active' : ''}`} style={{ border: 'none', cursor: 'pointer' }}>
                <span className="icon" style={{ fontSize: 18, color: showMoreMenu ? 'var(--gold)' : t.subtext, fontWeight: 700, letterSpacing: 2 }}>•••</span>
                <span className="label" style={{ color: showMoreMenu ? 'var(--gold)' : t.subtext }}>More</span>
              </button>
            </nav>
          </>
        )}
      </div>
    </>
  )
}