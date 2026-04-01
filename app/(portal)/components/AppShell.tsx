'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useUser } from '@/lib/useUser'

const navItems = [
  { label: 'Dashboard',         icon: '⊞',  href: '/dashboard' },
  { label: 'Inventory',         icon: '🚛', href: '/inventory' },
  { label: 'Truck Acquisition', icon: '📋', href: '/truck-intake' },
  { label: 'Invoices',          icon: '🧾', href: '/invoices' },
  { label: 'Reports',           icon: '📊', href: '/reports' },
  { label: 'Calculator',        icon: '🧮', href: '/calculator' },
  { label: 'Settings',          icon: '⚙️',  href: '/settings' },
  { label: 'Tutorial',          icon: '📖', href: '/Tutorial' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [dark, setDark] = useState(false) // ← DEFAULT LIGHT
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    // Default to light if no preference saved
    setDark(saved === 'dark')
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
    if (isMobile) { setSidebarOpen(false); setShowMoreMenu(false) }
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: dark ? '#0a0a0a' : '#f0f0eb' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '3px solid transparent', borderTopColor: '#EAB308', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ color: dark ? '#aaa' : '#555', fontSize: 14, fontFamily: 'system-ui' }}>Loading...</span>
      </div>
    </div>
  )
  if (!user) return null

  const currentPage = navItems.find(n => n.href === pathname || (n.href !== '/dashboard' && pathname.startsWith(n.href)))

  // ── THEME TOKENS ── bright & readable in both modes
  const t = {
    // Light: clean white/cream. Dark: dark but NOT pitch black
    bg:              dark ? '#111318' : '#f0f0eb',
    sidebar:         dark ? '#1a1d24' : '#ffffff',
    sidebarBorder:   dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    topbar:          dark ? 'rgba(26,29,36,0.97)' : 'rgba(255,255,255,0.97)',
    topbarBorder:    dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    bottomNav:       dark ? 'rgba(20,22,28,0.98)' : 'rgba(255,255,255,0.98)',
    bottomNavBorder: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    navActive:       dark ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.12)',
    text:            dark ? '#f0f0f0' : '#111111',   // bright white / near black
    subtext:         dark ? '#aaaaaa' : '#444444',   // readable grey
    mutedtext:       dark ? '#666666' : '#888888',
    brandTitle:      dark ? '#ffffff' : '#111111',
    brandSub:        dark ? '#888888' : '#888888',
    divider:         dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    userCardBg:      dark ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.08)',
    userCardBorder:  dark ? 'rgba(234,179,8,0.2)'  : 'rgba(234,179,8,0.3)',
    shadow:          dark ? '0 8px 40px rgba(0,0,0,0.6)' : '0 4px 24px rgba(0,0,0,0.12)',
    moreMenu:        dark ? '#1a1d24' : '#ffffff',
    moreMenuBorder:  dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    navColor:        dark ? '#888888' : '#666666',
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── CSS VARIABLES ── */
        :root[data-theme="dark"] {
          --bg: #111318; --surface: #1a1d24; --surface2: #1e2128;
          --border: rgba(255,255,255,0.09); --border2: rgba(255,255,255,0.05);
          --text: #f0f0f0; --text2: #aaaaaa; --text3: #666666; --text4: #444444;
          --gold: #EAB308; --gold-dim: rgba(234,179,8,0.15); --gold-glow: rgba(234,179,8,0.4);
          --green: #22c55e; --green-dim: rgba(34,197,94,0.15);
          --red: #ef4444; --red-dim: rgba(239,68,68,0.15);
          --orange: #f97316; --orange-dim: rgba(249,115,22,0.15);
          --blue: #38bdf8; --blue-dim: rgba(56,189,248,0.15);
          --card-bg: rgba(255,255,255,0.04); --card-border: rgba(255,255,255,0.09);
          --input-bg: #13151b; --input-border: rgba(255,255,255,0.12);
          --hover: rgba(255,255,255,0.05); --active: rgba(234,179,8,0.12);
          --shadow: 0 8px 40px rgba(0,0,0,0.5); --shadow-card: 0 2px 12px rgba(0,0,0,0.3);
        }
        :root[data-theme="light"] {
          --bg: #f0f0eb; --surface: #ffffff; --surface2: #f8f8f5;
          --border: rgba(0,0,0,0.1); --border2: rgba(0,0,0,0.06);
          --text: #111111; --text2: #444444; --text3: #888888; --text4: #bbbbbb;
          --gold: #ca8a04; --gold-dim: rgba(202,138,4,0.12); --gold-glow: rgba(202,138,4,0.35);
          --green: #16a34a; --green-dim: rgba(22,163,74,0.12);
          --red: #dc2626; --red-dim: rgba(220,38,38,0.12);
          --orange: #ea580c; --orange-dim: rgba(234,88,12,0.12);
          --blue: #0284c7; --blue-dim: rgba(2,132,199,0.12);
          --card-bg: #ffffff; --card-border: rgba(0,0,0,0.1);
          --input-bg: #ffffff; --input-border: rgba(0,0,0,0.15);
          --hover: rgba(0,0,0,0.04); --active: rgba(202,138,4,0.1);
          --shadow: 0 4px 24px rgba(0,0,0,0.1); --shadow-card: 0 2px 8px rgba(0,0,0,0.08);
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--gold); }

        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }

        body { background: var(--bg); color: var(--text); font-size: 14px; transition: background 0.3s, color 0.3s; }

        /* ── SIDEBAR NAV LINKS ── */
        .nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 10px; margin-bottom: 3px;
          cursor: pointer; text-decoration: none; font-size: 14px;
          border: 1px solid transparent; transition: all 0.18s ease;
          color: var(--text2); font-weight: 500; position: relative;
        }
        .nav-link:hover { color: var(--text); background: var(--hover); border-color: var(--border2); }
        .nav-link.active {
          color: var(--gold); font-weight: 700;
          background: var(--active); border-color: var(--gold-dim);
        }

        .topbar-pill {
          background: var(--hover); border: 1px solid var(--border);
          color: var(--text2); border-radius: 99px; padding: 7px 16px; font-size: 13px;
          cursor: pointer; text-decoration: none; display: flex; align-items: center;
          gap: 6px; transition: all 0.18s; white-space: nowrap; font-weight: 500;
        }
        .topbar-pill:hover { color: var(--text); background: var(--card-bg); }

        .cta-btn {
          background: linear-gradient(135deg, #EAB308, #d97706);
          border: none; color: #000; border-radius: 99px; padding: 8px 20px;
          font-size: 13px; font-weight: 800; cursor: pointer; text-decoration: none;
          transition: all 0.18s; white-space: nowrap;
          box-shadow: 0 4px 16px rgba(234,179,8,0.35);
        }
        .cta-btn:hover { box-shadow: 0 6px 24px rgba(234,179,8,0.5); transform: translateY(-1px); }

        .theme-toggle {
          display: flex; align-items: center; gap: 7px;
          background: var(--hover); border: 1px solid var(--border);
          border-radius: 99px; padding: 6px 12px; cursor: pointer;
          transition: all 0.18s; font-size: 13px; color: var(--text2); font-weight: 500;
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
        .bottom-nav-item .icon { font-size: 22px; transition: transform 0.15s; }
        .bottom-nav-item .label { font-size: 11px; font-weight: 600; }
        .bottom-nav-item:active .icon { transform: scale(0.88); }

        .more-menu-item {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; text-decoration: none; font-size: 15px;
          transition: background 0.15s; -webkit-tap-highlight-color: transparent;
          border-radius: 10px; margin: 2px 8px;
        }
        .more-menu-item:active { background: var(--hover); }

        @media (max-width: 767px) {
          .mobile-page-padding { padding-bottom: 80px !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: "'Inter',system-ui,-apple-system,sans-serif", color: t.text, transition: 'background 0.3s,color 0.3s' }}>

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 29, backdropFilter: 'blur(4px)' }} />
        )}
        {isMobile && showMoreMenu && (
          <div onClick={() => setShowMoreMenu(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 49 }} />
        )}

        {/* ── SIDEBAR ── */}
        {!isMobile && (
          <aside style={{
            width: 240, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 30,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex', flexDirection: 'column',
            background: t.sidebar,
            borderRight: `1px solid ${t.sidebarBorder}`,
            boxShadow: sidebarOpen ? t.shadow : 'none',
          }}>
            {/* Logo */}
            <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${t.divider}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="/AamirandSons-Logo.png" alt="Aamir & Sons" style={{ width: 42, height: 42, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: t.brandTitle, letterSpacing: '0.04em' }}>AAMIR & SONS</div>
                  <div style={{ fontSize: 10, color: t.brandSub, letterSpacing: '0.1em', fontWeight: 600, marginTop: 1 }}>TRADING LTD.</div>
                </div>
              </div>
              <div style={{ marginTop: 18, height: 1, background: `linear-gradient(90deg,var(--gold),transparent)`, opacity: 0.5 }} />
            </div>

            {/* Nav */}
            <nav style={{ padding: '16px 10px', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: 10, color: t.mutedtext, padding: '0 14px', marginBottom: 10, letterSpacing: '0.15em', fontWeight: 700 }}>NAVIGATION</div>
              {navItems.map(item => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <a key={item.label} href={item.href} className={`nav-link${isActive ? ' active' : ''}`}>
                    <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 8px var(--gold)', flexShrink: 0 }} />}
                  </a>
                )
              })}
            </nav>

            {/* User card */}
            <div style={{ padding: '14px 12px', borderTop: `1px solid ${t.divider}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: t.userCardBg, border: `1px solid ${t.userCardBorder}` }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#EAB308,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#000' }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: t.text, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: '#22c55e', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Online
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: (!isMobile && sidebarOpen) ? 240 : 0, transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)' }}>

          {/* Topbar */}
          <header style={{
            height: isMobile ? 54 : 60, flexShrink: 0, position: 'sticky', top: 0, zIndex: 20,
            background: t.topbar, borderBottom: `1px solid ${t.topbarBorder}`,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 24px',
            boxShadow: dark ? '0 1px 0 rgba(255,255,255,0.05),0 4px 20px rgba(0,0,0,0.3)' : '0 1px 0 rgba(0,0,0,0.08),0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isMobile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/AamirandSons-Logo.png" alt="Aamir & Sons" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{currentPage?.label || 'Aamir & Sons'}</span>
                </div>
              ) : (
                <>
                  <button onClick={() => setSidebarOpen(s => !s)}
                    style={{ background: 'none', border: 'none', color: t.subtext, cursor: 'pointer', fontSize: 20, padding: '6px 8px', borderRadius: 8, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = t.subtext }}>☰</button>
                  {currentPage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: t.mutedtext, fontSize: 16 }}>/</span>
                      <span style={{ fontSize: 15, color: t.text, fontWeight: 700 }}>{currentPage.label}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10 }}>
              {!isMobile && <a href="/calculator" className="topbar-pill">📈 Profit Sim</a>}
              <a href="/truck-intake" className="cta-btn">+ {isMobile ? 'Add' : 'New Acquisition'}</a>

              <button onClick={() => setDark(d => !d)} className="theme-toggle" title={dark ? 'Light mode' : 'Dark mode'}>
                <span style={{ fontSize: 15 }}>{dark ? '☀️' : '🌙'}</span>
                {!isMobile && (
                  <>
                    <span>{dark ? 'Light' : 'Dark'}</span>
                    <div className="toggle-track" style={{ background: dark ? '#EAB30855' : '#00000018' }}>
                      <div className="toggle-thumb" style={{ left: dark ? '14px' : '2px', background: dark ? '#EAB308' : '#999' }} />
                    </div>
                  </>
                )}
              </button>

              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: `1px solid ${t.divider}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#EAB308,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#000' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{displayName}</span>
                  <button onClick={handleSignOut} title="Sign out" style={{ background: 'none', border: 'none', color: t.mutedtext, cursor: 'pointer', fontSize: 14, padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s' }}
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

        {/* ── BOTTOM NAV (mobile) ── */}
        {isMobile && (
          <>
            {showMoreMenu && (
              <div style={{
                position: 'fixed', bottom: 70, left: 12, right: 12, zIndex: 50,
                background: t.moreMenu, border: `1px solid ${t.moreMenuBorder}`,
                borderRadius: 20, padding: '12px 0',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
                animation: 'slideUp 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px 16px', borderBottom: `1px solid ${t.divider}`, marginBottom: 8 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#EAB308,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#000' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{displayName}</div>
                    <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Online
                    </div>
                  </div>
                </div>
                {[
                  { label: 'Invoices',   icon: '🧾', href: '/invoices' },
                  { label: 'Calculator', icon: '🧮', href: '/calculator' },
                  { label: 'Settings',   icon: '⚙️',  href: '/settings' },
                  { label: 'Tutorial',   icon: '📖', href: '/Tutorial' },
                ].map(item => (
                  <a key={item.label} href={item.href} className="more-menu-item"
                    style={{ color: pathname.startsWith(item.href) ? 'var(--gold)' : t.text }}>
                    <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{item.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</span>
                  </a>
                ))}
                <div style={{ margin: '8px 0 0', borderTop: `1px solid ${t.divider}`, paddingTop: 8 }}>
                  <button onClick={handleSignOut} className="more-menu-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>⎋</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            <nav style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
              background: t.bottomNav, borderTop: `1px solid ${t.bottomNavBorder}`,
              display: 'flex', alignItems: 'center',
              paddingBottom: 'env(safe-area-inset-bottom)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            }}>
              {[
                { label: 'Dashboard', icon: '⊞', href: '/dashboard' },
                { label: 'Inventory', icon: '🚛', href: '/inventory' },
                { label: 'Intake',    icon: '📋', href: '/truck-intake' },
                { label: 'Reports',   icon: '📊', href: '/reports' },
              ].map(item => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <a key={item.label} href={item.href} className={`bottom-nav-item${isActive ? ' active' : ''}`}>
                    <span className="icon">{item.icon}</span>
                    <span className="label" style={{ color: isActive ? 'var(--gold)' : t.subtext }}>{item.label}</span>
                  </a>
                )
              })}
              <button onClick={() => setShowMoreMenu(m => !m)} className={`bottom-nav-item${showMoreMenu ? ' active' : ''}`} style={{ border: 'none', cursor: 'pointer', background: 'none' }}>
                <span className="icon" style={{ color: showMoreMenu ? 'var(--gold)' : t.subtext, fontWeight: 700, letterSpacing: 2, fontSize: 18 }}>•••</span>
                <span className="label" style={{ color: showMoreMenu ? 'var(--gold)' : t.subtext }}>More</span>
              </button>
            </nav>
          </>
        )}
      </div>
    </>
  )
}