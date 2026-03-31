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

type TruckCosts = Record<string, number>

function getMonthKey(d: string | null) {
  if (!d) return null
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return null
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}
function fmtKey(key: string) {
  if (/^\d{4}$/.test(key)) return key
  if (/^\d{4}-Q\d$/.test(key)) {
    const [y, q] = key.split('-')
    return `${q} '${y.slice(2)}`
  }
  if (/^\d{4}-\d{2}$/.test(key)) {
    const [y, m] = key.split('-')
    const d = new Date(parseInt(y), parseInt(m) - 1, 1)
    if (isNaN(d.getTime())) return key
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return key
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
  const [drilldown,  setDrilldown]  = useState<{ title: string; trucks: any[] } | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
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
    const costs: TruckCosts = {}
    const add = (tid: string, amt: number) => { costs[tid] = (costs[tid] || 0) + amt }
    ;(parts || []).forEach((p: any)      => add(p.truck_id, (p.qty || 0) * (p.unit_cost || 0)))
    ;(labor || []).forEach((l: any)      => add(l.truck_id, (l.hours || 0) * (l.rate || 0)))
    ;(vendorInv || []).forEach((i: any)  => add(i.truck_id, i.amount || 0))
    ;(otherCosts || []).forEach((o: any) => add(o.truck_id, o.amount || 0))
    setTrucks(t || [])
    setTruckCosts(costs)
    setLoading(false)
  }

  const allIn = (t: Truck) => (t.purchase_price || 0) + (t.recondition_cost || 0) + (truckCosts[t.id] || 0)
  const truckProfit = (t: Truck) => t.sold_price != null ? t.sold_price - allIn(t) : null

  // KPIs
  const inStock    = trucks.filter(t => t.status !== 'Sold').length
  const soldTotal  = trucks.filter(t => t.status === 'Sold').length
  const cashTiedUp = trucks.filter(t => t.status !== 'Sold').reduce((s, t) => s + allIn(t), 0)
  const pending    = trucks.filter(t => t.payment_status === 'Unpaid')
  const pendingAmt = pending.reduce((s, t) => s + (t.sold_price || 0), 0)

  const now      = new Date()
  const thisKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthSold    = trucks.filter(t => t.status === 'Sold' && getMonthKey(t.date_sold) === thisKey)
  const monthProfit  = monthSold.reduce((s, t) => s + (truckProfit(t) || 0), 0)
  const monthRevenue = monthSold.reduce((s, t) => s + (t.sold_price || 0), 0)

  const allTimeSold    = trucks.filter(t => t.status === 'Sold')
  const allTimeRevenue = allTimeSold.reduce((s, t) => s + (t.sold_price || 0), 0)
  const allTimeProfit  = allTimeSold.reduce((s, t) => s + (truckProfit(t) || 0), 0)
  const avgProfit      = allTimeSold.length > 0 ? allTimeProfit / allTimeSold.length : 0

  // Chart buckets
  type Bucket = { profit: number; count: number; revenue: number; trucks: Truck[] }
  const byMonth: Record<string, Bucket> = {}
  const byQuarter: Record<string, Bucket> = {}
  const byYear: Record<string, Bucket> = {}

  trucks.filter(t => t.status === 'Sold' && t.date_sold).forEach(t => {
    const k = getMonthKey(t.date_sold)!
    if (!k) return
    if (!byMonth[k]) byMonth[k] = { profit: 0, count: 0, revenue: 0, trucks: [] }
    byMonth[k].profit  += truckProfit(t) || 0
    byMonth[k].count++
    byMonth[k].revenue += t.sold_price || 0
    byMonth[k].trucks.push(t)

    const d = new Date(t.date_sold!)
    const q = Math.ceil((d.getMonth() + 1) / 3)
    const qk = d.getFullYear() + '-Q' + q
    if (!byQuarter[qk]) byQuarter[qk] = { profit: 0, count: 0, revenue: 0, trucks: [] }
    byQuarter[qk].profit  += truckProfit(t) || 0
    byQuarter[qk].count++
    byQuarter[qk].revenue += t.sold_price || 0
    byQuarter[qk].trucks.push(t)

    const yk = String(d.getFullYear())
    if (!byYear[yk]) byYear[yk] = { profit: 0, count: 0, revenue: 0, trucks: [] }
    byYear[yk].profit  += truckProfit(t) || 0
    byYear[yk].count++
    byYear[yk].revenue += t.sold_price || 0
    byYear[yk].trucks.push(t)
  })

  const chartData = chartMode === 'quarterly' ? byQuarter : chartMode === 'ytd' ? byYear : byMonth
  const allKeys   = Object.keys(chartData).sort()
  const months    = chartMode === 'monthly' ? allKeys.slice(-range) : allKeys
  const maxP      = Math.max(...months.map(k => Math.abs(chartData[k].profit)), 1)
  const totProfit = months.reduce((s, k) => s + chartData[k].profit, 0)
  const totRev    = months.reduce((s, k) => s + chartData[k].revenue, 0)
  const totSold   = months.reduce((s, k) => s + chartData[k].count, 0)

  // Aging donut
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
    { label: '0–15d',  count: agingBuckets['0-15d'],  color: 'var(--green)' },
    { label: '16–30d', count: agingBuckets['16-30d'], color: 'var(--gold)' },
    { label: '31–60d', count: agingBuckets['31-60d'], color: 'var(--orange)' },
    { label: '60+d',   count: agingBuckets['60+d'],   color: 'var(--red)' },
  ]
  const donutColors = ['#22c55e', '#EAB308', '#f97316', '#ef4444']
  const R = 54; let cum = 0
  const arcs = donut.map((seg, idx) => {
    const pct = totalAging > 0 ? seg.count / totalAging : 0
    const s = cum; cum += pct
    const a1 = s * 360 - 90, a2 = cum * 360 - 90
    const rad = (d: number) => d * Math.PI / 180
    const x1 = 70 + R * Math.cos(rad(a1)), y1 = 70 + R * Math.sin(rad(a1))
    const x2 = 70 + R * Math.cos(rad(a2)), y2 = 70 + R * Math.sin(rad(a2))
    return { ...seg, color: donutColors[idx], path: pct > 0 ? `M70 70 L${x1} ${y1} A${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${x2} ${y2}Z` : '', pct }
  })

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '18px 20px',
  }

  return (
    <div style={{ padding: '24px 28px', background: 'var(--bg)', minHeight: '100vh', fontFamily: 'system-ui,sans-serif', color: 'var(--text)', transition: 'background 0.3s, color 0.3s' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Dashboard</h1>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div style={{ marginTop: 14, height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'ACTIVE INVENTORY', val: inStock, sub: `${soldTotal} total sold`, icon: '🚛', c: 'var(--gold)',
                onClick: () => setDrilldown({ title: 'Active Inventory', trucks: trucks.filter(t => t.status !== 'Sold').map(t => ({ ...t, _label1: 'STATUS', _col1: t.status, _label2: 'ALL-IN', _col2: `$${allIn(t).toLocaleString()}` })) }) },
              { label: 'CAPITAL DEPLOYED', val: `$${cashTiedUp.toLocaleString()}`, sub: 'True all-in (incl. recon)', icon: '💰', c: 'var(--blue)',
                onClick: () => setDrilldown({ title: 'Capital Deployed', trucks: trucks.filter(t => t.status !== 'Sold').sort((a,b) => allIn(b)-allIn(a)).map(t => ({ ...t, _label1: 'STATUS', _col1: t.status, _label2: 'ALL-IN', _col2: `$${allIn(t).toLocaleString()}` })) }) },
              { label: 'PENDING PAYMENTS', val: pending.length, sub: `$${pendingAmt.toLocaleString()} outstanding`, icon: '⏳', c: 'var(--orange)',
                onClick: () => setDrilldown({ title: 'Pending Payments', trucks: pending.map(t => ({ ...t, _label1: 'CUSTOMER', _col1: t.customer||'—', _label2: 'SOLD FOR', _col2: `$${(t.sold_price||0).toLocaleString()}` })) }) },
              { label: 'THIS MONTH PROFIT', val: `${monthProfit < 0 ? '-' : ''}$${Math.abs(monthProfit).toLocaleString()}`, sub: `${monthSold.length} trucks · $${monthRevenue.toLocaleString()} revenue`, icon: '📈', c: monthProfit >= 0 ? 'var(--green)' : 'var(--red)',
                onClick: () => setDrilldown({ title: 'This Month — Sold Trucks', trucks: monthSold.map(t => ({ ...t, _label1: 'SOLD FOR', _col1: `$${(t.sold_price||0).toLocaleString()}`, _label2: 'PROFIT', _col2: `${(truckProfit(t)||0)<0?'-':''}$${Math.abs(Math.round(truckProfit(t)||0)).toLocaleString()}` })) }) },
            ].map(c => (
              <div key={c.label} onClick={c.onClick} style={{ ...card, cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 9.5, color: 'var(--text3)', letterSpacing: '0.14em', fontWeight: 700 }}>{c.label}</span>
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: c.c, letterSpacing: '-0.02em', marginBottom: 4 }}>{c.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.sub}</div>
                <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 6 }}>Click to view breakdown →</div>
              </div>
            ))}
          </div>

          {/* All-time stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'ALL-TIME REVENUE',   val: `$${Math.round(allTimeRevenue).toLocaleString()}`, c: 'var(--text)',
                onClick: () => setDrilldown({ title: 'All-Time Revenue', trucks: allTimeSold.sort((a,b)=>(b.sold_price||0)-(a.sold_price||0)).map(t => ({ ...t, _label1: 'SOLD DATE', _col1: t.date_sold||'—', _label2: 'REVENUE', _col2: `$${(t.sold_price||0).toLocaleString()}` })) }) },
              { label: 'ALL-TIME PROFIT',    val: `${allTimeProfit < 0 ? '-' : ''}$${Math.abs(Math.round(allTimeProfit)).toLocaleString()}`, c: allTimeProfit >= 0 ? 'var(--green)' : 'var(--red)',
                onClick: () => setDrilldown({ title: 'All-Time Profit', trucks: allTimeSold.sort((a,b)=>(truckProfit(b)||0)-(truckProfit(a)||0)).map(t => ({ ...t, _label1: 'ALL-IN', _col1: `$${allIn(t).toLocaleString()}`, _label2: 'PROFIT', _col2: `${(truckProfit(t)||0)<0?'-':''}$${Math.abs(Math.round(truckProfit(t)||0)).toLocaleString()}` })) }) },
              { label: 'AVG PROFIT / TRUCK', val: `${avgProfit < 0 ? '-' : ''}$${Math.abs(Math.round(avgProfit)).toLocaleString()}`, c: 'var(--gold)',
                onClick: () => setDrilldown({ title: 'Avg Profit Breakdown', trucks: allTimeSold.sort((a,b)=>(truckProfit(b)||0)-(truckProfit(a)||0)).map(t => ({ ...t, _label1: 'SOLD FOR', _col1: `$${(t.sold_price||0).toLocaleString()}`, _label2: 'PROFIT', _col2: `${(truckProfit(t)||0)<0?'-':''}$${Math.abs(Math.round(truckProfit(t)||0)).toLocaleString()}` })) }) },
              { label: 'TOTAL TRUCKS SOLD',  val: String(soldTotal), c: 'var(--text)',
                onClick: () => setDrilldown({ title: 'All Sold Trucks', trucks: allTimeSold.sort((a,b)=>new Date(b.date_sold||0).getTime()-new Date(a.date_sold||0).getTime()).map(t => ({ ...t, _label1: 'SOLD DATE', _col1: t.date_sold||'—', _label2: 'PROFIT', _col2: `${(truckProfit(t)||0)<0?'-':''}$${Math.abs(Math.round(truckProfit(t)||0)).toLocaleString()}` })) }) },
            ].map(s => (
              <div key={s.label} onClick={s.onClick} style={{ ...card, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ fontSize: 9.5, color: 'var(--text3)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 6 }}>Click to view →</div>
              </div>
            ))}
          </div>

          {/* Chart + Donut */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, marginBottom: 20 }}>

            {/* Profit chart */}
            <div style={{ ...card, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 10 }}>PROFIT BY PERIOD</div>
                  <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                    {[
                      { l: 'NET PROFIT', v: `${totProfit < 0 ? '-' : ''}$${Math.abs(Math.round(totProfit)).toLocaleString()}`, c: totProfit >= 0 ? 'var(--gold)' : 'var(--red)' },
                      { l: 'REVENUE',    v: `$${Math.round(totRev).toLocaleString()}`,   c: 'var(--text)' },
                      { l: 'TRUCKS',     v: String(totSold),                              c: 'var(--text)' },
                    ].map(s => (
                      <div key={s.l}>
                        <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 4, letterSpacing: '0.1em', fontWeight: 600 }}>{s.l}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, overflow: 'hidden' }}>
                    {(['monthly', 'quarterly', 'ytd'] as const).map(m => (
                      <button key={m} onClick={() => setChartMode(m)} style={{ padding: '5px 10px', fontSize: 11, cursor: 'pointer', border: 'none', background: chartMode === m ? 'var(--gold)' : 'transparent', color: chartMode === m ? '#000' : 'var(--text3)', fontWeight: 600 }}>
                        {m === 'monthly' ? 'Monthly' : m === 'quarterly' ? 'Quarterly' : 'YTD'}
                      </button>
                    ))}
                  </div>
                  {chartMode === 'monthly' && (
                    <div style={{ display: 'flex', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, overflow: 'hidden' }}>
                      {([6, 12, 24] as const).map(r => (
                        <button key={r} onClick={() => setRange(r)} style={{ padding: '5px 10px', fontSize: 11, cursor: 'pointer', border: 'none', background: range === r ? 'var(--gold)' : 'transparent', color: range === r ? '#000' : 'var(--text3)', fontWeight: 600 }}>
                          {r}mo
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {months.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>No sold trucks yet.</div>
              ) : (
                <div ref={chartRef} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: 160, gap: 3, paddingLeft: 46, paddingBottom: 28, position: 'relative' }}>
                    {[1, 0.5, 0].map((p, i) => {
                      const v = maxP * 1.1 * p
                      return (
                        <div key={i}>
                          <div style={{ position: 'absolute', left: 0, top: `${(1-p)*100}%`, fontSize: 8, color: 'var(--text4)', transform: 'translateY(-50%)', whiteSpace: 'nowrap' }}>
                            ${v >= 1000 ? `${Math.round(v/1000)}k` : Math.round(v)}
                          </div>
                          <div style={{ position: 'absolute', left: 46, right: 0, top: `${(1-p)*100}%`, height: 1, background: 'var(--border2)', pointerEvents: 'none' }} />
                        </div>
                      )
                    })}
                    {months.map((key, i) => {
                      const d = chartData[key]
                      const h = Math.min(Math.abs((d.profit / (maxP * 1.1)) * 100), 100)
                      const neg = d.profit < 0
                      const hov = hovBar === i
                      const thisYear = key.split('-')[0]
                      const prevYear = i > 0 ? months[i-1].split('-')[0] : thisYear
                      const isNewYear = chartMode === 'monthly' && thisYear !== prevYear
                      const showLabel = months.length <= 18 || i % 2 === 0
                      return (
                        <div key={key} style={{ flex: 1, minWidth: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}
                          onMouseEnter={e => {
                            setHovBar(i)
                            const r = e.currentTarget.getBoundingClientRect()
                            const pr = chartRef.current?.getBoundingClientRect()
                            if (pr) setTip({ x: r.left - pr.left + r.width/2, y: r.top - pr.top - 12, label: fmtKey(key), profit: d.profit, revenue: d.revenue, count: d.count })
                          }}
                          onMouseLeave={() => { setHovBar(null); setTip(null) }}
                          onClick={() => setDrilldown({
                            title: `${fmtKey(key)} — Sold Trucks`,
                            trucks: d.trucks.sort((a, b) => (truckProfit(b) || 0) - (truckProfit(a) || 0)).map(t => ({
                              ...t,
                              _label1: 'SOLD FOR',
                              _col1: `$${(t.sold_price || 0).toLocaleString()}`,
                              _label2: 'PROFIT',
                              _col2: `${(truckProfit(t) || 0) < 0 ? '-' : ''}$${Math.abs(Math.round(truckProfit(t) || 0)).toLocaleString()}`,
                            }))
                          })}>
                          {isNewYear && (
                            <div style={{ position: 'absolute', left: -4, top: 0, bottom: 0, width: 1, background: 'var(--gold)', opacity: 0.4 }} />
                          )}
                          {isNewYear && (
                            <div style={{ position: 'absolute', left: -3, top: -16, fontSize: 9, color: 'var(--gold)', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>{thisYear}</div>
                          )}
                          <div style={{ width: hov ? '88%' : '70%', height: `${h}%`, minHeight: 3, borderRadius: neg ? '0 0 5px 5px' : '5px 5px 0 0', transition: 'all 0.15s', background: neg ? (hov ? '#ef4444' : 'var(--card-bg)') : (hov ? 'var(--gold)' : 'var(--gold-dim)'), boxShadow: hov ? (neg ? '0 0 12px #ef444466' : '0 0 12px rgba(234,179,8,0.4)') : 'none' }} />
                          {showLabel && (
                            <div style={{ position: 'absolute', bottom: -22, fontSize: 7.5, color: hov ? 'var(--text2)' : isNewYear ? 'var(--gold)' : 'var(--text4)', whiteSpace: 'nowrap', fontWeight: isNewYear ? 700 : 400 }}>
                              {chartMode === 'monthly'
                                ? new Date(parseInt(key.split('-')[0]), parseInt(key.split('-')[1]) - 1, 1).toLocaleDateString('en-US', { month: 'short' })
                                : fmtKey(key)}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text4)', textAlign: 'center', marginTop: 4 }}>Click any bar to see breakdown</div>
                  {tip && (
                    <div style={{ position: 'absolute', left: tip.x, top: tip.y, transform: 'translate(-50%,-100%)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 4, letterSpacing: '0.1em', fontWeight: 700 }}>{tip.label}</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: tip.profit >= 0 ? 'var(--gold)' : 'var(--red)', marginBottom: 3 }}>{tip.profit < 0 ? '-' : ''}${Math.abs(Math.round(tip.profit)).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>Revenue: ${Math.round(tip.revenue).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{tip.count} truck{tip.count !== 1 ? 's' : ''} sold</div>
                      <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 4 }}>Click to see breakdown →</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Aging donut */}
            <div style={{ ...card, padding: '20px 22px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 16 }}>INVENTORY AGING</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <svg width="150" height="150" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={R} fill="var(--input-bg)" />
                  {totalAging === 0
                    ? <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="16" />
                    : arcs.map((a, i) => a.pct > 0 && (
                      <path key={i} d={a.path} fill={a.color}
                        opacity={hovDonut === null || hovDonut === a.label ? 1 : 0.2}
                        style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                        onMouseEnter={() => setHovDonut(a.label)}
                        onMouseLeave={() => setHovDonut(null)} />
                    ))}
                  <circle cx="70" cy="70" r="34" fill="var(--surface)" />
                  <text x="70" y="63" textAnchor="middle" fill="var(--text)" fontSize="22" fontWeight="800" fontFamily="system-ui">{inStock}</text>
                  <text x="70" y="77" textAnchor="middle" fill="var(--text3)" fontSize="7.5" letterSpacing="1.5" fontWeight="600">IN STOCK</text>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {donut.map(s => (
                  <div key={s.label} onMouseEnter={() => setHovDonut(s.label)} onMouseLeave={() => setHovDonut(null)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', background: hovDonut === s.label ? 'var(--hover)' : 'transparent', border: `1px solid ${hovDonut === s.label ? 'var(--border)' : 'transparent'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: hovDonut === s.label ? 'var(--text)' : 'var(--text2)', fontWeight: 500 }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: s.count > 0 ? 'var(--text)' : 'var(--text3)' }}>{s.count}</span>
                      {totalAging > 0 && s.count > 0 && <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{Math.round(s.count/totalAging*100)}%</span>}
                    </div>
                  </div>
                ))}
              </div>
              {totalAging > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em', fontWeight: 700 }}>CAPITAL AT RISK</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)' }}>
                    ${trucks.filter(t => t.status !== 'Sold' && t.bought_on && Math.floor((Date.now()-new Date(t.bought_on).getTime())/86400000) >= 30).reduce((s, t) => s + allIn(t), 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom tables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Aging 30+ */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span>⚠️</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em' }}>AGING INVENTORY (30+ DAYS)</span>
                {agingList.length > 0 && <span style={{ marginLeft: 'auto', background: 'var(--gold-dim)', color: 'var(--orange)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{agingList.length}</span>}
              </div>
              {agingList.length === 0
                ? <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text3)', fontSize: 13 }}>✓ No aging inventory</div>
                : agingList.slice(0, 6).map(t => (
                  <div key={t.id} onClick={() => window.location.href = `/inventory/${t.id}`}
                    style={{ borderBottom: '1px solid var(--border2)', padding: '11px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s' }}
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
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span>⏳</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em' }}>PENDING PAYMENTS</span>
                {pending.length > 0 && <span style={{ marginLeft: 'auto', background: 'var(--gold-dim)', color: 'var(--orange)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{pending.length}</span>}
              </div>
              {pending.length === 0
                ? <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text3)', fontSize: 13 }}>📥 All caught up</div>
                : pending.slice(0, 6).map(t => (
                  <div key={t.id} onClick={() => window.location.href = `/inventory/${t.id}`}
                    style={{ borderBottom: '1px solid var(--border2)', padding: '11px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s' }}
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
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>${(t.sold_price||0).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>profit: ${Math.round(truckProfit(t)||0).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              {pending.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em', fontWeight: 700 }}>TOTAL OUTSTANDING</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>${pendingAmt.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Drilldown Modal */}
      {drilldown && (
        <div onClick={() => setDrilldown(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border2)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{drilldown.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{drilldown.trucks.length} truck{drilldown.trucks.length !== 1 ? 's' : ''}</span>
                <button onClick={() => setDrilldown(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {drilldown.trucks.length === 0
                ? <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No trucks to show.</div>
                : drilldown.trucks.map((t: any) => (
                  <div key={t.id} onClick={() => { window.location.href = `/inventory/${t.id}`; setDrilldown(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: '1px solid var(--border2)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.year} {t.make} {t.model}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'monospace' }}>{t.vin}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 2 }}>{t._label1}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t._col1}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                      <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 2 }}>{t._label2}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>{t._col2}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text4)' }}>→</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}