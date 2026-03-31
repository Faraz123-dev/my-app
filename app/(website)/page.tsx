'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#ffffff', color: '#0e0e0e' }}>

      {/* HERO */}
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        padding: '120px 64px 80px',
        background: 'linear-gradient(135deg, #ffffff 0%, #faf8f4 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Gold accent line */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: '4px', background: '#c9a84c',
        }} />
        {/* Faint background text */}
        <div style={{
          position: 'absolute', right: '-20px', bottom: '-60px',
          fontSize: '280px', fontWeight: 900, color: 'rgba(201,168,76,0.04)',
          lineHeight: 1, userSelect: 'none', letterSpacing: '-10px',
        }}>TRUCKS</div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#fdf6e3',
              border: '1px solid rgba(201,168,76,0.3)',
              color: '#a07830',
              fontSize: '11px', fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase',
              padding: '6px 16px', borderRadius: '100px',
              marginBottom: '32px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c9a84c', display: 'inline-block' }} />
              Brampton & Toronto · Est. 2010
            </div>

            <h1 style={{
              fontSize: 'clamp(52px, 7vw, 88px)',
              fontWeight: 800, lineHeight: 1.0,
              letterSpacing: '-2px',
              color: '#0e0e0e',
              margin: '0 0 24px',
            }}>
              Reliable Trucks.<br />
              <span style={{ color: '#c9a84c' }}>Unmatched</span><br />
              Value.
            </h1>

            <p style={{
              fontSize: '18px', fontWeight: 400,
              color: '#6b6b6b', maxWidth: '460px',
              marginBottom: '44px', lineHeight: 1.7,
            }}>
              Family-owned. Brampton-based. Every truck inspected in our own shop before it reaches you.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/trucks" style={{
                background: '#c9a84c', color: '#fff',
                padding: '16px 36px', fontSize: '14px', fontWeight: 700,
                letterSpacing: '0.5px',
                textDecoration: 'none', borderRadius: '100px',
                transition: 'background 0.2s',
              }}>
                Browse Inventory →
              </Link>
              <Link href="/reach-us" style={{
                background: 'transparent',
                border: '1.5px solid #0e0e0e',
                color: '#0e0e0e',
                padding: '16px 36px', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none', borderRadius: '100px',
              }}>
                Get in Touch
              </Link>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex', gap: '48px',
              marginTop: '72px', paddingTop: '48px',
              borderTop: '1px solid #e8e8e8',
              flexWrap: 'wrap',
            }}>
              {[
                { num: '500+', label: 'Trucks Sold' },
                { num: '30+', label: 'Years Experience' },
                { num: '98%', label: 'Client Satisfaction' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '40px', fontWeight: 800, color: '#c9a84c', lineHeight: 1, letterSpacing: '-1px' }}>{s.num}</div>
                  <div style={{ fontSize: '12px', color: '#999', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '6px', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TRUST BAR */}
      <div style={{
        background: '#0e0e0e', padding: '20px 64px',
        display: 'flex', justifyContent: 'center', gap: '48px',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        {[
          '✓  Every Truck Inspected',
          '✓  In-House Shop',
          '✓  Transparent Pricing',
          '✓  GTA Delivery Available',
        ].map(t => (
          <span key={t} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px' }}>{t}</span>
        ))}
      </div>

      {/* FEATURED TRUCKS */}
      <div style={{ padding: '96px 64px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#c9a84c', marginBottom: '10px' }}>Our Inventory</div>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Featured Trucks</h2>
            </div>
            <Link href="/trucks" style={{ color: '#c9a84c', fontSize: '14px', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid #c9a84c', paddingBottom: '2px' }}>
              View All →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[
              { year: '2020', make: 'Freightliner', model: 'Cascadia', km: '921,940', hp: '475', trans: 'Automatic', price: '$46,000', status: 'Sold' },
              { year: '2019', make: 'Freightliner', model: 'Cascadia Daycab', km: '583,251', hp: '505', trans: 'Automatic', price: '$35,000', status: 'Sold' },
              { year: '2019', make: 'Volvo', model: 'VNL', km: '672,457', hp: '455', trans: 'Automatic', price: '$32,000', status: 'Available' },
            ].map(t => (
              <div key={t.model + t.year} style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                }}
              >
                {/* Image placeholder */}
                <div style={{
                  height: '200px', background: '#f5f5f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <span style={{ fontSize: '48px', opacity: 0.2 }}>🚛</span>
                  <div style={{
                    position: 'absolute', top: '12px', left: '12px',
                    background: t.status === 'Available' ? '#c9a84c' : '#0e0e0e',
                    color: '#fff', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '1px', textTransform: 'uppercase',
                    padding: '4px 12px', borderRadius: '100px',
                  }}>{t.status}</div>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ fontSize: '12px', color: '#999', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>{t.year}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '14px' }}>{t.make} {t.model}</div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {[`${t.km} km`, `${t.hp} HP`, t.trans].map(spec => (
                      <span key={spec} style={{ fontSize: '12px', color: '#666', background: '#f5f5f5', padding: '4px 10px', borderRadius: '100px' }}>{spec}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#c9a84c', letterSpacing: '-0.5px' }}>{t.price}</div>
                    <Link href="/reach-us" style={{
                      background: '#0e0e0e', color: '#fff',
                      padding: '8px 20px', borderRadius: '100px',
                      fontSize: '12px', fontWeight: 600,
                      textDecoration: 'none',
                    }}>Inquire</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY US */}
      <div style={{ padding: '96px 64px', background: '#faf8f4' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#c9a84c', marginBottom: '10px' }}>Why Choose Us</div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 16px' }}>What Sets Aamir & Sons Apart</h2>
            <p style={{ fontSize: '16px', color: '#6b6b6b', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>We make truck buying simple and reliable — backed by decades of family expertise.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
            {[
              { icon: '🔍', title: 'Every Truck Inspected', desc: 'Multi-point inspection in our own facility before any truck reaches the lot.' },
              { icon: '🛠️', title: 'In-House Shop', desc: 'Our certified mechanics handle everything from routine maintenance to full overhauls.' },
              { icon: '💬', title: 'Transparent Pricing', desc: 'No hidden fees. No bait-and-switch. The number you see is the number we talk.' },
              { icon: '🔔', title: 'Truck Alerts', desc: 'Tell us what you need. We\'ll call you the moment the right truck comes in.' },
            ].map(f => (
              <div key={f.title} style={{
                background: '#fff', borderRadius: '16px',
                padding: '32px 28px',
                border: '1px solid #eee',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '16px' }}>{f.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>{f.title}</div>
                <div style={{ fontSize: '14px', color: '#6b6b6b', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA BANNER */}
      <div style={{
        padding: '96px 64px',
        background: '#0e0e0e',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800,
            color: '#fff', letterSpacing: '-1px',
            margin: '0 0 16px', lineHeight: 1.1,
          }}>
            Whether you're buying your first truck or expanding a fleet —
            <span style={{ color: '#c9a84c' }}> we've got you covered.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', marginBottom: '40px', lineHeight: 1.7 }}>
            Call us at 647-563-5783 or browse our current inventory online.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/trucks" style={{
              background: '#c9a84c', color: '#fff',
              padding: '16px 36px', fontSize: '14px', fontWeight: 700,
              textDecoration: 'none', borderRadius: '100px',
            }}>Browse Inventory →</Link>
            <a href="tel:6475635783" style={{
              background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)',
              color: '#fff', padding: '16px 36px', fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', borderRadius: '100px',
            }}>📞 647-563-5783</a>
          </div>
        </div>
      </div>

    </div>
  )
}