import Link from 'next/link'

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#ffffff', color: '#0e0e0e', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* NAV */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 64px', height: '72px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderBottom: '1px solid #f0f0f0',
          backdropFilter: 'blur(12px)',
          boxSizing: 'border-box',
        }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#0e0e0e', textDecoration: 'none', letterSpacing: '-0.5px' }}>
            Aamir <span style={{ color: '#c9a84c' }}>&amp; Sons</span>
          </Link>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <Link href="/trucks" style={{ color: '#555', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Inventory</Link>
            <Link href="/sell-your-truck" style={{ color: '#555', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Sell</Link>
            <Link href="/about" style={{ color: '#555', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>About</Link>
            <Link href="/reach-us" style={{ color: '#555', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Contact</Link>
            <a href="tel:6475635783" style={{
              background: '#c9a84c', color: '#fff',
              padding: '10px 22px', borderRadius: '100px',
              textDecoration: 'none', fontSize: '13px', fontWeight: 700,
            }}>📞 Call Now</a>
          </div>
        </nav>

        <main style={{ paddingTop: '72px' }}>{children}</main>

        {/* FOOTER */}
        <footer style={{
          background: '#0e0e0e', color: '#fff',
          padding: '64px 64px 32px',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '48px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '20px', marginBottom: '12px' }}>Aamir <span style={{ color: '#c9a84c' }}>&amp; Sons</span></div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: '0 0 16px' }}>Premium used truck sales with a commitment to quality, transparency, and customer satisfaction.</p>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#c9a84c', marginBottom: '16px' }}>Navigate</div>
                {[['Inventory', '/trucks'], ['Sell Your Truck', '/sell-your-truck'], ['About', '/about'], ['Contact', '/reach-us']].map(([label, href]) => (
                  <div key={label} style={{ marginBottom: '10px' }}>
                    <Link href={href} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '14px' }}>{label}</Link>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#c9a84c', marginBottom: '16px' }}>Contact</div>
                {[
                  ['📞', '647-563-5783'],
                  ['📞', '647-285-4687'],
                  ['✉️', 'aamirandsons@hotmail.com'],
                  ['📍', '2 Blair Dr, Brampton ON, L6T 2H5'],
                  ['🕐', 'Mon–Sat: 9am–6pm'],
                ].map(([icon, val]) => (
                  <div key={val} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>{icon} {val}</div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>© 2025 Aamir & Sons Trading Ltd. All rights reserved.</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>2 Blair Dr, Brampton ON, L6T 2H5</span>
            </div>
          </div>
        </footer>

      </body>
    </html>
  )
}