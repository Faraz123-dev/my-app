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

function getMonthKey(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-')
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export default function DashboardPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [chartRange, setChartRange] = useState<6 | 12 | 24>(12)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; profit: number } | null>(null)
  const [hoveredDonut, setHoveredDonut] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchTrucks() }, [])

  async function fetchTrucks() {
    setLoading(true)
    const { data } = await supabase.from('Inventory Data').select('id,status,bought_on,vin,make,model,year,purchase_price,recondition_cost,date_sold,sold_price,customer,payment_status,kilometers')
    setTrucks(data || [])
    setLoading(false)
  }

  const inStock = trucks.filter(t => t.status !== 'Sold').length
  const soldTotal = trucks.filter(t => t.status === 'Sold').length
  const cashTiedUp = trucks.filter(t => t.status !== 'Sold').reduce((s, t) => s + (t.purchase_price || 0) + (t.recondition_cost || 0), 0)
  const pendingPayments = trucks.filter(t => t.payment_status === 'Unpaid')
  const pendingAmount = pendingPayments.reduce((s, t) => s + (t.sold_price || 0), 0)
  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthProfit = trucks.filter(t => t.status === 'Sold' && getMonthKey(t.date_sold) === thisMonthKey)
    .reduce((s, t) => s + (t.sold_price || 0) - ((t.purchase_price || 0) + (t.recondition_cost || 0)), 0)

  const profitByMonth: Record<string, { profit: number; count: number; revenue: number }> = {}
  trucks.filter(t => t.status === 'Sold' && t.date_sold).forEach(t => {
    const key = getMonthKey(t.date_sold)
    if (!key) return
    const profit = (t.sold_price || 0) - ((t.purchase_price || 0) + (t.recondition_cost || 0))
    if (!profitByMonth[key]) profitByMonth[key] = { profit: 0, count: 0, revenue: 0 }
    profitByMonth[key].profit += profit
    profitByMonth[key].count += 1
    profitByMonth[key].revenue += (t.sold_price || 0)
  })

  const sortedMonths = Object.keys(profitByMonth).sort().slice(-chartRange)
  const maxAbsProfit = Math.max(...sortedMonths.map(k => Math.abs(profitByMonth[k].profit)), 1)
  const totalProfit = sortedMonths.reduce((s, k) => s + profitByMonth[k].profit, 0)
  const totalRevenue = sortedMonths.reduce((s, k) => s + profitByMonth[k].revenue, 0)

  const agingBuckets = { '0-15d': 0, '16-30d': 0, '31-60d': 0, '60+d': 0 }
  const agingTrucks: (Truck & { days: number })[] = []
  trucks.filter(t => t.status !== 'Sold' && t.bought_on).forEach(t => {
    const days = Math.floor((Date.now() - new Date(t.bought_on!).getTime()) / 86400000)
    if (days <= 15) agingBuckets['0-15d']++
    else if (days <= 30) agingBuckets['16-30d']++
    else if (days <= 60) agingBuckets['31-60d']++
    else agingBuckets['60+d']++
    if (days >= 30) agingTrucks.push({ ...t, days })
  })
  agingTrucks.sort((a, b) => b.days - a.days)

  const donutSegments = [
    { label: '0–15d', count: agingBuckets['0-15d'], color: '#22c55e' },
    { label: '16–30d', count: agingBuckets['16-30d'], color: '#EAB308' },
    { label: '31–60d', count: agingBuckets['31-60d'], color: '#f97316' },
    { label: '60+d', count: agingBuckets['60+d'], color: '#ef4444' },
  ]
  const totalAging = Object.values(agingBuckets).reduce((a, b) => a + b, 0)
  const radius = 52
  let cumulativePct = 0
  const arcs = donutSegments.map(seg => {
    const pct = totalAging > 0 ? seg.count / totalAging : 0
    const startPct = cumulativePct; cumulativePct += pct
    const startAngle = startPct * 360 - 90; const endAngle = cumulativePct * 360 - 90
    const x1 = 70 + radius * Math.cos((startAngle * Math.PI) / 180)
    const y1 = 70 + radius * Math.sin((startAngle * Math.PI) / 180)
    const x2 = 70 + radius * Math.cos((endAngle * Math.PI) / 180)
    const y2 = 70 + radius * Math.sin((endAngle * Math.PI) / 180)
    const largeArc = pct > 0.5 ? 1 : 0
    const path = pct > 0 ? `M 70 70 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z` : ''
    return { ...seg, path, pct }
  })

  return (
    <>
      <style>{`
        .dash-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
        .dash-chart-row { display: grid; grid-template-columns: 1fr 300px; gap: 16px; margin-bottom: 20px; }
        .dash-bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) {
          .dash-stats { grid-template-columns: 1fr 1fr !important; }
          .dash-chart-row { grid-template-columns: 1fr !important; }
          .dash-bottom-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <main style={{ padding: '16px', overflowY: 'auto', background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Dashboard</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>Loading...</div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="dash-stats">
              {[
                { label: 'IN STOCK', value: inStock, sub: `${soldTotal} sold total`, icon: '🚛' },
                { label: 'CASH TIED UP', value: `$${cashTiedUp.toLocaleString()}`, sub: 'Unsold all-in cost', icon: '💵' },
                { label: 'PENDING PAYMENTS', value: `${pendingPayments.length} · $${pendingAmount.toLocaleString()}`, sub: 'Sold but unpaid', icon: '⏰' },
                { label: 'THIS MONTH PROFIT', value: `${thisMonthProfit < 0 ? '-' : ''}$${Math.abs(thisMonthProfit).toLocaleString()}`, sub: '', icon: '📈', accent: true },
              ].map((card: any) => (
                <div key={card.label} style={{ background: '#161616', border: '1px solid #252525', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.08em' }}>{card.label}</span>
                    <span style={{ fontSize: 14 }}>{card.icon}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: card.accent ? (thisMonthProfit >= 0 ? '#EAB308' : '#ef4444') : '#fff', marginBottom: 3 }}>{card.value}</div>
                  {card.sub && <div style={{ fontSize: 11, color: '#555' }}>{card.sub}</div>}
                </div>
              ))}
            </div>

            {/* Chart + Donut */}
            <div className="dash-chart-row">
              <div style={{ background: '#161616', border: '1px solid #252525', borderRadius: 10, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', marginBottom: 6 }}>PROFIT BY MONTH</div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div><div style={{ fontSize: 9, color: '#444' }}>PROFIT</div><div style={{ fontSize: 14, fontWeight: 600, color: totalProfit >= 0 ? '#EAB308' : '#ef4444' }}>{totalProfit < 0 ? '-' : ''}${Math.abs(totalProfit).toLocaleString()}</div></div>
                      <div><div style={{ fontSize: 9, color: '#444' }}>REVENUE</div><div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>${totalRevenue.toLocaleString()}</div></div>
                      <div><div style={{ fontSize: 9, color: '#444' }}>SOLD</div><div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{sortedMonths.reduce((s, k) => s + profitByMonth[k].count, 0)}</div></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 6, overflow: 'hidden' }}>
                    {([6, 12, 24] as const).map(r => (
                      <button key={r} onClick={() => setChartRange(r)} style={{ padding: '4px 8px', fontSize: 11, cursor: 'pointer', border: 'none', background: chartRange === r ? '#EAB308' : 'transparent', color: chartRange === r ? '#000' : '#666', fontWeight: chartRange === r ? 600 : 400 }}>{r}mo</button>
                    ))}
                  </div>
                </div>
                {sortedMonths.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#444', fontSize: 13 }}>No sold trucks yet</div>
                ) : (
                  <div ref={chartRef} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: 140, gap: 3, paddingLeft: 36, paddingBottom: 22, position: 'relative', overflowX: 'auto' }}>
                      {[1, 0.5, 0].map((pct, i) => {
                        const val = maxAbsProfit * 1.1 * pct
                        return <div key={i} style={{ position: 'absolute', left: 0, top: `${(1 - pct) * 100}%`, fontSize: 8, color: '#3a3a3a', transform: 'translateY(-50%)', whiteSpace: 'nowrap' }}>${val >= 1000 ? `${Math.round(val / 1000)}k` : Math.round(val)}</div>
                      })}
                      {sortedMonths.map((key, i) => {
                        const data = profitByMonth[key]
                        const pct = (data.profit / (maxAbsProfit * 1.1)) * 100
                        const isNeg = data.profit < 0
                        const barHeight = Math.min(Math.abs(pct), 100)
                        const isHovered = hoveredBar === i
                        return (
                          <div key={key} style={{ flex: 1, minWidth: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}
                            onMouseEnter={e => { setHoveredBar(i); const r = e.currentTarget.getBoundingClientRect(); const p = chartRef.current?.getBoundingClientRect(); if (p) setTooltip({ x: r.left - p.left + r.width / 2, y: r.top - p.top - 10, label: formatMonthLabel(key), profit: data.profit }) }}
                            onMouseLeave={() => { setHoveredBar(null); setTooltip(null) }}>
                            <div style={{ width: '80%', height: `${barHeight}%`, background: isHovered ? (isNeg ? '#ff6b6b' : '#fbbf24') : (isNeg ? '#ef4444' : '#EAB308'), borderRadius: isNeg ? '0 0 3px 3px' : '3px 3px 0 0', minHeight: 2 }} />
                            <div style={{ position: 'absolute', bottom: -18, fontSize: 8, color: isHovered ? '#aaa' : '#444', whiteSpace: 'nowrap' }}>{formatMonthLabel(key)}</div>
                          </div>
                        )
                      })}
                    </div>
                    {tooltip && (
                      <div style={{ position: 'absolute', left: tooltip.x, top: tooltip.y, transform: 'translate(-50%,-100%)', background: '#1e1e1e', border: '1px solid #333', borderRadius: 6, padding: '8px 12px', pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{tooltip.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: tooltip.profit >= 0 ? '#EAB308' : '#ef4444' }}>{tooltip.profit < 0 ? '-' : ''}${Math.abs(tooltip.profit).toLocaleString()}</div>
                        {hoveredBar !== null && sortedMonths[hoveredBar] && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{profitByMonth[sortedMonths[hoveredBar]].count} sold</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ background: '#161616', border: '1px solid #252525', borderRadius: 10, padding: '16px' }}>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', marginBottom: 12 }}>INVENTORY AGING</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r={radius} fill="#0f0f0f" />
                    {totalAging === 0 ? <circle cx="70" cy="70" r={radius} fill="none" stroke="#2a2a2a" strokeWidth="20" /> : arcs.map((arc, i) => arc.pct > 0 && <path key={i} d={arc.path} fill={arc.color} opacity={hoveredDonut === null || hoveredDonut === arc.label ? 1 : 0.3} onMouseEnter={() => setHoveredDonut(arc.label)} onMouseLeave={() => setHoveredDonut(null)} />)}
                    <circle cx="70" cy="70" r="36" fill="#161616" />
                    <text x="70" y="66" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="600">{inStock}</text>
                    <text x="70" y="80" textAnchor="middle" fill="#555" fontSize="9">IN STOCK</text>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {donutSegments.map(s => (
                    <div key={s.label} onMouseEnter={() => setHoveredDonut(s.label)} onMouseLeave={() => setHoveredDonut(null)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', background: hoveredDonut === s.label ? '#1e1e1e' : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 12, color: hoveredDonut === s.label ? '#ccc' : '#777' }}>{s.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.count > 0 ? '#fff' : '#444' }}>{s.count}</span>
                        {totalAging > 0 && s.count > 0 && <span style={{ fontSize: 10, color: '#555' }}>{Math.round(s.count / totalAging * 100)}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom tables */}
            <div className="dash-bottom-row">
              <div style={{ background: '#161616', border: '1px solid #252525', borderRadius: 10, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ color: '#EAB308' }}>⚠</span>
                  <span style={{ fontSize: 11, color: '#666', letterSpacing: '0.08em' }}>AGING 30+ DAYS</span>
                  {agingTrucks.length > 0 && <span style={{ marginLeft: 'auto', background: '#2a1a00', color: '#f97316', border: '1px solid #4a3a00', borderRadius: 10, padding: '1px 8px', fontSize: 10 }}>{agingTrucks.length}</span>}
                </div>
                {agingTrucks.length === 0 ? <div style={{ textAlign: 'center', padding: 24, color: '#444', fontSize: 13 }}>✓ No aging inventory</div> : (
                  agingTrucks.slice(0, 5).map(truck => (
                    <div key={truck.id} style={{ borderBottom: '1px solid #1a1a1a', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#ccc' }}>{truck.year} {truck.make} {truck.model}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{truck.status}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: truck.days > 60 ? '#ef4444' : '#EAB308' }}>{truck.days}d</div>
                        <div style={{ fontSize: 11, color: '#666' }}>${((truck.purchase_price || 0) + (truck.recondition_cost || 0)).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ background: '#161616', border: '1px solid #252525', borderRadius: 10, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ color: '#f97316' }}>⏰</span>
                  <span style={{ fontSize: 11, color: '#666', letterSpacing: '0.08em' }}>PENDING PAYMENTS</span>
                  {pendingPayments.length > 0 && <span style={{ marginLeft: 'auto', background: '#2a1500', color: '#f97316', border: '1px solid #4a2500', borderRadius: 10, padding: '1px 8px', fontSize: 10 }}>{pendingPayments.length}</span>}
                </div>
                {pendingPayments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: '#444', fontSize: 13 }}>📥 All caught up</div>
                ) : (
                  pendingPayments.slice(0, 5).map(truck => (
                    <div key={truck.id} style={{ borderBottom: '1px solid #1a1a1a', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#ccc' }}>{truck.make} {truck.model}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{truck.customer || '—'}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f97316' }}>${(truck.sold_price || 0).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}