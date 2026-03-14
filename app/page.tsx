'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string; status: string; bought_on: string | null; vin: string
  make: string | null; model: string | null; year: number | null
  purchase_price: number | null; recondition_cost: number | null
  date_sold: string | null; sold_price: number | null; customer: string | null
  payment_status: string | null; kilometers: number | null
}

function getMonthKey(d: string | null) {
  if (!d) return null
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return null
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}
function fmtMonth(key: string) {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export default function DashboardPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<6 | 12 | 24>(12)
  const [hovBar, setHovBar] = useState<number | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; label: string; profit: number; count: number } | null>(null)
  const [hovDonut, setHovDonut] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadData() }, [])
  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('Inventory Data').select('id,status,bought_on,vin,make,model,year,purchase_price,recondition_cost,date_sold,sold_price,customer,payment_status,kilometers')
    setTrucks(data || [])
    setLoading(false)
  }

  const inStock = trucks.filter(t => t.status !== 'Sold').length
  const soldTotal = trucks.filter(t => t.status === 'Sold').length
  const cashTiedUp = trucks.filter(t => t.status !== 'Sold').reduce((s, t) => s + (t.purchase_price || 0) + (t.recondition_cost || 0), 0)
  const pending = trucks.filter(t => t.payment_status === 'Unpaid')
  const pendingAmt = pending.reduce((s, t) => s + (t.sold_price || 0), 0)
  const now = new Date()
  const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthProfit = trucks.filter(t => t.status === 'Sold' && getMonthKey(t.date_sold) === thisKey)
    .reduce((s, t) => s + (t.sold_price || 0) - ((t.purchase_price || 0) + (t.recondition_cost || 0)), 0)

  const byMonth: Record<string, { profit: number; count: number; revenue: number }> = {}
  trucks.filter(t => t.status === 'Sold' && t.date_sold).forEach(t => {
    const k = getMonthKey(t.date_sold)!
    if (!k) return
    if (!byMonth[k]) byMonth[k] = { profit: 0, count: 0, revenue: 0 }
    byMonth[k].profit += (t.sold_price || 0) - ((t.purchase_price || 0) + (t.recondition_cost || 0))
    byMonth[k].count++
    byMonth[k].revenue += (t.sold_price || 0)
  })
  const months = Object.keys(byMonth).sort().slice(-range)
  const maxP = Math.max(...months.map(k => Math.abs(byMonth[k].profit)), 1)
  const totProfit = months.reduce((s, k) => s + byMonth[k].profit, 0)
  const totRevenue = months.reduce((s, k) => s + byMonth[k].revenue, 0)

  const agingBuckets = { '0-15d': 0, '16-30d': 0, '31-60d': 0, '60+d': 0 }
  const agingList: (Truck & { days: number })[] = []
  trucks.filter(t => t.status !== 'Sold' && t.bought_on).forEach(t => {
    const d = Math.floor((Date.now() - new Date(t.bought_on!).getTime()) / 86400000)
    if (d <= 15) agingBuckets['0-15d']++
    else if (d <= 30) agingBuckets['16-30d']++
    else if (d <= 60) agingBuckets['31-60d']++
    else agingBuckets['60+d']++
    if (d >= 30) agingList.push({ ...t, days: d })
  })
  agingList.sort((a, b) => b.days - a.days)
  const totalAging = Object.values(agingBuckets).reduce((a, b) => a + b, 0)

  const donut = [
    { label: '0–15d', count: agingBuckets['0-15d'], color: 'var(--green)' },
    { label: '16–30d', count: agingBuckets['16-30d'], color: 'var(--gold)' },
    { label: '31–60d', count: agingBuckets['31-60d'], color: 'var(--orange)' },
    { label: '60+d', count: agingBuckets['60+d'], color: 'var(--red)' },
  ]
  const R = 54; let cum = 0
  const arcs = donut.map(seg => {
    const pct = totalAging > 0 ? seg.count / totalAging : 0
    const s = cum; cum += pct
    const a1 = s * 360 - 90, a2 = cum * 360 - 90
    const rad = (d: number) => d * Math.PI / 180
    const x1 = 70 + R * Math.cos(rad(a1)), y1 = 70 + R * Math.sin(rad(a1))
    const x2 = 70 + R * Math.cos(rad(a2)), y2 = 70 + R * Math.sin(rad(a2))
    return { ...seg, path: pct > 0 ? `M70 70 L${x1} ${y1} A${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${x2} ${y2}Z` : '', pct }
  })

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .dash-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
        .dash-mid { display: grid; grid-template-columns: 1fr 290px; gap: 16px; margin-bottom: 20px; }
        .dash-bot { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .stat-card { border-radius: 16px; padding: 20px; position: relative; overflow: hidden; cursor: default; transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); }
        .range-btn { padding: 5px 11px; font-size: 11px; cursor: pointer; border: none; border-radius: 6px; font-weight: 600; transition: all 0.15s; }
        @media(max-width:768px){
          .dash-grid{grid-template-columns:1fr 1fr!important}
          .dash-mid{grid-template-columns:1fr!important}
          .dash-bot{grid-template-columns:1fr!important}
        }
      `}</style>
      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', fontFamily: 'system-ui,sans-serif', color: 'var(--text)' }}>

        <div style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>OVERVIEW</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>Dashboard</h1>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ marginTop: 16, height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ width: 38, height: 38, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRightColor: 'var(--gold-dim)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="dash-grid">
              {[
                { label: 'ACTIVE INVENTORY', val: inStock, sub: `${soldTotal} total sold`, icon: '🚛', c: 'var(--gold)', glow: 'var(--gold-dim)' },
                { label: 'CAPITAL DEPLOYED', val: `$${cashTiedUp.toLocaleString()}`, sub: 'Unsold all-in cost', icon: '💰', c: 'var(--blue)', glow: 'var(--blue-dim)' },
                { label: 'PENDING PAYMENTS', val: pending.length, sub: `$${pendingAmt.toLocaleString()} owed`, icon: '⏳', c: 'var(--orange)', glow: 'var(--orange-dim)' },
                { label: 'MONTH PROFIT', val: `${monthProfit < 0 ? '-' : ''}$${Math.abs(monthProfit).toLocaleString()}`, sub: new Date().toLocaleDateString('en-US', { month: 'long' }), icon: '📈', c: monthProfit >= 0 ? 'var(--green)' : 'var(--red)', glow: monthProfit >= 0 ? 'var(--green-dim)' : 'var(--red-dim)' },
              ].map(c => (
                <div key={c.label} className="stat-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: c.glow, filter: 'blur(20px)', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 9.5, color: 'var(--text3)', letterSpacing: '0.14em', fontWeight: 700 }}>{c.label}</span>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: c.glow, border: `1px solid ${c.c}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{c.icon}</div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: c.c, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>{c.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + Donut */}
            <div className="dash-mid">
              <div className="gcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div className="section-title">PROFIT BY MONTH</div>
                    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                      {[
                        { l: 'NET PROFIT', v: `${totProfit < 0 ? '-' : ''}$${Math.abs(totProfit).toLocaleString()}`, c: totProfit >= 0 ? 'var(--gold)' : 'var(--red)' },
                        { l: 'REVENUE', v: `$${totRevenue.toLocaleString()}`, c: 'var(--text)' },
                        { l: 'SOLD', v: months.reduce((s, k) => s + byMonth[k].count, 0), c: 'var(--text)' },
                      ].map(s => (
                        <div key={s.l}>
                          <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 4, letterSpacing: '0.1em', fontWeight: 600 }}>{s.l}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: s.c, letterSpacing: '-0.02em' }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    {([6, 12, 24] as const).map(r => (
                      <button key={r} onClick={() => setRange(r)} className="range-btn"
                        style={{ background: range === r ? 'var(--gold)' : 'transparent', color: range === r ? '#000' : 'var(--text3)' }}>
                        {r}mo
                      </button>
                    ))}
                  </div>
                </div>
                {months.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text4)', fontSize: 13 }}>No sold trucks yet</div>
                ) : (
                  <div ref={chartRef} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: 160, gap: 3, paddingLeft: 42, paddingBottom: 26, position: 'relative', overflowX: 'auto' }}>
                      {[1, 0.5, 0].map((p, i) => {
                        const v = maxP * 1.1 * p
                        return (
                          <div key={i}>
                            <div style={{ position: 'absolute', left: 0, top: `${(1 - p) * 100}%`, fontSize: 8, color: 'var(--text4)', transform: 'translateY(-50%)', whiteSpace: 'nowrap' }}>${v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}</div>
                            <div style={{ position: 'absolute', left: 42, right: 0, top: `${(1 - p) * 100}%`, height: 1, background: 'var(--border2)', pointerEvents: 'none' }} />
                          </div>
                        )
                      })}
                      {months.map((key, i) => {
                        const d = byMonth[key]
                        const h = Math.min(Math.abs((d.profit / (maxP * 1.1)) * 100), 100)
                        const neg = d.profit < 0
                        const hov = hovBar === i
                        return (
                          <div key={key} style={{ flex: 1, minWidth: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}
                            onMouseEnter={e => { setHovBar(i); const r = e.currentTarget.getBoundingClientRect(), p = chartRef.current?.getBoundingClientRect(); if (p) setTip({ x: r.left - p.left + r.width / 2, y: r.top - p.top - 12, label: fmtMonth(key), profit: d.profit, count: d.count }) }}
                            onMouseLeave={() => { setHovBar(null); setTip(null) }}>
                            <div style={{ width: hov ? '88%' : '68%', height: `${h}%`, borderRadius: neg ? '0 0 5px 5px' : '5px 5px 0 0', minHeight: 3, transition: 'all 0.18s', background: neg ? (hov ? 'var(--red)' : 'var(--red-dim)') : (hov ? 'var(--gold)' : 'var(--gold-dim)'), boxShadow: hov ? (neg ? '0 0 16px var(--red-dim)' : '0 0 16px var(--gold-dim)') : 'none' }} />
                            <div style={{ position: 'absolute', bottom: -20, fontSize: 7.5, color: hov ? 'var(--text2)' : 'var(--text4)', whiteSpace: 'nowrap' }}>{fmtMonth(key)}</div>
                          </div>
                        )
                      })}
                    </div>
                    {tip && (
                      <div style={{ position: 'absolute', left: tip.x, top: tip.y, transform: 'translate(-50%,-100%)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap', boxShadow: 'var(--shadow)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 5, letterSpacing: '0.08em', fontWeight: 600 }}>{tip.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: tip.profit >= 0 ? 'var(--gold)' : 'var(--red)', letterSpacing: '-0.02em' }}>{tip.profit < 0 ? '-' : ''}${Math.abs(tip.profit).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{tip.count} truck{tip.count !== 1 ? 's' : ''} sold</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Donut */}
              <div className="gcard">
                <div className="section-title">INVENTORY AGING</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="150" height="150" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r={R} fill="var(--surface2)" />
                    {totalAging === 0
                      ? <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="16" />
                      : arcs.map((a, i) => a.pct > 0 && (
                        <path key={i} d={a.path} fill={a.color}
                          opacity={hovDonut === null || hovDonut === a.label ? 1 : 0.2}
                          style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                          onMouseEnter={() => setHovDonut(a.label)}
                          onMouseLeave={() => setHovDonut(null)} />
                      ))}
                    <circle cx="70" cy="70" r="34" fill="var(--bg)" />
                    <text x="70" y="63" textAnchor="middle" fill="var(--text)" fontSize="22" fontWeight="800" fontFamily="system-ui">{inStock}</text>
                    <text x="70" y="77" textAnchor="middle" fill="var(--text3)" fontSize="7.5" letterSpacing="1.5" fontWeight="600">IN STOCK</text>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {donut.map(s => (
                    <div key={s.label} onMouseEnter={() => setHovDonut(s.label)} onMouseLeave={() => setHovDonut(null)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', background: hovDonut === s.label ? 'var(--hover)' : 'transparent', border: `1px solid ${hovDonut === s.label ? 'var(--border)' : 'transparent'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 12, color: hovDonut === s.label ? 'var(--text)' : 'var(--text2)', fontWeight: 500 }}>{s.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: s.count > 0 ? 'var(--text)' : 'var(--text4)' }}>{s.count}</span>
                        {totalAging > 0 && s.count > 0 && <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{Math.round(s.count / totalAging * 100)}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="dash-bot">
              {[
                { title: 'AGING 30+ DAYS', icon: '⚠️', count: agingList.length, items: agingList.slice(0, 5), render: (t: any) => (
                  <div key={t.id} style={{ borderBottom: '1px solid var(--border2)', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 3, height: 32, borderRadius: 99, background: t.days > 60 ? 'var(--red)' : 'var(--orange)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{t.year} {t.make} {t.model}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.status}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: t.days > 60 ? 'var(--red)' : 'var(--orange)' }}>{t.days}d</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>${((t.purchase_price || 0) + (t.recondition_cost || 0)).toLocaleString()}</div>
                    </div>
                  </div>
                )},
                { title: 'PENDING PAYMENTS', icon: '⏳', count: pending.length, items: pending.slice(0, 5), render: (t: any) => (
                  <div key={t.id} style={{ borderBottom: '1px solid var(--border2)', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 3, height: 32, borderRadius: 99, background: 'var(--gold)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{t.make} {t.model}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.customer || '—'}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>${(t.sold_price || 0).toLocaleString()}</div>
                  </div>
                )},
              ].map(section => (
                <div key={section.title} className="gcard">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 14 }}>{section.icon}</span>
                    <span className="section-title" style={{ marginBottom: 0 }}>{section.title}</span>
                    {section.count > 0 && <span style={{ marginLeft: 'auto', background: 'var(--orange-dim)', color: 'var(--orange)', border: '1px solid var(--orange)', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{section.count}</span>}
                  </div>
                  {section.items.length === 0
                    ? <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text4)', fontSize: 13 }}>All caught up ✓</div>
                    : section.items.map((item: any) => section.render(item))}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}