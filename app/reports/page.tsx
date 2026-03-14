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
    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)
      if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null }
      const ctx = chartRef.current?.getContext('2d')
      if (!ctx) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const datasets: any[] = []
      if (chartMode === 'profit' || chartMode === 'both') datasets.push({ label: 'Profit', data: data.map(d => Math.round(d.profit)), backgroundColor: data.map(d => d.profit >= 0 ? '#EAB308' : '#ef4444'), borderRadius: 3, order: 1 })
      if (chartMode === 'revenue' || chartMode === 'both') datasets.push({ label: 'Revenue', data: data.map(d => Math.round(d.revenue)), backgroundColor: 'rgba(59,130,246,0.55)', borderRadius: 3, order: 2 })
      if (chartMode === 'both') datasets.push({ label: 'Cost', data: data.map(d => Math.round(d.cost)), backgroundColor: 'rgba(107,114,128,0.45)', borderRadius: 3, order: 3 })
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: { labels: data.map(d => d.month), datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 400 },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#161616', borderColor: '#2a2a2a', borderWidth: 1,
              titleColor: '#fff', bodyColor: '#EAB308', padding: 12, displayColors: false,
              callbacks: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                title: (items: any[]) => items[0]?.label || '',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label: (item: any) => { const v = item.raw as number; return `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString()}` },
              },
            },
          },
          scales: {
            x: { ticks: { color: '#555', font: { size: 9 }, maxRotation: 45, autoSkip: data.length > 18 }, grid: { color: '#181818' }, border: { color: '#222' } },
            y: {
              ticks: { color: '#555', font: { size: 9 }, callback: (v: number | string) => { const n = typeof v === 'string' ? parseFloat(v) : v; const abs = Math.abs(n); const s = abs >= 1000 ? `$${(abs / 1000).toFixed(0)}k` : `$${abs}`; return n < 0 ? `-${s}` : s } },
              grid: { color: '#1e1e1e' }, border: { color: '#222' },
            },
          },
        },
      })
    }
    loadChart()
    return () => { chartInstance.current?.destroy(); chartInstance.current = null }
  }, [data, chartMode, activeTab])

  return (
    <>
      <style>{`
        .reports-stats { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; margin-bottom: 16px; }
        @media (max-width: 768px) {
          .reports-stats { grid-template-columns: repeat(2,1fr) !important; }
          .reports-stats .last-stat { grid-column: span 2; }
        }
        .report-tabs { display: flex; gap: 4px; margin-bottom: 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .report-tabs::-webkit-scrollbar { display: none; }
        .chart-controls { display: flex; gap: 8px; flex-wrap: wrap; }
      `}</style>
      <main style={{ padding: '16px', overflowY: 'auto', background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Reports</h1>

        <div className="report-tabs">
          {(['Profit', 'Aging', 'Vendor Spend', 'Cashflow'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? '#1e1e1e' : 'transparent', border: `1px solid ${activeTab === tab ? '#EAB308' : '#222'}`, color: activeTab === tab ? '#EAB308' : '#555', borderRadius: 6, padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontWeight: activeTab === tab ? 500 : 400, whiteSpace: 'nowrap' }}>{tab}</button>
          ))}
        </div>

        {activeTab === 'Profit' && (
          <>
            <div className="reports-stats">
              {[
                { label: 'TOTAL REVENUE', value: `$${(totalRevenue / 1000).toFixed(0)}k`, color: '#fff' },
                { label: 'TOTAL COST', value: `$${(totalCost / 1000).toFixed(0)}k`, color: '#fff' },
                { label: 'NET PROFIT', value: `${totalProfit >= 0 ? '' : '-'}$${(Math.abs(totalProfit) / 1000).toFixed(0)}k`, color: totalProfit >= 0 ? '#22c55e' : '#ef4444' },
                { label: 'TRUCKS SOLD', value: String(totalSold), color: '#EAB308' },
                { label: 'BEST MONTH', value: bestMonth?.month || '—', color: '#EAB308', last: true },
              ].map((s: any) => (
                <div key={s.label} className={s.last ? 'last-stat' : ''} style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '12px 14px', borderBottom: '2px solid #EAB308' }}>
                  <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.08em', marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>Monthly Profit Report</div>
                <div className="chart-controls">
                  <div style={{ display: 'flex', background: '#0f0f0f', border: '1px solid #222', borderRadius: 6, overflow: 'hidden' }}>
                    {([['profit', 'P'], ['revenue', 'R'], ['both', 'All']] as [ChartMode, string][]).map(([mode, label]) => (
                      <button key={mode} onClick={() => setChartMode(mode)} style={{ padding: '5px 10px', fontSize: 11, cursor: 'pointer', border: 'none', background: chartMode === mode ? '#EAB308' : 'transparent', color: chartMode === mode ? '#000' : '#666', fontWeight: chartMode === mode ? 600 : 400 }}>{label}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', background: '#0f0f0f', border: '1px solid #222', borderRadius: 6, overflow: 'hidden' }}>
                    {(['6M', '1Y', '2Y', 'All'] as Range[]).map(r => (
                      <button key={r} onClick={() => setRange(r)} style={{ padding: '5px 8px', fontSize: 11, cursor: 'pointer', border: 'none', background: range === r ? '#EAB308' : 'transparent', color: range === r ? '#000' : '#666', fontWeight: range === r ? 600 : 400 }}>{r}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative', width: '100%', height: 220 }}>
                <canvas ref={chartRef} />
              </div>
            </div>

            {/* Mobile-friendly table with horizontal scroll */}
            <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222' }}>
                      {['Month', 'Sold', 'Revenue', 'Cost', 'Profit', 'Margin'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Month' ? 'left' : 'right', color: '#555', fontWeight: 400, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => {
                      const margin = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : '0.0'
                      return (
                        <tr key={i} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                          style={{ borderBottom: '1px solid #1a1a1a', background: hoveredRow === i ? '#1c1c1c' : 'transparent' }}>
                          <td style={{ padding: '9px 12px', color: '#ccc', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.month}</td>
                          <td style={{ padding: '9px 12px', color: '#888', textAlign: 'right' }}>{row.sold}</td>
                          <td style={{ padding: '9px 12px', color: '#ccc', textAlign: 'right', whiteSpace: 'nowrap' }}>${row.revenue.toLocaleString()}</td>
                          <td style={{ padding: '9px 12px', color: '#888', textAlign: 'right', whiteSpace: 'nowrap' }}>${Math.round(row.cost).toLocaleString()}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, color: row.profit >= 0 ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>{row.profit >= 0 ? '' : '-'}${Math.abs(Math.round(row.profit)).toLocaleString()}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 12, color: parseFloat(margin) >= 0 ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>{margin}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #2a2a2a', background: '#111' }}>
                      <td style={{ padding: '11px 12px', color: '#fff', fontWeight: 600 }}>Total</td>
                      <td style={{ padding: '11px 12px', color: '#EAB308', textAlign: 'right', fontWeight: 600 }}>{totalSold}</td>
                      <td style={{ padding: '11px 12px', color: '#fff', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>${Math.round(totalRevenue).toLocaleString()}</td>
                      <td style={{ padding: '11px 12px', color: '#888', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>${Math.round(totalCost).toLocaleString()}</td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: totalProfit >= 0 ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>{totalProfit >= 0 ? '' : '-'}${Math.abs(Math.round(totalProfit)).toLocaleString()}</td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 600, color: totalProfit >= 0 ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab !== 'Profit' && (
          <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, color: '#2a2a2a', marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 14, color: '#555' }}>{activeTab} report coming soon.</div>
          </div>
        )}
      </main>
    </>
  )
}