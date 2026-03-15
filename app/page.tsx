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

// Per-truck actual recon cost computed from all cost tables
type TruckCosts = Record<string, number> // truck_id → total recon cost

function getMonthKey(d: string | null) {
  if (!d) return null
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return null
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}
function fmtKey(key: string) {
  // YTD: "2024"
  if (/^\d{4}$/.test(key)) return key
  // Quarterly: "2024-Q3"
  if (/^\d{4}-Q\d$/.test(key)) {
    const [y, q] = key.split("-")
    return q + " " + "'" + y.slice(2)
  }
  // Monthly: "2024-03"
  const [y, m] = key.split("-")
  return new Date(+y, +m - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

export default function DashboardPage() {
  const [trucks,     setTrucks]     = useState<Truck[]>([])
  const [truckCosts, setTruckCosts] = useState<TruckCosts>({})
  const [loading,    setLoading]    = useState(true)
  const [range,      setRange]      = useState<6 | 12 | 24>(12)
  const [chartMode,  setChartMode]  = useState<'monthly' | 'quarterly' | 'ytd'>('monthly')
  const [hovBar,     setHovBar]     = useState<number | null>(null)
  const [tip,        setTip]        = useState<{ x: number; y: number; label: string; profit: number; revenue: number; count: number } | null>(null)
  const [hovDonut,   setHovDonut]   = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)

    // Load trucks + all 4 cost tables in parallel
    const [
      { data: t },
      { data: parts },
      { data: labor },
      { data: vendorInv },
      { data: otherCosts },
    ] = await Promise.all([
      supabase.from('Inventory Data').select('id,status,bought_on,vin,make,model,year,purchase_price,recondition_cost,date_sold,sold_price,customer,payment_status,kilometers'),
      supabase.from('parts').select('truck_id,qty,unit_cost'),
      supabase.from('labor').select('truck_id,hours,rate'),
      supabase.from('vendor_invoices').select('truck_id,amount'),
      supabase.from('other_costs').select('truck_id,amount'),
    ])

    // Build per-truck actual recon costs
    const costs: TruckCosts = {}
    const add = (tid: string, amt: number) => { costs[tid] = (costs[tid] || 0) + amt }
    ;(parts || []).forEach((p: any)       => add(p.truck_id, (p.qty || 0) * (p.unit_cost || 0)))
    ;(labor || []).forEach((l: any)       => add(l.truck_id, (l.hours || 0) * (l.rate || 0)))
    ;(vendorInv || []).forEach((i: any)   => add(i.truck_id, i.amount || 0))
    ;(otherCosts || []).forEach((o: any)  => add(o.truck_id, o.amount || 0))

    setTrucks(t || [])
    setTruckCosts(costs)
    setLoading(false)
  }

  // Helper: actual all-in cost for a truck
  // Uses recondition_cost field + any additional costs from cost tables
  const allIn = (t: Truck) => (t.purchase_price || 0) + (t.recondition_cost || 0) + (truckCosts[t.id] || 0)
  const truckProfit = (t: Truck) => t.sold_price != null ? t.sold_price - allIn(t) : null

  // ── KPI cards ──
  const inStock      = trucks.filter(t => t.status !== 'Sold').length
  const soldTotal    = trucks.filter(t => t.status === 'Sold').length
  const cashTiedUp   = trucks.filter(t => t.status !== 'Sold').reduce((s, t) => s + allIn(t), 0)
  const pending      = trucks.filter(t => t.payment_status === 'Unpaid')
  const pendingAmt   = pending.reduce((s, t) => s + (t.sold_price || 0), 0)

  const now      = new Date()
  const thisKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthSold = trucks.filter(t => t.status === 'Sold' && getMonthKey(t.date_sold) === thisKey)
  const monthProfit  = monthSold.reduce((s, t) => s + (truckProfit(t) || 0), 0)
  const monthRevenue = monthSold.reduce((s, t) => s + (t.sold_price || 0), 0)

  // ── All-time stats ──
  const allTimeSold    = trucks.filter(t => t.status === 'Sold')
  const allTimeRevenue = allTimeSold.reduce((s, t) => s + (t.sold_price || 0), 0)
  const allTimeProfit  = allTimeSold.reduce((s, t) => s + (truckProfit(t) || 0), 0)
  const avgProfit      = allTimeSold.length > 0 ? allTimeProfit / allTimeSold.length : 0

  // ── Profit chart ──
  type ChartBucket = { profit: number; count: number; revenue: number }
  const byMonth: Record<string, ChartBucket> = {}
  trucks.filter(t => t.status === 'Sold' && t.date_sold).forEach(t => {
    const k = getMonthKey(t.date_sold)!
    if (!k) return
    if (!byMonth[k]) byMonth[k] = { profit: 0, count: 0, revenue: 0 }
    byMonth[k].profit  += truckProfit(t) || 0
    byMonth[k].count++
    byMonth[k].revenue += t.sold_price || 0
  })
  const byQuarter: Record<string, ChartBucket> = {}
  trucks.filter(t => t.status === 'Sold' && t.date_sold).forEach(t => {
    const d = new Date(t.date_sold!)
    if (isNaN(d.getTime())) return
    const q = Math.ceil((d.getMonth() + 1) / 3)
    const k = d.getFullYear() + '-Q' + q
    if (!byQuarter[k]) byQuarter[k] = { profit: 0, count: 0, revenue: 0 }
    byQuarter[k].profit  += truckProfit(t) || 0
    byQuarter[k].count++
    byQuarter[k].revenue += t.sold_price || 0
  })
  const byYear: Record<string, ChartBucket> = {}
  trucks.filter(t => t.status === 'Sold' && t.date_sold).forEach(t => {
    const d = new Date(t.date_sold!)
    if (isNaN(d.getTime())) return
    const k = String(d.getFullYear())
    if (!byYear[k]) byYear[k] = { profit: 0, count: 0, revenue: 0 }
    byYear[k].profit  += truckProfit(t) || 0
    byYear[k].count++
    byYear[k].revenue += t.sold_price || 0
  })
  const chartData: Record<string, ChartBucket> =
    chartMode === 'quarterly' ? byQuarter :
    chartMode === 'ytd'       ? byYear    : byMonth
  const allKeys   = Object.keys(chartData).sort()
  const months    = chartMode === 'monthly' ? allKeys.slice(-range) : allKeys
  const maxP      = Math.max(...months.map(k => Math.abs(chartData[k].profit)), 1)
  const totProfit = months.reduce((s, k) => s + chartData[k].profit, 0)
  const totRev    = months.reduce((s, k) => s + chartData[k].revenue, 0)
  const totSold   = months.reduce((s, k) => s + chartData[k].count, 0)

  // ── Aging donut ──
  const agingBuckets = { '0-15d': 0, '16-30d': 0, '31-60d': 0, '60+d': 0 }
  const agingList: (Truck & { days: number; allIn: number })[] = []
  trucks.filter(t => t.status !== 'Sold' && t.bought_on).forEach(t => {
    const d = Math.floor((Date.now() - new Date(t.bought_on!).getTime()) / 86400000)
    if (d <= 15) agingBuckets['0-15d']++
    else if (d <= 30) agingBuckets['16-30d']++
    else if (d <= 60) agingBuckets['31-60d']++
    else agingBuckets['60+d']++
    if (d >= 30) agingList.push({ ...t, days: d, allIn: allIn(t) })
  })
  agingList.sort((a, b) => b.days - a.days)
  const totalAging = Object.values(agingBuckets).reduce((a, b) => a + b, 0)

  const donut = [
    { label: '0–15d',  count: agingBuckets['0-15d'],  color: 'var(--green)'  },
    { label: '16–30d', count: agingBuckets['16-30d'], color: 'var(--gold)'   },
    { label: '31–60d', count: agingBuckets['31-60d'], color: 'var(--orange)' },
    { label: '60+d',   count: agingBuckets['60+d'],   color: 'var(--red)'    },
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
        .dash-kpi  { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
        .dash-stat { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
        .dash-mid  { display: grid; grid-template-columns: 1fr 290px; gap: 16px; margin-bottom: 20px; }
        .dash-bot  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .kpi-card  { border-radius: 16px; padding: 20px; position: relative; overflow: hidden; cursor: default; transition: transform 0.2s; }
        .kpi-card:hover { transform: translateY(-2px); }
        .range-btn { padding: 5px 11px; font-size: 11px; cursor: pointer; border: none; border-radius: 6px; font-weight: 600; transition: all 0.15s; }
        @media(max-width:900px){
          .dash-kpi{grid-template-columns:1fr 1fr!important}
          .dash-stat{grid-template-columns:1fr 1fr!important}
          .dash-mid{grid-template-columns:1fr!important}
          .dash-bot{grid-template-columns:1fr!important}
        }
        @media(max-width:480px){
          .dash-kpi{grid-template-columns:1fr!important}
          .dash-stat{grid-template-columns:1fr 1fr!important}
        }
      `}</style>

      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', fontFamily: 'system-ui,sans-serif', color: 'var(--text)' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>OVERVIEW</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>Dashboard</h1>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
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
            {/* ── KPI CARDS ── */}
            <div className="dash-kpi">
              {[
                { label: 'ACTIVE INVENTORY', val: inStock, sub: `${soldTotal} total sold`, icon: '🚛', c: 'var(--gold)', dim: 'var(--gold-dim)' },
                { label: 'CAPITAL DEPLOYED', val: `$${cashTiedUp.toLocaleString()}`, sub: 'True all-in (incl. recon)', icon: '💰', c: 'var(--blue)', dim: 'var(--blue-dim)' },
                { label: 'PENDING PAYMENTS', val: pending.length, sub: `$${pendingAmt.toLocaleString()} outstanding`, icon: '⏳', c: 'var(--orange)', dim: 'var(--orange-dim)' },
                { label: 'THIS MONTH PROFIT', val: `${monthProfit < 0 ? '-' : ''}$${Math.abs(monthProfit).toLocaleString()}`, sub: `${monthSold.length} trucks · $${monthRevenue.toLocaleString()} revenue`, icon: '📈', c: monthProfit >= 0 ? 'var(--green)' : 'var(--red)', dim: monthProfit >= 0 ? 'var(--green-dim)' : 'var(--red-dim)' },
              ].map(c => (
                <div key={c.label} className="kpi-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: c.dim, filter: 'blur(20px)', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 9.5, color: 'var(--text3)', letterSpacing: '0.14em', fontWeight: 700 }}>{c.label}</span>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: c.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{c.icon}</div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: c.c, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>{c.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── ALL-TIME STATS ── */}
            <div className="dash-stat">
              {[
                { label: 'ALL-TIME REVENUE',  val: `$${Math.round(allTimeRevenue).toLocaleString()}`,                                                c: 'var(--text)'  },
                { label: 'ALL-TIME PROFIT',   val: `${allTimeProfit < 0 ? '-' : ''}$${Math.abs(Math.round(allTimeProfit)).toLocaleString()}`,         c: allTimeProfit >= 0 ? 'var(--green)' : 'var(--red)' },
                { label: 'AVG PROFIT / TRUCK', val: `${avgProfit < 0 ? '-' : ''}$${Math.abs(Math.round(avgProfit)).toLocaleString()}`,                c: avgProfit >= 0 ? 'var(--gold)' : 'var(--red)' },
                { label: 'TOTAL TRUCKS SOLD', val: String(soldTotal),                                                                                 c: 'var(--text)'  },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.c, letterSpacing: '-0.02em' }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* ── CHART + DONUT ── */}
            <div className="dash-mid">

              {/* Profit chart */}
              <div className="gcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div className="section-title">PROFIT BY MONTH</div>
                    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                      {[
                        { l: 'NET PROFIT', v: `${totProfit < 0 ? '-' : ''}$${Math.abs(Math.round(totProfit)).toLocaleString()}`, c: totProfit >= 0 ? 'var(--gold)' : 'var(--red)' },
                        { l: 'REVENUE',    v: `$${Math.round(totRev).toLocaleString()}`,                                          c: 'var(--text)' },
                        { l: 'TRUCKS',     v: String(totSold),                                                                    c: 'var(--text)' },
                      ].map(s => (
                        <div key={s.l}>
                          <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 4, letterSpacing: '0.1em', fontWeight: 600 }}>{s.l}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: s.c, letterSpacing: '-0.02em' }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    {/* View mode */}
                    <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      {([['monthly','Monthly'],['quarterly','Quarterly'],['ytd','YTD']] as const).map(([m, l]) => (
                        <button key={m} onClick={() => setChartMode(m)} className="range-btn"
                          style={{ background: chartMode === m ? 'var(--gold)' : 'transparent', color: chartMode === m ? '#000' : 'var(--text3)', padding: '5px 10px' }}>
                          {l}
                        </button>
                      ))}
                    </div>
                    {/* Monthly range filter — only shown in monthly mode */}
                    {chartMode === 'monthly' && (
                      <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                        {([6, 12, 24] as const).map(r => (
                          <button key={r} onClick={() => setRange(r)} className="range-btn"
                            style={{ background: range === r ? 'var(--gold)' : 'transparent', color: range === r ? '#000' : 'var(--text3)' }}>
                            {r}mo
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {months.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text4)', fontSize: 13 }}>No sold trucks yet — profit data will appear here.</div>
                ) : (
                  <div ref={chartRef} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: 160, gap: 3, paddingLeft: 46, paddingBottom: 28, position: 'relative', overflowX: 'auto' }}>
                      {/* Y axis */}
                      {[1, 0.5, 0].map((p, i) => {
                        const v = maxP * 1.1 * p
                        return (
                          <div key={i}>
                            <div style={{ position: 'absolute', left: 0, top: `${(1 - p) * 100}%`, fontSize: 8, color: 'var(--text4)', transform: 'translateY(-50%)', whiteSpace: 'nowrap' }}>{v < 0 ? '-' : ''}${v >= 1000 ? `${Math.round(Math.abs(v) / 1000)}k` : Math.round(Math.abs(v))}</div>
                            <div style={{ position: 'absolute', left: 46, right: 0, top: `${(1 - p) * 100}%`, height: 1, background: 'var(--border2)', pointerEvents: 'none' }} />
                          </div>
                        )
                      })}
                      {/* Bars */}
                      {months.map((key, i) => {
                        const d = chartData[key]
                        const h = Math.min(Math.abs((d.profit / (maxP * 1.1)) * 100), 100)
                        const neg = d.profit < 0
                        const hov = hovBar === i
                        return (
                          <div key={key} style={{ flex: 1, minWidth: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}
                            onMouseEnter={e => {
                              setHovBar(i)
                              const r = e.currentTarget.getBoundingClientRect()
                              const p = chartRef.current?.getBoundingClientRect()
                              if (p) setTip({ x: r.left - p.left + r.width / 2, y: r.top - p.top - 12, label: fmtKey(key), profit: d.profit, revenue: d.revenue, count: d.count })
                            }}
                            onMouseLeave={() => { setHovBar(null); setTip(null) }}>
                            <div style={{ width: hov ? '88%' : '70%', height: `${h}%`, borderRadius: neg ? '0 0 5px 5px' : '5px 5px 0 0', minHeight: 3, transition: 'all 0.18s', background: neg ? (hov ? 'var(--red)' : 'var(--red-dim)') : (hov ? 'var(--gold)' : 'var(--gold-dim)'), boxShadow: hov ? (neg ? '0 0 16px var(--red-dim)' : '0 0 16px var(--gold-dim)') : 'none' }} />
                            <div style={{ position: 'absolute', bottom: -22, fontSize: 7.5, color: hov ? 'var(--text2)' : 'var(--text4)', whiteSpace: 'nowrap' }}>{fmtKey(key)}</div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Tooltip */}
                    {tip && (
                      <div style={{ position: 'absolute', left: tip.x, top: tip.y, transform: 'translate(-50%,-100%)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap', boxShadow: 'var(--shadow)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.1em', fontWeight: 700 }}>{tip.label}</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: tip.profit >= 0 ? 'var(--gold)' : 'var(--red)', letterSpacing: '-0.02em', marginBottom: 3 }}>{tip.profit < 0 ? '-' : ''}${Math.abs(Math.round(tip.profit)).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Revenue: ${Math.round(tip.revenue).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{tip.count} truck{tip.count !== 1 ? 's' : ''} sold</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Aging donut */}
              <div className="gcard">
                <div className="section-title">INVENTORY AGING</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
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
                {/* Total capital at risk */}
                {totalAging > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700 }}>CAPITAL AT RISK</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)' }}>
                      ${trucks.filter(t => t.status !== 'Sold' && t.bought_on && Math.floor((Date.now() - new Date(t.bought_on).getTime()) / 86400000) >= 30).reduce((s, t) => s + allIn(t), 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── BOTTOM TABLES ── */}
            <div className="dash-bot">

              {/* Aging 30+ */}
              <div className="gcard">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <span className="section-title" style={{ marginBottom: 0 }}>AGING INVENTORY (30+ DAYS)</span>
                  {agingList.length > 0 && <span style={{ marginLeft: 'auto', background: 'var(--orange-dim)', color: 'var(--orange)', border: '1px solid var(--orange)', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{agingList.length}</span>}
                </div>
                {agingList.length === 0
                  ? <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text4)', fontSize: 13 }}>✓ No aging inventory</div>
                  : agingList.slice(0, 6).map(t => (
                    <div key={t.id} onClick={() => window.location.href = `/inventory/${t.id}`} style={{ borderBottom: '1px solid var(--border2)', padding: '11px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 3, height: 32, borderRadius: 99, background: t.days > 60 ? 'var(--red)' : 'var(--orange)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{t.year} {t.make} {t.model}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.status}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: t.days > 60 ? 'var(--red)' : 'var(--orange)' }}>{t.days}d</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>${t.allIn.toLocaleString()} in</div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pending payments */}
              <div className="gcard">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 14 }}>⏳</span>
                  <span className="section-title" style={{ marginBottom: 0 }}>PENDING PAYMENTS</span>
                  {pending.length > 0 && <span style={{ marginLeft: 'auto', background: 'var(--orange-dim)', color: 'var(--orange)', border: '1px solid var(--orange)', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{pending.length}</span>}
                </div>
                {pending.length === 0
                  ? <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text4)', fontSize: 13 }}>📥 All caught up</div>
                  : pending.slice(0, 6).map(t => (
                    <div key={t.id} onClick={() => window.location.href = `/inventory/${t.id}`} style={{ borderBottom: '1px solid var(--border2)', padding: '11px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 3, height: 32, borderRadius: 99, background: 'var(--gold)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{t.year} {t.make} {t.model}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.customer || '—'}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>${(t.sold_price || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>profit: ${Math.round(truckProfit(t) || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                {pending.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700 }}>TOTAL OUTSTANDING</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>${pendingAmt.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}