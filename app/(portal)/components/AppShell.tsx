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
  const [isMobile, setIsMobile]       = useState(false)
  const [dark, setDark]               = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()
  const { user, loading } = useUser()
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: dark ? '#0f1117' : '#f4f4ef' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '3px solid transparent', borderTopColor: '#EAB308', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ color: dark ? '#ccc' : '#555', fontSize: 14, fontFamily: 'system-ui' }}>Loading...</span>
      </div>
    </div>
  )

  if (!user) return null

  const currentPage = navItems.find(n =>
    n.href === pathname || (n.href !== '/dashboard' && pathname.startsWith(n.href))
  )

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── DARK THEME ── */
        :root[data-theme="dark"] {
          --bg:           #0f1117;
          --surface:      #181b22;
          --surface2:     #1e2128;
          --border:       rgba(255,255,255,0.1);
          --border2:      rgba(255,255,255,0.06);
          --text:         #f2f2f2;
          --text2:        #c0c0c0;
          --text3:        #888;
          --text4:        #555;
          --gold:         #EAB308;
          --gold-dim:     rgba(234,179,8,0.18);
          --gold-glow:    rgba(234,179,8,0.45);
          --green:        #22c55e; --green-dim:  rgba(34,197,94,0.15);
          --red:          #ef4444; --red-dim:    rgba(239,68,68,0.15);
          --orange:       #f97316; --orange-dim: rgba(249,115,22,0.15);
          --blue:         #38bdf8; --blue-dim:   rgba(56,189,248,0.15);
          --card-bg:      rgba(255,255,255,0.05);
          --card-border:  rgba(255,255,255,0.1);
          --input-bg:     #13151c;
          --input-border: rgba(255,255,255,0.14);
          --hover:        rgba(255,255,255,0.06);
          --active:       rgba(234,179,8,0.14);
          --shadow:       0 8px 40px rgba(0,0,0,0.5);
          --shadow-card:  0 2px 12px rgba(0,0,0,0.35);
        }

        /* ── LIGHT THEME ── */
        :root[data-theme="light"] {
          --bg:           #f4f4ef;
          --surface:      #ffffff;
          --surface2:     #f9f9f6;
          --border:       rgba(0,0,0,0.1);
          --border2:      rgba(0,0,0,0.06);
          --text:         #0f0f0f;
          --text2:        #3a3a3a;
          --text3:        #777;
          --text4:        #bbb;
          --gold:         #b45309;
          --gold-dim:     rgba(180,83,9,0.1);
          --gold-glow:    rgba(180,83,9,0.3);
          --green:        #15803d; --green-dim:  rgba(21,128,61,0.12);
          --red:          #b91c1c; --red-dim:    rgba(185,28,28,0.12);
          --orange:       #c2410c; --orange-dim: rgba(194,65,12,0.12);
          --blue:         #0369a1; --blue-dim:   rgba(3,105,161,0.12);
          --card-bg:      #ffffff;
          --card-border:  rgba(0,0,0,0.1);
          --input-bg:     #ffffff;
          --input-border: rgba(0,0,0,0.15);
          --hover:        rgba(0,0,0,0.04);
          --active:       rgba(180,83,9,0.08);
          --shadow:       0 4px 24px rgba(0,0,0,0.1);
          --shadow-card:  0 2px 8px rgba(0,0,0,0.07);
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--gold); }

        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }

        html, body { height: 100%; }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 15px;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          transition: background 0.25s, color 0.25s;
        }

        /* ── NAV LINKS ── */
        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 16px;
          border-radius: 10px;
          margin-bottom: 2px;
          cursor: pointer;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          color: var(--text2);
          border: 1px solid transparent;
          transition: all 0.15s ease;
          position: relative;
          letter-spacing: 0.01em;
        }
        .nav-link:hover {
          color: var(--text);
          background: var(--hover);
        }
        .nav-link.active {
          color: var(--gold);
          font-weight: 700;
          background: var(--gold-dim);
          border-color: rgba(234,179,8,0.2);
        }

        /* ── TOPBAR ELEMENTS ── */
        .topbar-pill {
          background: var(--hover);
          border: 1px solid var(--border);
          color: var(--text2);
          border-radius: 99px;
          padding: 7px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .topbar-pill:hover { color: var(--text); border-color: var(--gold); }

        .cta-btn {
          background: linear-gradient(135deg, #EAB308, #d97706);
          border: none;
          color: #000;
          border-radius: 99px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.18s;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(234,179,8,0.35);
          letter-spacing: 0.01em;
        }
        .cta-btn:hover { box-shadow: 0 6px 24px rgba(234,179,8,0.5); transform: translateY(-1px); }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 7px;
          background: var(--hover);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 13px;
          color: var(--text2);
          font-weight: 500;
        }
        .theme-toggle:hover { border-color: var(--gold); color: var(--gold); }

        .toggle-track {
          width: 30px; height: 17px;
          border-radius: 99px;
          position: relative;
          transition: background 0.25s;
          flex-shrink: 0;
        }
        .toggle-thumb {
          position: absolute; top: 2px;
          width: 13px; height: 13px;
          border-radius: 50%;
          background: #fff;
          transition: all 0.25s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .page-content { animation: fadeUp 0.2s ease; }

        /* ── BOTTOM NAV ── */
        .bottom-nav-item {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 3px; flex: 1; padding: 8px 4px;
          cursor: pointer; text-decoration: none;
          transition: all 0.15s; border: none; background: none;
          -webkit-tap-highlight-color: transparent;
          min-height: 56px;
        }
        .bottom-nav-item .icon { font-size: 22px; transition: transform 0.15s; }
        .bottom-nav-item .label { font-size: 10px; font-weight: 600; letter-spacing: 0.02em; }
        .bottom-nav-item:active .icon { transform: scale(0.88); }

        .more-menu-item {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 20px; text-decoration: none;
          font-size: 15px; font-weight: 500;
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
          border-radius: 10px; margin: 2px 8px;
          color: var(--text);
        }
        .more-menu-item:active { background: var(--hover); }

        @media (max-width: 767px) {
          .mobile-page-padding { padding-bottom: 80px !important; }
        }
      `}</style>

      <div style={{
        display: 'flex', minHeight: '100vh',
        background: 'var(--bg)', color: 'var(--text)',
        transition: 'background 0.25s, color 0.25s',
      }}>

        {/* Mobile overlays */}
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 29, backdropFilter: 'blur(4px)' }} />
        )}
        {isMobile && showMoreMenu && (
          <div onClick={() => setShowMoreMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
        )}

        {/* ── SIDEBAR ── */}
        {!isMobile && (
          <aside style={{
            width: 248,
            position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 30,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex', flexDirection: 'column',
            background: dark ? '#181b22' : '#ffffff',
            borderRight: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
            boxShadow: dark ? '4px 0 24px rgba(0,0,0,0.4)' : '4px 0 24px rgba(0,0,0,0.06)',
          }}>

            {/* Brand */}
            <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="/AamirandSons-Logo.png" alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 10, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: dark ? '#ffffff' : '#0f0f0f', letterSpacing: '0.05em' }}>AAMIR & SONS</div>
                  <div style={{ fontSize: 10, color: dark ? '#888' : '#999', letterSpacing: '0.1em', fontWeight: 600, marginTop: 2 }}>TRADING LTD.</div>
                </div>
              </div>
              <div style={{ marginTop: 16, height: 1.5, borderRadius: 99, background: 'linear-gradient(90deg, #EAB308, transparent)', opacity: dark ? 0.6 : 0.4 }} />
            </div>

            {/* Nav items */}
            <nav style={{ padding: '14px 10px', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: 10, color: dark ? '#666' : '#aaa', padding: '0 16px', marginBottom: 10, letterSpacing: '0.18em', fontWeight: 700 }}>NAVIGATION</div>
              {navItems.map(item => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <a key={item.label} href={item.href} className={`nav-link${isActive ? ' active' : ''}`}>
                    <span style={{ fontSize: 17, width: 26, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isActive && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 8px var(--gold)', flexShrink: 0 }} />
                    )}
                  </a>
                )
              })}
            </nav>

            {/* User card */}
            <div style={{ padding: '12px', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}` }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12,
                background: dark ? 'rgba(234,179,8,0.07)' : 'rgba(234,179,8,0.07)',
                border: `1px solid ${dark ? 'rgba(234,179,8,0.18)' : 'rgba(234,179,8,0.25)'}`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#EAB308,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#000', boxShadow: '0 2px 10px rgba(234,179,8,0.35)' }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: dark ? '#f2f2f2' : '#0f0f0f', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: '#22c55e', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Online
                  </div>
                </div>
                <button onClick={handleSignOut} title="Sign out"
                  style={{ background: 'none', border: 'none', color: dark ? '#666' : '#bbb', cursor: 'pointer', fontSize: 18, padding: '3px', lineHeight: 1, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = dark ? '#666' : '#bbb')}>⎋</button>
              </div>
            </div>
          </aside>
        )}

        {/* ── MAIN AREA ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
          marginLeft: (!isMobile && sidebarOpen) ? 248 : 0,
          transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>

          {/* Topbar */}
          <header style={{
            height: isMobile ? 54 : 62, flexShrink: 0,
            position: 'sticky', top: 0, zIndex: 20,
            background: dark ? 'rgba(24,27,34,0.97)' : 'rgba(255,255,255,0.97)',
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 24px',
            boxShadow: dark ? '0 2px 20px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.06)',
          }}>

            {/* Left side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isMobile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src="/AamirandSons-Logo.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: dark ? '#f2f2f2' : '#0f0f0f' }}>{currentPage?.label || 'Aamir & Sons'}</span>
                </div>
              ) : (
                <>
                  <button onClick={() => setSidebarOpen(s => !s)}
                    style={{ background: 'none', border: 'none', color: dark ? '#aaa' : '#666', cursor: 'pointer', fontSize: 20, padding: '6px 8px', borderRadius: 8, transition: 'color 0.15s', lineHeight: 1 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#EAB308')}
                    onMouseLeave={e => (e.currentTarget.style.color = dark ? '#aaa' : '#666')}>☰</button>
                  {currentPage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: dark ? '#555' : '#ccc', fontSize: 18 }}>/</span>
                      <span style={{ fontSize: 16, color: dark ? '#f2f2f2' : '#0f0f0f', fontWeight: 700 }}>{currentPage.label}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!isMobile && <a href="/calculator" className="topbar-pill">📈 Profit Sim</a>}
              <a href="/truck-intake" className="cta-btn">+ {isMobile ? 'Add' : 'New Acquisition'}</a>

              {/* Theme toggle */}
              <button onClick={() => setDark(d => !d)} className="theme-toggle" title={dark ? 'Switch to light' : 'Switch to dark'}>
                <span style={{ fontSize: 15 }}>{dark ? '☀️' : '🌙'}</span>
                {!isMobile && (
                  <>
                    <span>{dark ? 'Light' : 'Dark'}</span>
                    <div className="toggle-track" style={{ background: dark ? 'rgba(234,179,8,0.4)' : 'rgba(0,0,0,0.15)' }}>
                      <div className="toggle-thumb" style={{ left: dark ? '15px' : '2px', background: dark ? '#EAB308' : '#999' }} />
                    </div>
                  </>
                )}
              </button>

              {/* User chip */}
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#EAB308,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#000' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, color: dark ? '#f2f2f2' : '#0f0f0f', fontWeight: 600 }}>{displayName}</span>
                  <button onClick={handleSignOut} title="Sign out"
                    style={{ background: 'none', border: 'none', color: dark ? '#666' : '#bbb', cursor: 'pointer', fontSize: 15, padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s', lineHeight: 1 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = dark ? '#666' : '#bbb')}>⎋</button>
                </div>
              )}
            </div>
          </header>

          {/* Page */}
          <main className={`page-content${isMobile ? ' mobile-page-padding' : ''}`}
            style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', transition: 'background 0.25s' }}>
            {children}
          </main>
        </div>

        {/* ── BOTTOM NAV (mobile only) ── */}
        {isMobile && (
          <>
            {/* More menu */}
            {showMoreMenu && (
              <div style={{
                position: 'fixed', bottom: 70, left: 12, right: 12, zIndex: 50,
                background: dark ? '#1e2128' : '#ffffff',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: 20, padding: '12px 0',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
                animation: 'slideUp 0.2s ease',
              }}>
                {/* User */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px 14px', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, marginBottom: 6 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#EAB308,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: dark ? '#f2f2f2' : '#0f0f0f' }}>{displayName}</div>
                    <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
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
                    style={{ color: pathname.startsWith(item.href) ? 'var(--gold)' : (dark ? '#f2f2f2' : '#0f0f0f') }}>
                    <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{item.icon}</span>
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                  </a>
                ))}

                <div style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, margin: '6px 0 0', paddingTop: 6 }}>
                  <button onClick={handleSignOut} className="more-menu-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>⎋</span>
                    <span style={{ fontWeight: 600 }}>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom bar */}
            <nav style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
              background: dark ? 'rgba(24,27,34,0.98)' : 'rgba(255,255,255,0.98)',
              borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
              display: 'flex', alignItems: 'center',
              paddingBottom: 'env(safe-area-inset-bottom)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
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
                    <span className="label" style={{ color: isActive ? 'var(--gold)' : (dark ? '#888' : '#999') }}>{item.label}</span>
                  </a>
                )
              })}
              <button onClick={() => setShowMoreMenu(m => !m)}
                className={`bottom-nav-item${showMoreMenu ? ' active' : ''}`}
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <span className="icon" style={{ color: showMoreMenu ? 'var(--gold)' : (dark ? '#888' : '#999'), fontWeight: 700, letterSpacing: 2, fontSize: 18 }}>•••</span>
                <span className="label" style={{ color: showMoreMenu ? 'var(--gold)' : (dark ? '#888' : '#999') }}>More</span>
              </button>
            </nav>
          </>
        )}
      </div>
    </>
  )
}