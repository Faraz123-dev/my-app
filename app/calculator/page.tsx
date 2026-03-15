'use client'

import { useState } from 'react'

export default function CalculatorPage() {
  const [purchase, setPurchase] = useState('')
  const [recon, setRecon] = useState('')
  const [fees, setFees] = useState('0')
  const [sellPrice, setSellPrice] = useState('')
  const [targetProfit, setTargetProfit] = useState('')
  const [targetMode, setTargetMode] = useState<'$' | '%'>('$')

  const allIn = (parseFloat(purchase) || 0) + (parseFloat(recon) || 0) + (parseFloat(fees) || 0)
  const targetVal = parseFloat(targetProfit) || 0
  const minSell = targetMode === '$' ? allIn + targetVal : allIn * (1 + targetVal / 100)
  const projectedProfit = sellPrice ? (parseFloat(sellPrice) || 0) - allIn : null

  const status = projectedProfit === null ? 'UNKNOWN' : projectedProfit > 0 ? 'PROFITABLE' : projectedProfit === 0 ? 'BREAK EVEN' : 'LOSS'
  const statusColor = projectedProfit === null ? 'var(--text3)' : projectedProfit > 0 ? 'var(--green)' : projectedProfit === 0 ? 'var(--gold)' : 'var(--red)'

  const reset = () => { setPurchase(''); setRecon(''); setFees('0'); setSellPrice(''); setTargetProfit('') }
  const copyResults = () => navigator.clipboard.writeText(`All-In: $${Math.round(allIn).toLocaleString()}\nMin Sell: $${Math.round(minSell).toLocaleString()}\nProjected Profit: ${projectedProfit !== null ? (projectedProfit >= 0 ? '' : '-') + '$' + Math.abs(Math.round(projectedProfit)).toLocaleString() : 'N/A'}\nStatus: ${status}`)

  const IS = { width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 10, padding: '13px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'monospace', transition: 'border-color 0.15s' }
  const LS = { fontSize: 13, color: 'var(--text2)', marginBottom: 8, display: 'block' as const, fontWeight: 500 }

  return (
    <>
      <style>{`
        .calc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .calc-results { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
        .calc-input:focus { border-color: var(--gold) !important; }
        @media(max-width:480px) { .calc-grid { grid-template-columns: 1fr !important; } .calc-results { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>TOOLS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Profit Simulator</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>Decide whether a truck is worth buying before you commit.</p>
          <div style={{ marginTop: 16, height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
        </div>

        <div className="gcard" style={{ maxWidth: 860 }}>
          <div className="calc-grid">
            <div><label style={LS}>Purchase Price (CAD) *</label><input className="calc-input" style={IS} placeholder="35,000" type="number" value={purchase} onChange={e => setPurchase(e.target.value)} /></div>
            <div><label style={LS}>Est. Recondition Cost (CAD) *</label><input className="calc-input" style={IS} placeholder="5,000" type="number" value={recon} onChange={e => setRecon(e.target.value)} /></div>
          </div>
          <div className="calc-grid">
            <div><label style={LS}>Other Fees (CAD)</label><input className="calc-input" style={IS} placeholder="0" type="number" value={fees} onChange={e => setFees(e.target.value)} /></div>
            <div><label style={LS}>Expected Sell Price (CAD)</label><input className="calc-input" style={{ ...IS, borderColor: sellPrice ? 'var(--gold)' : 'var(--input-border)' }} placeholder="Optional" type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} /></div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: 'var(--hover)' }}>
            <label style={{ ...LS, marginBottom: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>Target Profit</label>
            <input className="calc-input" style={{ ...IS, flex: 1, minWidth: 120 }} placeholder="e.g. 8,000" type="number" value={targetProfit} onChange={e => setTargetProfit(e.target.value)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>$</span>
              <div onClick={() => setTargetMode(m => m === '$' ? '%' : '$')}
                style={{ width: 44, height: 24, borderRadius: 12, background: targetMode === '%' ? 'var(--gold)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: targetMode === '%' ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: targetMode === '%' ? '#000' : 'var(--text2)', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>%</span>
            </div>
          </div>

          <div className="calc-results">
            {[
              { label: 'ALL-IN COST',       value: `$${Math.round(allIn).toLocaleString()}`,                                                                                                      color: 'var(--text)',  accent: 'var(--gold)' },
              { label: 'BREAK-EVEN PRICE',  value: `$${Math.round(allIn).toLocaleString()}`,                                                                                                      color: 'var(--text)',  accent: 'var(--border)' },
              { label: 'MIN SELL REQUIRED', value: targetProfit ? `$${Math.round(minSell).toLocaleString()}` : '—',                                                                               color: 'var(--gold)',  accent: 'var(--gold)' },
              { label: 'PROJECTED PROFIT',  value: projectedProfit !== null ? `${projectedProfit >= 0 ? '' : '-'}$${Math.abs(Math.round(projectedProfit)).toLocaleString()}` : '—',               color: statusColor,    accent: statusColor },
              { label: 'MARGIN %',          value: sellPrice && parseFloat(sellPrice) > 0 ? `${(((parseFloat(sellPrice)||0) - allIn) / (parseFloat(sellPrice)) * 100).toFixed(1)}%` : '—',      color: statusColor,    accent: statusColor },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '16px 18px', borderBottom: `2px solid ${stat.accent}` }}>
                <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', marginBottom: 10, fontWeight: 700 }}>{stat.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, letterSpacing: '-0.03em' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--card-bg)', border: `1px solid ${statusColor}`, borderRadius: 99, padding: '10px 24px', boxShadow: `0 4px 20px ${statusColor}33` }}>
              <span style={{ fontSize: 16, color: statusColor }}>{status === 'UNKNOWN' ? '⊙' : status === 'PROFITABLE' ? '↑' : status === 'LOSS' ? '↓' : '='}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: statusColor, letterSpacing: '0.04em' }}>{status}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={reset} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 10, padding: '11px', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}>↺ Reset</button>
            <button onClick={copyResults} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 10, padding: '11px', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}>⧉ Copy Results</button>
          </div>
        </div>
      </main>
    </>
  )
}