'use client'

import { useState, useEffect, useRef } from 'react'

const allData = [
  { month: 'Dec 22', sold: 1, revenue: 24000, cost: 15247.15, profit: 8752.85 },
  { month: 'Jan 23', sold: 1, revenue: 68000, cost: 62870, profit: 5130 },
  { month: 'Feb 23', sold: 2, revenue: 155000, cost: 141459.29, profit: 13540.71 },
  { month: 'Mar 23', sold: 1, revenue: 105000, cost: 81360, profit: 23640 },
  { month: 'Apr 23', sold: 3, revenue: 125000, cost: 105880, profit: 19420 },
  { month: 'Jun 23', sold: 1, revenue: 184000, cost: 72000, profit: 62000 },
  { month: 'Jul 23', sold: 1, revenue: 36000, cost: 35000, profit: 1000 },
  { month: 'Aug 23', sold: 2, revenue: 75000, cost: 53890, profit: 21110 },
  { month: 'Sep 23', sold: 1, revenue: 30000, cost: 23002.82, profit: 6997.18 },
  { month: 'Nov 23', sold: 3, revenue: 160000, cost: 142650, profit: 17350 },
  { month: 'Dec 23', sold: 3, revenue: 86900, cost: 49847.99, profit: 37052.01 },
  { month: 'Jan 24', sold: 4, revenue: 340600, cost: 301978, profit: 38622 },
  { month: 'Feb 24', sold: 3, revenue: 140000, cost: 120348.02, profit: 19651.98 },
  { month: 'Mar 24', sold: 3, revenue: 102000, cost: 72346.03, profit: 29653.97 },
  { month: 'Apr 24', sold: 2, revenue: 152000, cost: 113968, profit: 38032 },
  { month: 'May 24', sold: 3, revenue: 194415, cost: 166675.9, profit: 27739.1 },
  { month: 'Jun 24', sold: 2, revenue: 116500, cost: 89368.44, profit: 27131.56 },
  { month: 'Jul 24', sold: 4, revenue: 187000, cost: 144362, profit: 42638 },
  { month: 'Aug 24', sold: 7, revenue: 297305.33, cost: 277078.9, profit: 20226.43 },
  { month: 'Sep 24', sold: 4, revenue: 91000, cost: 136322.99, profit: -45322.99 },
  { month: 'Oct 24', sold: 2, revenue: 87000, cost: 47606, profit: 39394 },
  { month: 'Nov 24', sold: 3, revenue: 109000, cost: 106033.36, profit: 2966.64 },
  { month: 'Dec 24', sold: 1, revenue: 1000, cost: 3175, profit: -2175 },
  { month: 'Jan 25', sold: 2, revenue: 150000, cost: 143879, profit: 6121 },
  { month: 'Feb 25', sold: 5, revenue: 164000, cost: 154945.45, profit: 9054.55 },
  { month: 'Mar 25', sold: 3, revenue: 146783, cost: 134368, profit: 12415 },
  { month: 'Apr 25', sold: 2, revenue: 109500, cost: 48625, profit: 60875 },
  { month: 'May 25', sold: 3, revenue: 221300, cost: 199969, profit: 21331 },
  { month: 'Jun 25', sold: 2, revenue: 77000, cost: 64637, profit: 12363 },
  { month: 'Jul 25', sold: 4, revenue: 109000, cost: 143524.96, profit: -34524.96 },
  { month: 'Aug 25', sold: 3, revenue: 78000, cost: 77670, profit: 330 },
  { month: 'Feb 26', sold: 3, revenue: 91000, cost: 77675, profit: 13325 },
]

