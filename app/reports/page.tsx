'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string; status: string; date_sold: string | null; bought_on: string | null
  purchase_price: number | null; recondition_cost: number | null; sold_price: number | null
  make: string | null; model: string | null; year: number | null; kilometers: number | null
  payment_status: string | null; customer: string | null
}
type VendorRow = { truck_id: string; vendor: string; amount: number }
type CostRow   = { truck_id: string; amount: number }
type LaborRow  = { truck_id: string; hours: number; rate: number }
type PartRow   = { truck_id: string; qty: number; unit_cost: number }

type Tab   = 'Profit' | 'Aging' | 'Vendor Spend' | 'Cashflow' | 'By Make/Model'
type Range = '6M' | '1Y' | '2Y' | 'All'
const rangeCounts: Record<Range, number> = { '6M': 6, '1Y': 12, '2Y': 24, 'All': 9999 }

function fmt$(n: number) { return `$${Math.round(n).toLocaleString()}` }
function fmtK(n: number) { return Math.abs(n) >= 1000 ? `${n < 0 ? '-' : ''}$${(Math.abs(n)/1000).toFixed(0)}k` : fmt$(n) }

export default function ReportsPage() {
  const [trucks,      setTrucks]      = useState<Truck[]>([])
  const [vendorRows,  setVendorRows]  = useState<VendorRow[]>([])
  const [partRows,    setPartRows]    = useState<PartRow[]>([])
  const [laborRows,   setLaborRows]   = useState<LaborRow[]>([])
  const [otherRows,   setOtherRows]   = useState<CostRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState<Tab>('Profit')
  const [range,       setRange]       = useState<Range>('All')
  const [chartMode,   setChartMode]   = useState<'profit' | 'revenue' | 'both'>('profit')
  const [hovRow,      setHovRow]      = useState<number | null>(null)
  const [mmSort,      setMmSort]      = useState<'profit' | 'sold' | 'margin' | 'avg'>('profit')
  const [mmGroup,     setMmGroup]     = useState<'make' | 'make+model'>('make+model')
  const chartRef      = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: t }, { data: v }, { data: p }, { data: l }, { data: o }] = await Promise.all([
      supabase.from('Inventory Data').select('id,status,date_sold,bought_on,purchase_price,recondition_cost,sold_price,make,model,year,kilometers,payment_status,customer'),
      supabase.from('vendor_invoices').select('truck_id,vendor,amount'),
      supabase.from('parts').select('truck_id,qty,unit_cost'),
      supabase.from('labor').select('truck_id,hours,rate'),
      supabase.from('other_costs').select('truck_id,amount'),
    ])
    setTrucks(t || []); setVendorRows(v || []); setPartRows(p || [])
    setLaborRows(l || []); setOtherRows(o || [])
    setLoading(false)
  }

  const extraCost = (id: string) =>
    partRows.filter(r=>r.truck_id===id).reduce((s,r)=>s+r.qty*r.unit_cost,0) +
    laborRows.filter(r=>r.truck_id===id).reduce((s,r)=>s+r.hours*r.rate,0) +
    vendorRows.filter(r=>r.truck_id===id).reduce((s,r)=>s+r.amount,0) +
    otherRows.filter(r=>r.truck_id===id).reduce((s,r)=>s+r.amount,0)

  const allIn    = (t: Truck) => (t.purchase_price||0) + (t.recondition_cost||0) + extraCost(t.id)
  const trProfit = (t: Truck) => t.sold_price != null ? t.sold_price - allIn(t) : null

  // ── Monthly data ──
  const soldTrucks = trucks.filter(t => t.status === 'Sold' && t.date_sold)
  const byMonthMap: Record<string, { month: string; sold: number; revenue: number; cost: number; profit: number }> = {}
  soldTrucks.forEach(t => {
    const d = new Date(t.date_sold!)
    if (isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!byMonthMap[key]) byMonthMap[key] = { month: label, sold: 0, revenue: 0, cost: 0, profit: 0 }
    const cost = allIn(t); const rev = t.sold_price || 0
    byMonthMap[key].sold++
    byMonthMap[key].revenue += rev
    byMonthMap[key].cost    += cost
    byMonthMap[key].profit  += rev - cost
  })
  const allMonths   = Object.keys(byMonthMap).sort().map(k => byMonthMap[k])
  const monthData   = allMonths.slice(-rangeCounts[range])
  const totalRev    = monthData.reduce((s,d)=>s+d.revenue,0)
  const totalCost   = monthData.reduce((s,d)=>s+d.cost,0)
  const totalProfit = monthData.reduce((s,d)=>s+d.profit,0)
  const totalSold   = monthData.reduce((s,d)=>s+d.sold,0)
  const avgMargin   = totalRev > 0 ? (totalProfit/totalRev*100).toFixed(1) : '0.0'

  // ── Make/Model breakdown ──
  const mmMap: Record<string, { key: string; sold: number; totalProfit: number; totalRevenue: number; totalCost: number }> = {}
  soldTrucks.forEach(t => {
    const key = mmGroup === 'make'
      ? (t.make || 'Unknown')
      : `${t.make || 'Unknown'} ${t.model || ''}`.trim()
    if (!mmMap[key]) mmMap[key] = { key, sold: 0, totalProfit: 0, totalRevenue: 0, totalCost: 0 }
    mmMap[key].sold++
    mmMap[key].totalProfit  += trProfit(t) ?? 0
    mmMap[key].totalRevenue += t.sold_price || 0
    mmMap[key].totalCost    += allIn(t)
  })
  const mmData = Object.values(mmMap)
    .map(r => ({
      ...r,
      avgProfit: r.sold > 0 ? r.totalProfit / r.sold : 0,
      margin: r.totalRevenue > 0 ? (r.totalProfit / r.totalRevenue * 100) : 0,
    }))
    .sort((a, b) => {
      if (mmSort === 'profit')  return b.totalProfit - a.totalProfit
      if (mmSort === 'sold')    return b.sold - a.sold
      if (mmSort === 'margin')  return b.margin - a.margin
      if (mmSort === 'avg')     return b.avgProfit - a.avgProfit
      return 0
    })
  const mmTotalProfit = mmData.reduce((s, r) => s + r.totalProfit, 0)
  const mmBestKey     = mmData[0]?.key || '—'
  const mmBestAvg     = mmData[0]?.avgProfit || 0

  // ── Aging ──
  const inStock = trucks.filter(t => t.status !== 'Sold' && t.status !== 'Intake' && t.bought_on)
  const daysIn  = (t: Truck) => t.bought_on ? Math.floor((Date.now()-new Date(t.bought_on).getTime())/86400000) : null
  const agingBuckets = [
    { label: '0–15 days',  color: 'var(--green)',  trucks: inStock.filter(t => { const d = daysIn(t)!; return d >= 0 && d <= 15 }) },
    { label: '16–30 days', color: 'var(--gold)',   trucks: inStock.filter(t => { const d = daysIn(t)!; return d > 15 && d <= 30 }) },
    { label: '31–60 days', color: 'var(--orange)', trucks: inStock.filter(t => { const d = daysIn(t)!; return d > 30 && d <= 60 }) },
    { label: '60+ days',   color: 'var(--red)',    trucks: inStock.filter(t => { const d = daysIn(t)!; return d > 60 }) },
  ]

  // ── Vendor spend ──
  const vendorSpend: Record<string, number> = {}
  vendorRows.forEach(r => { vendorSpend[r.vendor] = (vendorSpend[r.vendor]||0) + r.amount })
  const topVendors = Object.entries(vendorSpend).sort((a,b)=>b[1]-a[1]).slice(0,10)
  const totalVendorSpend = topVendors.reduce((s,[,v])=>s+v,0)

  // ── Cashflow ──
  const cashByMonth: Record<string, { month: string; inflow: number; outflow: number }> = {}
  const ensureCash = (key: string, label: string) => { if (!cashByMonth[key]) cashByMonth[key] = { month: label, inflow: 0, outflow: 0 } }
  const monthKey = (dateStr: string) => {
    const d = new Date(dateStr); if (isNaN(d.getTime())) return null
    return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) }
  }
  soldTrucks.forEach(t => {
    const m = monthKey(t.date_sold!); if (!m) return
    ensureCash(m.key, m.label); cashByMonth[m.key].inflow += t.sold_price || 0
  })
  trucks.filter(t => t.bought_on).forEach(t => {
    const m = monthKey(t.bought_on!); if (!m) return
    ensureCash(m.key, m.label); cashByMonth[m.key].outflow += (t.purchase_price || 0) + (t.recondition_cost || 0)
  })
  vendorRows.forEach(r => {
    const truck = trucks.find(t => t.id === r.truck_id); const dateStr = truck?.bought_on; if (!dateStr) return
    const m = monthKey(dateStr); if (!m) return
    ensureCash(m.key, m.label); cashByMonth[m.key].outflow += r.amount
  })
  partRows.forEach(r => {
    const truck = trucks.find(t => t.id === r.truck_id); const dateStr = truck?.bought_on; if (!dateStr) return
    const m = monthKey(dateStr); if (!m) return
    ensureCash(m.key, m.label); cashByMonth[m.key].outflow += r.qty * r.unit_cost
  })
  laborRows.forEach(r => {
    const truck = trucks.find(t => t.id === r.truck_id); const dateStr = truck?.bought_on; if (!dateStr) return
    const m = monthKey(dateStr); if (!m) return
    ensureCash(m.key, m.label); cashByMonth[m.key].outflow += r.hours * r.rate
  })
  otherRows.forEach(r => {
    const truck = trucks.find(t => t.id === r.truck_id); const dateStr = truck?.bought_on; if (!dateStr) return
    const m = monthKey(dateStr); if (!m) return
    ensureCash(m.key, m.label); cashByMonth[m.key].outflow += r.amount
  })
  const cashData = Object.keys(cashByMonth).sort().slice(-rangeCounts[range]).map(k => cashByMonth[k])

  // ── Chart ──
  useEffect(() => {
    if (!chartRef.current || activeTab !== 'Profit') return
    const load = async () => {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)
      if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null }
      const ctx = chartRef.current?.getContext('2d'); if (!ctx) return
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
      const datasets: any[] = []
      if (chartMode === 'profit' || chartMode === 'both')
        datasets.push({ label: 'Profit', data: monthData.map(d => Math.round(d.profit)), backgroundColor: monthData.map(d => d.profit >= 0 ? (isDark ? '#EAB308' : '#b45309') : '#ef4444'), borderRadius: 4 })
      if (chartMode === 'revenue' || chartMode === 'both')
        datasets.push({ label: 'Revenue', data: monthData.map(d => Math.round(d.revenue)), backgroundColor: isDark ? 'rgba(59,130,246,0.5)' : 'rgba(2,132,199,0.5)', borderRadius: 4 })
      if (chartMode === 'both')
        datasets.push({ label: 'Cost', data: monthData.map(d => Math.round(d.cost)), backgroundColor: 'rgba(107,114,128,0.35)', borderRadius: 4 })
      const grid = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'
      const lbl  = isDark ? '#555' : '#aaa'
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: { labels: monthData.map(d => d.month), datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 300 },
          plugins: {
            legend: { display: chartMode === 'both', labels: { color: isDark ? '#888' : '#555', font: { size: 10 } } },
            tooltip: { backgroundColor: isDark ? '#141414' : '#fff', borderColor: isDark ? 'rgba(234,179,8,0.2)' : 'rgba(0,0,0,0.1)', borderWidth: 1, titleColor: isDark ? '#fff' : '#111', bodyColor: isDark ? '#EAB308' : '#b45309', padding: 12,
              callbacks: { label: (i: any) => { const v = i.raw as number; return `${i.dataset.label}: ${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString()}` } } },
          },
          scales: {
            x: { ticks: { color: lbl, font: { size: 9 }, maxRotation: 45, autoSkip: monthData.length > 18 }, grid: { color: grid }, border: { color: grid } },
            y: { ticks: { color: lbl, font: { size: 9 }, callback: (v: any) => fmtK(v) }, grid: { color: grid }, border: { color: grid } },
          },
        },
      })
    }
    load()
    return () => { chartInstance.current?.destroy(); chartInstance.current = null }
  }, [monthData, chartMode, activeTab])

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .rep-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px}
        .rep-tabs{display:flex;gap:4px;margin-bottom:20px;overflow-x:auto}
        .rep-tabs::-webkit-scrollbar{display:none}
        @media(max-width:768px){.rep-stats{grid-template-columns:1fr 1fr!important}}
      `}</style>
      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>ANALYTICS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Reports</h1>
          <div style={{ marginTop: 16, height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)' }} />
        </div>

        <div className="rep-tabs">
          {(['Profit','Aging','Vendor Spend','Cashflow','By Make/Model'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab===tab?'var(--gold)':'var(--card-bg)', border: `1px solid ${activeTab===tab?'var(--gold)':'var(--card-border)'}`, color: activeTab===tab?'#000':'var(--text3)', borderRadius: 99, padding: '7px 18px', fontSize: 12, cursor: 'pointer', fontWeight: activeTab===tab?800:500, whiteSpace: 'nowrap', transition: 'all 0.15s', boxShadow: activeTab===tab?'0 2px 10px var(--gold-glow)':'none' }}>{tab}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (<>

          {/* ══ PROFIT TAB ══ */}
          {activeTab === 'Profit' && (
            <>
              <div className="rep-stats">
                {[
                  { label: 'TOTAL REVENUE', value: fmt$(totalRev),    color: 'var(--text)'  },
                  { label: 'TOTAL COST',    value: fmt$(totalCost),   color: 'var(--text)'  },
                  { label: 'NET PROFIT',    value: `${totalProfit<0?'-':''}${fmt$(Math.abs(totalProfit))}`, color: totalProfit>=0?'var(--green)':'var(--red)' },
                  { label: 'TRUCKS SOLD',   value: String(totalSold), color: 'var(--gold)'  },
                  { label: 'AVG MARGIN',    value: `${avgMargin}%`,   color: parseFloat(avgMargin)>=0?'var(--green)':'var(--red)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '14px 16px', borderBottom: '2px solid var(--gold)', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {monthData.length === 0 ? (
                <div className="gcard" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text4)' }}>No sold trucks yet — data will appear here.</div>
              ) : (<>
                <div className="gcard" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 700 }}>Monthly Performance</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                        {([['profit','P'],['revenue','R'],['both','All']] as any[]).map(([m,l]) => (
                          <button key={m} onClick={() => setChartMode(m)} style={{ padding: '5px 10px', fontSize: 11, cursor: 'pointer', border: 'none', background: chartMode===m?'var(--gold)':'transparent', color: chartMode===m?'#000':'var(--text3)', fontWeight: chartMode===m?700:400, transition: 'all 0.15s' }}>{l}</button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                        {(['6M','1Y','2Y','All'] as Range[]).map(r => (
                          <button key={r} onClick={() => setRange(r)} style={{ padding: '5px 8px', fontSize: 11, cursor: 'pointer', border: 'none', background: range===r?'var(--gold)':'transparent', color: range===r?'#000':'var(--text3)', fontWeight: range===r?700:400, transition: 'all 0.15s' }}>{r}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'relative', width: '100%', height: 260 }}><canvas ref={chartRef} /></div>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Month','Sold','Revenue','Cost','Profit','Margin'].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: h==='Month'?'left':'right', color: 'var(--text4)', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthData.map((row, i) => {
                          const margin = row.revenue > 0 ? ((row.profit/row.revenue)*100).toFixed(1) : '0.0'
                          return (
                            <tr key={i} onMouseEnter={() => setHovRow(i)} onMouseLeave={() => setHovRow(null)}
                              style={{ borderBottom: '1px solid var(--border2)', background: hovRow===i?'var(--hover)':'transparent', transition: 'background 0.15s' }}>
                              <td style={{ padding: '10px 14px', color: 'var(--text)', fontWeight: 600 }}>{row.month}</td>
                              <td style={{ padding: '10px 14px', color: 'var(--text2)', textAlign: 'right' }}>{row.sold}</td>
                              <td style={{ padding: '10px 14px', color: 'var(--text)', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt$(row.revenue)}</td>
                              <td style={{ padding: '10px 14px', color: 'var(--text2)', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt$(row.cost)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: row.profit>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>{row.profit>=0?'':'-'}{fmt$(Math.abs(row.profit))}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, color: parseFloat(margin)>=0?'var(--green)':'var(--red)', fontWeight: 600 }}>{margin}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--hover)' }}>
                          <td style={{ padding: '11px 14px', color: 'var(--text)', fontWeight: 800 }}>Total</td>
                          <td style={{ padding: '11px 14px', color: 'var(--gold)', textAlign: 'right', fontWeight: 700 }}>{totalSold}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--text)', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt$(totalRev)}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--text2)', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt$(totalCost)}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: totalProfit>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>{totalProfit>=0?'':'-'}{fmt$(Math.abs(totalProfit))}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: totalProfit>=0?'var(--green)':'var(--red)' }}>{avgMargin}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>)}
            </>
          )}

          {/* ══ AGING TAB ══ */}
          {activeTab === 'Aging' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                {agingBuckets.map(b => (
                  <div key={b.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '14px 16px', borderBottom: `2px solid ${b.color}`, boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>{b.label.toUpperCase()}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: b.color, marginBottom: 4 }}>{b.trucks.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmt$(b.trucks.reduce((s,t)=>s+allIn(t),0))} tied up</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Truck','Status','Bought On','Days','KMs','All-In Cost'].map(h => (
                          <th key={h} style={{ padding: '11px 14px', textAlign: h==='All-In Cost'?'right':'left', color: 'var(--text4)', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inStock.length === 0
                        ? <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text4)' }}>No trucks in stock.</td></tr>
                        : [...inStock].map(t => ({ ...t, days: daysIn(t) ?? 0 })).sort((a,b) => b.days - a.days).map(t => {
                            const color = t.days > 60 ? 'var(--red)' : t.days > 30 ? 'var(--orange)' : t.days > 15 ? 'var(--gold)' : 'var(--green)'
                            return (
                              <tr key={t.id} onClick={() => window.location.href=`/inventory/${t.id}`}
                                style={{ borderBottom: '1px solid var(--border2)', cursor: 'pointer', transition: 'background 0.15s' }}
                                onMouseEnter={e=>(e.currentTarget.style.background='var(--hover)')}
                                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                                <td style={{ padding: '10px 14px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.year} {t.make} {t.model}</td>
                                <td style={{ padding: '10px 14px' }}><span style={{ background: 'var(--hover)', color: 'var(--text2)', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{t.status}</span></td>
                                <td style={{ padding: '10px 14px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{t.bought_on || '—'}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 700, color }}>{t.days}d</td>
                                <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{t.kilometers?.toLocaleString() || '—'}</td>
                                <td style={{ padding: '10px 14px', color: 'var(--gold)', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt$(allIn(t))}</td>
                              </tr>
                            )
                          })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ VENDOR SPEND TAB ══ */}
          {activeTab === 'Vendor Spend' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'TOTAL VENDOR SPEND', val: fmt$(vendorRows.reduce((s,r)=>s+r.amount,0)), color: 'var(--gold)' },
                  { label: 'UNIQUE VENDORS',      val: String(Object.keys(vendorSpend).length),      color: 'var(--text)' },
                  { label: 'AVG PER INVOICE',     val: vendorRows.length > 0 ? fmt$(vendorRows.reduce((s,r)=>s+r.amount,0)/vendorRows.length) : '$0', color: 'var(--text)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '14px 16px', borderBottom: '2px solid var(--gold)', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              {topVendors.length === 0
                ? <div className="gcard" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text4)' }}>No vendor invoices yet.</div>
                : (
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text4)', fontWeight: 700, letterSpacing: '0.1em' }}>TOP VENDORS BY SPEND</div>
                    {topVendors.map(([vendor, amount], i) => {
                      const pct = totalVendorSpend > 0 ? (amount/totalVendorSpend*100) : 0
                      return (
                        <div key={vendor} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text3)', flexShrink: 0 }}>{i+1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{vendor}</div>
                            <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', borderRadius: 99 }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>{fmt$(amount)}</div>
                            <div style={{ fontSize: 10, color: 'var(--text4)' }}>{pct.toFixed(1)}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
            </>
          )}

          {/* ══ CASHFLOW TAB ══ */}
          {activeTab === 'Cashflow' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {(['6M','1Y','2Y','All'] as Range[]).map(r => (
                    <button key={r} onClick={() => setRange(r)} style={{ padding: '5px 10px', fontSize: 11, cursor: 'pointer', border: 'none', background: range===r?'var(--gold)':'transparent', color: range===r?'#000':'var(--text3)', fontWeight: range===r?700:400 }}>{r}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'TOTAL INFLOW',  val: fmt$(cashData.reduce((s,d)=>s+d.inflow,0)),  color: 'var(--green)' },
                  { label: 'TOTAL OUTFLOW', val: fmt$(cashData.reduce((s,d)=>s+d.outflow,0)), color: 'var(--red)'   },
                  { label: 'NET CASHFLOW',  val: fmt$(cashData.reduce((s,d)=>s+d.inflow-d.outflow,0)), color: cashData.reduce((s,d)=>s+d.inflow-d.outflow,0)>=0?'var(--green)':'var(--red)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '14px 16px', borderBottom: `2px solid ${s.color}`, boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              {cashData.length === 0
                ? <div className="gcard" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text4)' }}>No data yet.</div>
                : (
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Month','Cash In (Sales)','Cash Out (Purchases)','Net'].map(h => (
                              <th key={h} style={{ padding: '11px 14px', textAlign: h==='Month'?'left':'right', color: 'var(--text4)', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cashData.map((row, i) => {
                            const net = row.inflow - row.outflow
                            return (
                              <tr key={i} style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                                onMouseEnter={e=>(e.currentTarget.style.background='var(--hover)')}
                                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                                <td style={{ padding: '10px 14px', color: 'var(--text)', fontWeight: 600 }}>{row.month}</td>
                                <td style={{ padding: '10px 14px', color: 'var(--green)', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt$(row.inflow)}</td>
                                <td style={{ padding: '10px 14px', color: 'var(--red)', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt$(row.outflow)}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 800, textAlign: 'right', color: net>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>{net>=0?'':'-'}{fmt$(Math.abs(net))}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--hover)' }}>
                            <td style={{ padding: '11px 14px', color: 'var(--text)', fontWeight: 800 }}>Total</td>
                            <td style={{ padding: '11px 14px', color: 'var(--green)', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt$(cashData.reduce((s,d)=>s+d.inflow,0))}</td>
                            <td style={{ padding: '11px 14px', color: 'var(--red)', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt$(cashData.reduce((s,d)=>s+d.outflow,0))}</td>
                            <td style={{ padding: '11px 14px', fontWeight: 800, fontSize: 14, textAlign: 'right', color: cashData.reduce((s,d)=>s+d.inflow-d.outflow,0)>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>
                              {(() => { const n = cashData.reduce((s,d)=>s+d.inflow-d.outflow,0); return `${n<0?'-':''}${fmt$(Math.abs(n))}` })()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
            </>
          )}

          {/* ══ BY MAKE/MODEL TAB ══ */}
          {activeTab === 'By Make/Model' && (
            <>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'UNIQUE TYPES',    val: String(mmData.length), color: 'var(--text)'  },
                  { label: 'BEST PERFORMER',  val: mmBestKey,             color: 'var(--gold)'  },
                  { label: 'BEST AVG PROFIT', val: fmt$(mmBestAvg),       color: 'var(--green)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '14px 16px', borderBottom: '2px solid var(--gold)', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontSize: s.label === 'BEST PERFORMER' ? 15 : 22, fontWeight: 800, color: s.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {([['make','By Make'],['make+model','Make + Model']] as const).map(([v,l]) => (
                    <button key={v} onClick={() => setMmGroup(v)} style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer', border: 'none', background: mmGroup===v?'var(--gold)':'transparent', color: mmGroup===v?'#000':'var(--text3)', fontWeight: mmGroup===v?700:400, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>{l}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {([['profit','Total Profit'],['avg','Avg Profit'],['sold','# Sold'],['margin','Margin']] as const).map(([v,l]) => (
                    <button key={v} onClick={() => setMmSort(v)} style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer', border: 'none', background: mmSort===v?'var(--gold)':'transparent', color: mmSort===v?'#000':'var(--text3)', fontWeight: mmSort===v?700:400, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>{l}</button>
                  ))}
                </div>
              </div>

              {mmData.length === 0
                ? <div className="gcard" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text4)' }}>No sold trucks yet — data will appear here.</div>
                : (
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['#','Make / Model','Sold','Total Profit','Avg Profit','Avg Revenue','Margin'].map(h => (
                              <th key={h} style={{ padding: '11px 14px', textAlign: h==='Make / Model'||h==='#'?'left':'right', color: 'var(--text4)', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {mmData.map((row, i) => {
                            const maxProfit = Math.abs(mmData[0]?.totalProfit || 1)
                            const barPct = Math.max(0, (row.totalProfit / maxProfit) * 100)
                            return (
                              <tr key={row.key} style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                                onMouseEnter={e=>(e.currentTarget.style.background='var(--hover)')}
                                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                                <td style={{ padding: '10px 14px', color: 'var(--text4)', fontWeight: 700, fontSize: 11 }}>{i+1}</td>
                                <td style={{ padding: '10px 14px', minWidth: 160 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 5 }}>{row.key}</div>
                                  <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', width: 100 }}>
                                    <div style={{ height: '100%', width: `${barPct}%`, background: row.totalProfit >= 0 ? 'var(--gold)' : 'var(--red)', borderRadius: 99 }} />
                                  </div>
                                </td>
                                <td style={{ padding: '10px 14px', color: 'var(--text2)', textAlign: 'right', fontWeight: 600 }}>{row.sold}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: row.totalProfit>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>
                                  {row.totalProfit>=0?'':'-'}{fmt$(Math.abs(row.totalProfit))}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: row.avgProfit>=0?'var(--gold)':'var(--red)', whiteSpace: 'nowrap' }}>
                                  {row.avgProfit>=0?'':'-'}{fmt$(Math.abs(row.avgProfit))}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                                  {fmt$(row.totalRevenue / row.sold)}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: row.margin>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>
                                  {row.margin.toFixed(1)}%
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--hover)' }}>
                            <td colSpan={2} style={{ padding: '11px 14px', color: 'var(--text)', fontWeight: 800 }}>Total ({mmData.length} types)</td>
                            <td style={{ padding: '11px 14px', color: 'var(--gold)', textAlign: 'right', fontWeight: 700 }}>{mmData.reduce((s,r)=>s+r.sold,0)}</td>
                            <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: mmTotalProfit>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>
                              {mmTotalProfit>=0?'':'-'}{fmt$(Math.abs(mmTotalProfit))}
                            </td>
                            <td colSpan={3} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
            </>
          )}

        </>)}
      </main>
    </>
  )
}