'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string; status: string; date_sold: string | null; bought_on: string | null
  purchase_price: number | null; recondition_cost: number | null; sold_price: number | null
  make: string | null; model: string | null; year: number | null; kilometers: number | null
  payment_status: string | null; customer: string | null; stock_number: string | null
  found_by: string | null
}
type VendorRow = { truck_id: string; vendor: string; amount: number }
type CostRow   = { truck_id: string; amount: number }
type LaborRow  = { truck_id: string; hours: number; rate: number }
type PartRow   = { truck_id: string; qty: number; unit_cost: number }

type Tab   = 'Profit' | 'Aging' | 'Vendor Spend' | 'Cashflow' | 'By Make/Model' | 'Monthly Report'
type Range = '6M' | '1Y' | '2Y' | 'All'
const rangeCounts: Record<Range, number> = { '6M': 6, '1Y': 12, '2Y': 24, 'All': 9999 }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmt$(n: number) { return `$${Math.round(n).toLocaleString()}` }
function fmtK(n: number) { return Math.abs(n) >= 1000 ? `${n < 0 ? '-' : ''}$${(Math.abs(n)/1000).toFixed(0)}k` : fmt$(n) }
function fmtDate(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d + 'T12:00:00')
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReportsPage() {
  const [trucks,      setTrucks]      = useState<Truck[]>([])
  const [vendorRows,  setVendorRows]  = useState<VendorRow[]>([])
  const [partRows,    setPartRows]    = useState<PartRow[]>([])
  const [laborRows,   setLaborRows]   = useState<LaborRow[]>([])
  const [otherRows,   setOtherRows]   = useState<CostRow[]>([])
  const [commRows,    setCommRows]    = useState<CostRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState<Tab>('Profit')
  const [range,       setRange]       = useState<Range>('All')
  const [chartMode,   setChartMode]   = useState<'profit' | 'revenue' | 'both'>('profit')
  const [hovRow,      setHovRow]      = useState<number | null>(null)
  const [mmSort,      setMmSort]      = useState<'profit' | 'sold' | 'margin' | 'avg'>('profit')
  const [mmGroup,     setMmGroup]     = useState<'make' | 'make+model'>('make+model')
  const chartRef      = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)

  const now = new Date()
  const [mrMonth, setMrMonth] = useState(now.getMonth())
  const [mrYear,  setMrYear]  = useState(now.getFullYear())

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: t }, { data: v }, { data: p }, { data: l }, { data: o }, { data: c }] = await Promise.all([
      supabase.from('Inventory Data').select('id,status,date_sold,bought_on,purchase_price,recondition_cost,sold_price,make,model,year,kilometers,payment_status,customer,stock_number,found_by'),
      supabase.from('vendor_invoices').select('truck_id,vendor,amount'),
      supabase.from('parts').select('truck_id,qty,unit_cost'),
      supabase.from('labor').select('truck_id,hours,rate'),
      supabase.from('other_costs').select('truck_id,amount'),
      supabase.from('commissions').select('truck_id,amount'),
    ])
    setTrucks(t || []); setVendorRows(v || []); setPartRows(p || [])
    setLaborRows(l || []); setOtherRows(o || []); setCommRows(c || [])
    setLoading(false)
  }

  const extraCost = (id: string) =>
    partRows.filter(r=>r.truck_id===id).reduce((s,r)=>s+r.qty*r.unit_cost,0) +
    laborRows.filter(r=>r.truck_id===id).reduce((s,r)=>s+r.hours*r.rate,0) +
    vendorRows.filter(r=>r.truck_id===id).reduce((s,r)=>s+r.amount,0) +
    otherRows.filter(r=>r.truck_id===id).reduce((s,r)=>s+r.amount,0) +
    commRows.filter(r=>r.truck_id===id).reduce((s,r)=>s+r.amount,0)

  const allIn    = (t: Truck) => (t.purchase_price||0) + (t.recondition_cost||0) + extraCost(t.id)
  const trProfit = (t: Truck) => t.sold_price != null ? t.sold_price - allIn(t) : null

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

  const mmMap: Record<string, { key: string; sold: number; totalProfit: number; totalRevenue: number; totalCost: number }> = {}
  soldTrucks.forEach(t => {
    const key = mmGroup === 'make' ? (t.make || 'Unknown') : `${t.make || 'Unknown'} ${t.model || ''}`.trim()
    if (!mmMap[key]) mmMap[key] = { key, sold: 0, totalProfit: 0, totalRevenue: 0, totalCost: 0 }
    mmMap[key].sold++
    mmMap[key].totalProfit  += trProfit(t) ?? 0
    mmMap[key].totalRevenue += t.sold_price || 0
    mmMap[key].totalCost    += allIn(t)
  })
  const mmData = Object.values(mmMap)
    .map(r => ({ ...r, avgProfit: r.sold > 0 ? r.totalProfit / r.sold : 0, margin: r.totalRevenue > 0 ? (r.totalProfit / r.totalRevenue * 100) : 0 }))
    .sort((a, b) => mmSort==='profit'?b.totalProfit-a.totalProfit:mmSort==='sold'?b.sold-a.sold:mmSort==='margin'?b.margin-a.margin:b.avgProfit-a.avgProfit)
  const mmTotalProfit = mmData.reduce((s, r) => s + r.totalProfit, 0)
  const mmBestKey     = mmData[0]?.key || '—'
  const mmBestAvg     = mmData[0]?.avgProfit || 0

  const inStock = trucks.filter(t => t.status !== 'Sold' && t.status !== 'Intake' && t.bought_on)
  const daysIn  = (t: Truck) => t.bought_on ? Math.floor((Date.now()-new Date(t.bought_on).getTime())/86400000) : null
  const agingBuckets = [
    { label: '0–15 days',  color: 'var(--green)',  trucks: inStock.filter(t => { const d = daysIn(t)!; return d >= 0 && d <= 15 }) },
    { label: '16–30 days', color: 'var(--gold)',   trucks: inStock.filter(t => { const d = daysIn(t)!; return d > 15 && d <= 30 }) },
    { label: '31–60 days', color: 'var(--orange)', trucks: inStock.filter(t => { const d = daysIn(t)!; return d > 30 && d <= 60 }) },
    { label: '60+ days',   color: 'var(--red)',    trucks: inStock.filter(t => { const d = daysIn(t)!; return d > 60 }) },
  ]

  const vendorSpend: Record<string, number> = {}
  vendorRows.forEach(r => { vendorSpend[r.vendor] = (vendorSpend[r.vendor]||0) + r.amount })
  const topVendors = Object.entries(vendorSpend).sort((a,b)=>b[1]-a[1]).slice(0,10)
  const totalVendorSpend = topVendors.reduce((s,[,v])=>s+v,0)

  const cashByMonth: Record<string, { month: string; inflow: number; outflow: number }> = {}
  const ensureCash = (key: string, label: string) => { if (!cashByMonth[key]) cashByMonth[key] = { month: label, inflow: 0, outflow: 0 } }
  const monthKey = (dateStr: string) => {
    const d = new Date(dateStr); if (isNaN(d.getTime())) return null
    return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) }
  }
  soldTrucks.forEach(t => { const m = monthKey(t.date_sold!); if (!m) return; ensureCash(m.key, m.label); cashByMonth[m.key].inflow += t.sold_price || 0 })
  trucks.filter(t => t.bought_on).forEach(t => { const m = monthKey(t.bought_on!); if (!m) return; ensureCash(m.key, m.label); cashByMonth[m.key].outflow += (t.purchase_price || 0) + (t.recondition_cost || 0) })
  vendorRows.forEach(r => { const truck = trucks.find(t => t.id === r.truck_id); const dateStr = truck?.bought_on; if (!dateStr) return; const m = monthKey(dateStr); if (!m) return; ensureCash(m.key, m.label); cashByMonth[m.key].outflow += r.amount })
  partRows.forEach(r => { const truck = trucks.find(t => t.id === r.truck_id); const dateStr = truck?.bought_on; if (!dateStr) return; const m = monthKey(dateStr); if (!m) return; ensureCash(m.key, m.label); cashByMonth[m.key].outflow += r.qty * r.unit_cost })
  laborRows.forEach(r => { const truck = trucks.find(t => t.id === r.truck_id); const dateStr = truck?.bought_on; if (!dateStr) return; const m = monthKey(dateStr); if (!m) return; ensureCash(m.key, m.label); cashByMonth[m.key].outflow += r.hours * r.rate })
  otherRows.forEach(r => { const truck = trucks.find(t => t.id === r.truck_id); const dateStr = truck?.bought_on; if (!dateStr) return; const m = monthKey(dateStr); if (!m) return; ensureCash(m.key, m.label); cashByMonth[m.key].outflow += r.amount })
  const cashData = Object.keys(cashByMonth).sort().slice(-rangeCounts[range]).map(k => cashByMonth[k])

  // ── MONTHLY REPORT DATA ──
  const mrSold = trucks.filter(t => {
    if (!t.date_sold || t.status !== 'Sold') return false
    const d = new Date(t.date_sold)
    return !isNaN(d.getTime()) && d.getFullYear() === mrYear && d.getMonth() === mrMonth
  })
  const mrPurchased = trucks.filter(t => {
    if (!t.bought_on) return false
    const d = new Date(t.bought_on + 'T12:00:00')
    return !isNaN(d.getTime()) && d.getFullYear() === mrYear && d.getMonth() === mrMonth
  })
  const mrOnHand = trucks.filter(t => {
    if (t.bought_on) {
      const bought = new Date(t.bought_on + 'T12:00:00')
      if (isNaN(bought.getTime()) || bought > new Date(mrYear, mrMonth + 1, 0)) return false
    }
    if (t.status !== 'Sold') return true
    if (!t.date_sold) return true
    const sold = new Date(t.date_sold)
    return !isNaN(sold.getTime()) && (sold.getFullYear() > mrYear || (sold.getFullYear() === mrYear && sold.getMonth() > mrMonth))
  })

  const mrRevenue     = mrSold.reduce((s, t) => s + (t.sold_price || 0), 0)
  const mrPurchCost   = mrSold.reduce((s, t) => s + (t.purchase_price || 0), 0)
  const mrPartsTotal  = mrSold.reduce((s, t) => s + partRows.filter(r=>r.truck_id===t.id).reduce((ss,r)=>ss+r.qty*r.unit_cost,0), 0)
  const mrLaborTotal  = mrSold.reduce((s, t) => s + laborRows.filter(r=>r.truck_id===t.id).reduce((ss,r)=>ss+r.hours*r.rate,0), 0)
  const mrVendorTotal = mrSold.reduce((s, t) => s + vendorRows.filter(r=>r.truck_id===t.id).reduce((ss,r)=>ss+r.amount,0), 0)
  const mrOtherTotal  = mrSold.reduce((s, t) => s + otherRows.filter(r=>r.truck_id===t.id).reduce((ss,r)=>ss+r.amount,0), 0)
  const mrCommTotal   = mrSold.reduce((s, t) => s + commRows.filter(r=>r.truck_id===t.id).reduce((ss,r)=>ss+r.amount,0), 0)
  const MR_RENT       = 2800
  const MR_SALARY     = 1500
  const mrExpenses    = MR_RENT + MR_SALARY
  const mrNetProfit   = mrRevenue - mrPurchCost - mrPartsTotal - mrLaborTotal - mrVendorTotal - mrOtherTotal - mrCommTotal - mrExpenses

  const availableYears = Array.from(new Set(trucks.map(t => {
    const d = t.date_sold || t.bought_on; if (!d) return null
    const dt = new Date(d); return isNaN(dt.getTime()) ? null : dt.getFullYear()
  }).filter(Boolean) as number[])).sort((a,b)=>b-a)
  if (!availableYears.includes(now.getFullYear())) availableYears.unshift(now.getFullYear())

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
        type: 'bar', data: { labels: monthData.map(d => d.month), datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false }, animation: { duration: 300 },
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

  const TD: React.CSSProperties = { padding: '10px 14px', color: 'var(--text)', whiteSpace: 'nowrap', fontSize: 13 }

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .rep-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px}
        .rep-tabs{display:flex;gap:4px;margin-bottom:20px;overflow-x:auto}
        .rep-tabs::-webkit-scrollbar{display:none}
        @media(max-width:768px){.rep-stats{grid-template-columns:1fr 1fr!important}}
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden !important; }
          #mr-printable, #mr-printable * { visibility: visible !important; }
          #mr-controls { display: none !important; }
          #mr-printable { position: fixed; inset: 0; padding: 28px 32px; background: #ffffff !important; color: #111111 !important; font-family: system-ui, sans-serif; }
          .mr-kpi-grid { grid-template-columns: repeat(5,1fr) !important; }
          .mr-two-col  { grid-template-columns: 1fr 1fr !important; }
          .mr-card { border: 1px solid #cccccc !important; background: #ffffff !important; border-radius: 8px !important; }
          #mr-printable th { color: #444444 !important; background: #f3f4f6 !important; font-weight: 700 !important; }
          #mr-printable td { color: #111111 !important; }
          #mr-printable tfoot tr { background: #eeeeee !important; }
          #mr-printable tfoot td { color: #111111 !important; font-weight: 700 !important; }
          #mr-printable tbody tr:nth-child(even) { background: #fafafa !important; }
          #mr-printable * { box-shadow: none !important; }
          .mr-profit-row span:first-child { color: #555555 !important; }
          .mr-profit-row span:last-child  { color: #111111 !important; font-weight: 600 !important; }
          .mr-net-profit { color: #15803d !important; font-weight: 800 !important; }
          .mr-stock { color: #b45309 !important; font-weight: 700 !important; }
          .mr-green { color: #15803d !important; font-weight: 700 !important; }
          .mr-red   { color: #b91c1c !important; font-weight: 700 !important; }
          .mr-gold  { color: #b45309 !important; font-weight: 700 !important; }
          .mr-muted { color: #555555 !important; }
          .mr-days-green  { color: #15803d !important; font-weight: 700 !important; }
          .mr-days-gold   { color: #b45309 !important; font-weight: 700 !important; }
          .mr-days-orange { color: #c2410c !important; font-weight: 700 !important; }
          .mr-days-red    { color: #b91c1c !important; font-weight: 700 !important; }
          .mr-badge { background: #f3f4f6 !important; color: #374151 !important; border: 1px solid #9ca3af !important; }
          .mr-badge-new { background: #fef3c7 !important; color: #92400e !important; border: 1px solid #d97706 !important; }
          .mr-header-border { border-bottom: 2px solid #d97706 !important; }
          .mr-comm { color: #c2410c !important; font-weight: 700 !important; }
        }
      `}</style>

      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>ANALYTICS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Reports</h1>
          <div style={{ marginTop: 16, height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)' }} />
        </div>

        <div className="rep-tabs">
          {(['Profit','Aging','Vendor Spend','Cashflow','By Make/Model','Monthly Report'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab===tab?'var(--gold)':'var(--card-bg)', border: `1px solid ${activeTab===tab?'var(--gold)':'var(--card-border)'}`, color: activeTab===tab?'#000':'var(--text3)', borderRadius: 99, padding: '7px 18px', fontSize: 12, cursor: 'pointer', fontWeight: activeTab===tab?800:500, whiteSpace: 'nowrap', transition: 'all 0.15s', boxShadow: activeTab===tab?'0 2px 10px var(--gold-glow)':'none' }}>{tab}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (<>

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
              {monthData.length === 0
                ? <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, textAlign: 'center', padding: '60px 20px', color: 'var(--text4)' }}>No sold trucks yet.</div>
                : (<>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '20px', marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
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
                ? <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, textAlign: 'center', padding: '60px 20px', color: 'var(--text4)' }}>No vendor invoices yet.</div>
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
                ? <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, textAlign: 'center', padding: '60px 20px', color: 'var(--text4)' }}>No data yet.</div>
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

          {activeTab === 'By Make/Model' && (
            <>
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
                ? <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, textAlign: 'center', padding: '60px 20px', color: 'var(--text4)' }}>No sold trucks yet.</div>
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
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: row.totalProfit>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>{row.totalProfit>=0?'':'-'}{fmt$(Math.abs(row.totalProfit))}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: row.avgProfit>=0?'var(--gold)':'var(--red)', whiteSpace: 'nowrap' }}>{row.avgProfit>=0?'':'-'}{fmt$(Math.abs(row.avgProfit))}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmt$(row.totalRevenue / row.sold)}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: row.margin>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>{row.margin.toFixed(1)}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--hover)' }}>
                            <td colSpan={2} style={{ padding: '11px 14px', color: 'var(--text)', fontWeight: 800 }}>Total ({mmData.length} types)</td>
                            <td style={{ padding: '11px 14px', color: 'var(--gold)', textAlign: 'right', fontWeight: 700 }}>{mmData.reduce((s,r)=>s+r.sold,0)}</td>
                            <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: mmTotalProfit>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>{mmTotalProfit>=0?'':'-'}{fmt$(Math.abs(mmTotalProfit))}</td>
                            <td colSpan={3} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
            </>
          )}

          {/* ══ MONTHLY REPORT TAB ══ */}
          {activeTab === 'Monthly Report' && (
            <>
              <div id="mr-controls" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <select value={mrMonth} onChange={e => setMrMonth(Number(e.target.value))}
                  style={{ background: 'var(--input-bg,var(--card-bg))', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                  {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select value={mrYear} onChange={e => setMrYear(Number(e.target.value))}
                  style={{ background: 'var(--input-bg,var(--card-bg))', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div style={{ flex: 1 }} />
                <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>🖨 Print</button>
                <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold)', border: 'none', color: '#000', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 800 }}>↓ Save PDF</button>
              </div>

              <div id="mr-printable" style={{ fontFamily: 'system-ui, sans-serif' }}>

                <div className="mr-header-border" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid var(--gold)' }}>
                  <div>
                    <div style={{ fontSize: 18, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>AAMIR & SONS TRADING LTD.</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Monthly Report — {MONTHS[mrMonth]} {mrYear}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text4)' }}>
                    <div>Generated {new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>

                {/* KPI cards */}
                <div className="mr-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'TRUCKS SOLD',      val: String(mrSold.length),                                            color: 'var(--gold)' },
                    { label: 'TOTAL REVENUE',     val: fmt$(mrRevenue),                                                  color: 'var(--text)' },
                    { label: 'NET PROFIT',        val: `${mrNetProfit<0?'-':''}${fmt$(Math.abs(mrNetProfit))}`,          color: mrNetProfit>=0?'var(--green)':'var(--red)' },
                    { label: 'INVENTORY ON HAND', val: String(mrOnHand.length),                                          color: 'var(--text)' },
                    { label: 'FIXED EXPENSES',    val: fmt$(mrExpenses),                                                 color: 'var(--orange)' },
                  ].map(s => (
                    <div key={s.label} className="mr-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Two-column: profit breakdown + purchases */}
                <div className="mr-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>

                  {/* Profit breakdown — now includes commissions */}
                  <div className="mr-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>PROFIT BREAKDOWN</div>
                    {[
                      { label: 'Total revenue',     val: mrRevenue },
                      { label: '− Purchase costs',  val: mrPurchCost },
                      { label: '− Parts & labor',   val: mrPartsTotal + mrLaborTotal },
                      { label: '− Vendor invoices', val: mrVendorTotal },
                      { label: '− Other costs',     val: mrOtherTotal },
                      { label: '− Commissions',     val: mrCommTotal },
                      { label: '− Rent',             val: MR_RENT },
                      { label: '− Salary',           val: MR_SALARY },
                    ].map(r => (
                      <div key={r.label} className="mr-profit-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border2)' }}>
                        <span className="mr-muted" style={{ color: 'var(--text3)' }}>{r.label}</span>
                        <span style={{ color: (r.label === '− Commissions' && r.val > 0) || r.label === '− Rent' || r.label === '− Salary' ? 'var(--orange)' : 'var(--text)', fontWeight: 500 }}>{fmt$(r.val)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '10px 0 0', fontWeight: 800 }}>
                      <span style={{ color: 'var(--text)' }}>Net profit</span>
                      <span className="mr-net-profit" style={{ color: mrNetProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {mrNetProfit < 0 ? '-' : ''}{fmt$(Math.abs(mrNetProfit))}
                      </span>
                    </div>
                    {mrRevenue > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--text4)', textAlign: 'right', marginTop: 4 }}>
                        {(mrNetProfit / mrRevenue * 100).toFixed(1)}% margin
                      </div>
                    )}
                  </div>

                  {/* Purchases this month */}
                  <div className="mr-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>PURCHASES THIS MONTH ({mrPurchased.length})</div>
                    {mrPurchased.length === 0
                      ? <div style={{ fontSize: 12, color: 'var(--text4)', padding: '16px 0', textAlign: 'center' }}>No purchases this month.</div>
                      : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Stock #','Unit','Purchase'].map(h => (
                                <th key={h} style={{ padding: '4px 6px', textAlign: h==='Purchase'?'right':'left', color: 'var(--text4)', fontWeight: 600, fontSize: 9, letterSpacing: '0.08em' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[...mrPurchased].sort((a,b)=>(a.stock_number||'').localeCompare(b.stock_number||'')).map(t => (
                              <tr key={t.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                                <td className="mr-stock" style={{ padding: '5px 6px', fontFamily: 'monospace', fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>{t.stock_number || '—'}</td>
                                <td style={{ padding: '5px 6px', color: 'var(--text)', fontWeight: 500, fontSize: 11 }}>{t.year} {t.make} {t.model}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'right', color: 'var(--text)', fontWeight: 600 }}>{fmt$(t.purchase_price || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '1px solid var(--border)' }}>
                              <td colSpan={2} style={{ padding: '6px 6px', fontSize: 10, color: 'var(--text3)', fontWeight: 700 }}>Total spent</td>
                              <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 800, color: 'var(--text)', fontSize: 12 }}>{fmt$(mrPurchased.reduce((s,t)=>s+(t.purchase_price||0),0))}</td>
                            </tr>
                          </tfoot>
                        </table>
                      )}
                  </div>
                </div>

                {/* Monthly fixed expenses */}
                <div className="mr-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>MONTHLY FIXED EXPENSES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {[
                      { label: 'Rent',    val: MR_RENT,     note: 'Fixed monthly' },
                      { label: 'Salary',  val: MR_SALARY,   note: 'Fixed monthly' },
                      { label: 'Total',   val: mrExpenses,  note: 'This month', total: true },
                    ].map(e => (
                      <div key={e.label} style={{ background: 'var(--hover)', borderRadius: 10, padding: '12px 14px', borderLeft: e.total ? '3px solid var(--orange)' : '3px solid var(--border)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>{e.label.toUpperCase()}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: e.total ? 'var(--orange)' : 'var(--text)', marginBottom: 2 }}>{fmt$(e.val)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text4)' }}>{e.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trucks sold this month — with commissions column */}
                <div className="mr-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>TRUCKS SOLD THIS MONTH ({mrSold.length})</div>
                  {mrSold.length === 0
                    ? <div style={{ fontSize: 12, color: 'var(--text4)', padding: '16px 0', textAlign: 'center' }}>No trucks sold in {MONTHS[mrMonth]} {mrYear}.</div>
                    : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Stock #','Unit','Date Sold','Customer','Sold Price','Commissions','Net Profit'].map(h => (
                                <th key={h} style={{ padding: '7px 10px', textAlign: ['Sold Price','Commissions','Net Profit'].includes(h)?'right':'left', color: 'var(--text4)', fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[...mrSold].sort((a,b)=>(a.stock_number||'').localeCompare(b.stock_number||'')).map(t => {
                              const profit = trProfit(t)
                              const trComm = commRows.filter(r=>r.truck_id===t.id).reduce((s,r)=>s+r.amount,0)
                              return (
                                <tr key={t.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                                  <td className="mr-stock" style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>{t.stock_number || '—'}</td>
                                  <td style={{ padding: '8px 10px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.year} {t.make} {t.model}</td>
                                  <td className="mr-muted" style={{ padding: '8px 10px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{fmtDate(t.date_sold)}</td>
                                  <td style={{ padding: '8px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{t.customer || '—'}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt$(t.sold_price || 0)}</td>
                                  <td className={trComm > 0 ? 'mr-comm' : ''} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', color: trComm > 0 ? 'var(--orange)' : 'var(--text4)' }}>
                                    {trComm > 0 ? `-${fmt$(trComm)}` : '—'}
                                  </td>
                                  <td className={profit == null ? '' : profit >= 0 ? 'mr-green' : 'mr-red'} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', color: profit == null ? 'var(--text4)' : profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                    {profit == null ? '—' : `${profit < 0 ? '-' : ''}${fmt$(Math.abs(profit))}`}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--hover)' }}>
                              <td colSpan={4} style={{ padding: '9px 10px', fontWeight: 800, color: 'var(--text)' }}>Total ({mrSold.length} trucks)</td>
                              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmt$(mrRevenue)}</td>
                              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: mrCommTotal > 0 ? 'var(--orange)' : 'var(--text4)', whiteSpace: 'nowrap' }}>
                                {mrCommTotal > 0 ? `-${fmt$(mrCommTotal)}` : '—'}
                              </td>
                              <td className={mrNetProfit>=0?'mr-green':'mr-red'} style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: mrNetProfit>=0?'var(--green)':'var(--red)', whiteSpace: 'nowrap' }}>
                                {mrNetProfit < 0 ? '-' : ''}{fmt$(Math.abs(mrNetProfit))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                </div>

                {/* Inventory on hand */}
                <div className="mr-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>INVENTORY ON HAND — END OF {MONTHS[mrMonth].toUpperCase()} ({mrOnHand.length} units)</div>
                  {mrOnHand.length === 0
                    ? <div style={{ fontSize: 12, color: 'var(--text4)', padding: '16px 0', textAlign: 'center' }}>No inventory on hand for this period.</div>
                    : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Stock #','Unit','Year','Status','Days on Lot','All-In Cost'].map(h => (
                                <th key={h} style={{ padding: '7px 10px', textAlign: h==='All-In Cost'?'right':'left', color: 'var(--text4)', fontWeight: 600, fontSize: 10, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[...mrOnHand].sort((a,b)=>(a.stock_number||'').localeCompare(b.stock_number||'')).map(t => {
                              const days = t.bought_on ? Math.floor((new Date(mrYear, mrMonth+1, 0).getTime() - new Date(t.bought_on + 'T12:00:00').getTime()) / 86400000) : null
                              const dayColor = days == null ? 'var(--text4)' : days > 60 ? 'var(--red)' : days > 30 ? 'var(--orange)' : days > 15 ? 'var(--gold)' : 'var(--green)'
                              const dayClass = days == null ? '' : days > 60 ? 'mr-days-red' : days > 30 ? 'mr-days-orange' : days > 15 ? 'mr-days-gold' : 'mr-days-green'
                              const isNew = t.bought_on && (() => { const d = new Date(t.bought_on + 'T12:00:00'); return d.getFullYear() === mrYear && d.getMonth() === mrMonth })()
                              return (
                                <tr key={t.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                                  <td className="mr-stock" style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>{t.stock_number || '—'}</td>
                                  <td style={{ padding: '8px 10px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.make} {t.model}</td>
                                  <td style={{ padding: '8px 10px', color: 'var(--text2)' }}>{t.year || '—'}</td>
                                  <td style={{ padding: '8px 10px' }}>
                                    <span className={isNew ? 'mr-badge-new' : 'mr-badge'} style={{ background: isNew ? 'rgba(234,179,8,0.12)' : 'var(--hover)', color: isNew ? 'var(--gold)' : 'var(--text3)', border: isNew ? '1px solid var(--gold)' : '1px solid var(--border)', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      {isNew ? 'New in' : t.status}
                                    </span>
                                  </td>
                                  <td className={dayClass} style={{ padding: '8px 10px', fontWeight: 700, color: dayColor }}>{days != null ? `${days}d` : '—'}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt$(allIn(t))}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--hover)' }}>
                              <td colSpan={5} style={{ padding: '9px 10px', fontWeight: 800, color: 'var(--text)' }}>Total capital tied up</td>
                              <td className="mr-gold" style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, fontSize: 13, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{fmt$(mrOnHand.reduce((s,t)=>s+allIn(t),0))}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                </div>

              </div>{/* end mr-printable */}
            </>
          )}

        </>)}
      </main>
    </>
  )
}