type Tab = 'Profit' | 'Aging' | 'Vendor Spend' | 'Cashflow'
type Range = '6M' | '1Y' | '2Y' | 'All'
type ChartMode = 'profit' | 'revenue' | 'both'
const rangeCounts: Record<Range, number> = { '6M': 6, '1Y': 12, '2Y': 24, 'All': 999 }

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Profit')
  const [range, setRange] = useState<Range>('All')
  const [chartMode, setChartMode] = useState<ChartMode>('profit')
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const chartRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartInstance = useRef<any>(null)

  const data = allData.slice(-rangeCounts[range])
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalCost = data.reduce((s, d) => s + d.cost, 0)
  const totalProfit = data.reduce((s, d) => s + d.profit, 0)
  const totalSold = data.reduce((s, d) => s + d.sold, 0)
  const bestMonth = [...data].sort((a, b) => b.profit - a.profit)[0]

  useEffect(() => {
    if (!chartRef.current || activeTab !== 'Profit') return
    const load = async () => {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)
      if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null }
      const ctx = chartRef.current?.getContext('2d')
      if (!ctx) return
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const datasets: any[] = []
      if (chartMode === 'profit' || chartMode === 'both') datasets.push({ label: 'Profit', data: data.map(d => Math.round(d.profit)), backgroundColor: data.map(d => d.profit >= 0 ? (isDark ? '#EAB308' : '#b45309') : (isDark ? '#ef4444' : '#dc2626')), borderRadius: 4, order: 1 })
      if (chartMode === 'revenue' || chartMode === 'both') datasets.push({ label: 'Revenue', data: data.map(d => Math.round(d.revenue)), backgroundColor: isDark ? 'rgba(59,130,246,0.5)' : 'rgba(2,132,199,0.5)', borderRadius: 4, order: 2 })
      if (chartMode === 'both') datasets.push({ label: 'Cost', data: data.map(d => Math.round(d.cost)), backgroundColor: isDark ? 'rgba(107,114,128,0.4)' : 'rgba(107,114,128,0.3)', borderRadius: 4, order: 3 })
      const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'
      const labelColor = isDark ? '#444' : '#aaa'
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: { labels: data.map(d => d.month), datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 300 },
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: isDark ? '#141414' : '#fff', borderColor: isDark ? 'rgba(234,179,8,0.2)' : 'rgba(0,0,0,0.1)', borderWidth: 1, titleColor: isDark ? '#fff' : '#111', bodyColor: isDark ? '#EAB308' : '#b45309', padding: 12, displayColors: false,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              callbacks: { title: (i: any[]) => i[0]?.label || '', label: (i: any) => { const v = i.raw as number; return `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString()}` } } },
          },
          scales: {
            x: { ticks: { color: labelColor, font: { size: 9 }, maxRotation: 45, autoSkip: data.length > 18 }, grid: { color: gridColor }, border: { color: gridColor } },
            y: { ticks: { color: labelColor, font: { size: 9 }, callback: (v: number | string) => { const n = typeof v === 'string' ? parseFloat(v) : v; const abs = Math.abs(n); const s = abs >= 1000 ? `$${(abs / 1000).toFixed(0)}k` : `$${abs}`; return n < 0 ? `-${s}` : s } }, grid: { color: gridColor }, border: { color: gridColor } },
          },
        },
      })
    }
    load()
    return () => { chartInstance.current?.destroy(); chartInstance.current = null }
  }, [data, chartMode, activeTab])

  return (
    <>
      <style>{`
        .reports-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:20px; }
        .report-tabs { display:flex; gap:4px; margin-bottom:20px; overflow-x:auto; }
        .report-tabs::-webkit-scrollbar{display:none}
        @media(max-width:768px){
          .reports-stats{grid-template-columns:1fr 1fr!important}
          .reports-stats .last-stat{grid-column:span 2}
        }
      `}</style>
      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>ANALYTICS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Reports</h1>
          <div style={{ marginTop: 16, height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)' }} />
        </div>

        <div className="report-tabs">
          {(['Profit', 'Aging', 'Vendor Spend', 'Cashflow'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? 'var(--gold)' : 'var(--card-bg)', border: `1px solid ${activeTab === tab ? 'var(--gold)' : 'var(--card-border)'}`, color: activeTab === tab ? '#000' : 'var(--text3)', borderRadius: 99, padding: '7px 18px', fontSize: 12, cursor: 'pointer', fontWeight: activeTab === tab ? 800 : 500, whiteSpace: 'nowrap', transition: 'all 0.15s', boxShadow: activeTab === tab ? '0 2px 10px var(--gold-glow)' : 'none' }}>{tab}</button>
          ))}
        </div>

        {activeTab === 'Profit' && (
          <>
            <div className="reports-stats">
              {[
                { label: 'TOTAL REVENUE', value: `$${(totalRevenue / 1000).toFixed(0)}k`, color: 'var(--text)' },
                { label: 'TOTAL COST', value: `$${(totalCost / 1000).toFixed(0)}k`, color: 'var(--text)' },
                { label: 'NET PROFIT', value: `${totalProfit >= 0 ? '' : '-'}$${(Math.abs(totalProfit) / 1000).toFixed(0)}k`, color: totalProfit >= 0 ? 'var(--green)' : 'var(--red)' },
                { label: 'TRUCKS SOLD', value: String(totalSold), color: 'var(--gold)' },
                { label: 'BEST MONTH', value: bestMonth?.month || '—', color: 'var(--gold)', last: true },
              ].map((s: any) => (
                <div key={s.label} className={s.last ? 'last-stat' : ''} className2="gcard" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '14px 16px', borderBottom: '2px solid var(--gold)', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="gcard" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>Monthly Profit Report</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    {([['profit', 'P'], ['revenue', 'R'], ['both', 'All']] as [ChartMode, string][]).map(([mode, label]) => (
                      <button key={mode} onClick={() => setChartMode(mode)} style={{ padding: '5px 10px', fontSize: 11, cursor: 'pointer', border: 'none', background: chartMode === mode ? 'var(--gold)' : 'transparent', color: chartMode === mode ? '#000' : 'var(--text3)', fontWeight: chartMode === mode ? 700 : 400, transition: 'all 0.15s' }}>{label}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    {(['6M', '1Y', '2Y', 'All'] as Range[]).map(r => (
                      <button key={r} onClick={() => setRange(r)} style={{ padding: '5px 8px', fontSize: 11, cursor: 'pointer', border: 'none', background: range === r ? 'var(--gold)' : 'transparent', color: range === r ? '#000' : 'var(--text3)', fontWeight: range === r ? 700 : 400, transition: 'all 0.15s' }}>{r}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative', width: '100%', height: 240 }}>
                <canvas ref={chartRef} />
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Month', 'Sold', 'Revenue', 'Cost', 'Profit', 'Margin'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: h === 'Month' ? 'left' : 'right', color: 'var(--text4)', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => {
                      const margin = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : '0.0'
                      return (
                        <tr key={i} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                          style={{ borderBottom: '1px solid var(--border2)', background: hoveredRow === i ? 'var(--hover)' : 'transparent', transition: 'background 0.15s' }}>
                          <td style={{ padding: '10px 14px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.month}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text2)', textAlign: 'right' }}>{row.sold}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text)', textAlign: 'right', whiteSpace: 'nowrap' }}>${row.revenue.toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text2)', textAlign: 'right', whiteSpace: 'nowrap' }}>${Math.round(row.cost).toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: row.profit >= 0 ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>{row.profit >= 0 ? '' : '-'}${Math.abs(Math.round(row.profit)).toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, color: parseFloat(margin) >= 0 ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap', fontWeight: 600 }}>{margin}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--hover)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text)', fontWeight: 800 }}>Total</td>
                      <td style={{ padding: '12px 14px', color: 'var(--gold)', textAlign: 'right', fontWeight: 700 }}>{totalSold}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text)', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>${Math.round(totalRevenue).toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>${Math.round(totalCost).toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: totalProfit >= 0 ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>{totalProfit >= 0 ? '' : '-'}${Math.abs(Math.round(totalProfit)).toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: totalProfit >= 0 ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab !== 'Profit' && (
          <div className="gcard" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 15, color: 'var(--text2)', fontWeight: 600 }}>{activeTab} report coming soon.</div>
          </div>
        )}
      </main>
    </>
  )
}