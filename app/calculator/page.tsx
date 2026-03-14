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
  const statusColor = projectedProfit === null ? '#666' : projectedProfit > 0 ? '#22c55e' : projectedProfit === 0 ? '#EAB308' : '#ef4444'

  const reset = () => { setPurchase(''); setRecon(''); setFees('0'); setSellPrice(''); setTargetProfit('') }

  const copyResults = () => {
    navigator.clipboard.writeText(`Pre-Purchase Profit Simulator
Purchase: $${parseFloat(purchase || '0').toLocaleString()}
Recon: $${parseFloat(recon || '0').toLocaleString()}
Fees: $${parseFloat(fees || '0').toLocaleString()}
All-In: $${Math.round(allIn).toLocaleString()}
Min Sell: $${Math.round(minSell).toLocaleString()}
Projected Profit: ${projectedProfit !== null ? (projectedProfit >= 0 ? '' : '-') + '$' + Math.abs(Math.round(projectedProfit)).toLocaleString() : 'N/A'}
Status: ${status}`)
  }

  const inputStyle = {
    width: '100%', background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 10,
    padding: '13px 16px', color: '#e5e5e5', fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'monospace',
  }
  const labelStyle = { fontSize: 13, color: '#ccc', marginBottom: 8, display: 'block' as const }

  return (
    <>
      <style>{`
        .calc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .calc-results { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        @media (max-width: 480px) {
          .calc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <main style={{ padding: '16px', overflowY: 'auto', background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>📈</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Profit Simulator</h1>
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Decide whether a truck is worth buying before you commit.</p>
        </div>

        <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 12, padding: '20px' }}>
          <div className="calc-grid">
            <div><label style={labelStyle}>Purchase Price ($) *</label><input style={inputStyle} placeholder="35,000" type="number" value={purchase} onChange={e => setPurchase(e.target.value)} /></div>
            <div><label style={labelStyle}>Est. Recondition ($) *</label><input style={inputStyle} placeholder="5,000" type="number" value={recon} onChange={e => setRecon(e.target.value)} /></div>
          </div>

          <div className="calc-grid">
            <div><label style={labelStyle}>Other Fees ($)</label><input style={inputStyle} placeholder="0" type="number" value={fees} onChange={e => setFees(e.target.value)} /></div>
            <div><label style={labelStyle}>Expected Sell Price ($)</label><input style={{ ...inputStyle, background: sellPrice ? '#0f0f0f' : '#0a0a0a' }} placeholder="Optional" type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} /></div>
          </div>

          {/* Target profit row */}
          <div style={{ border: '1px solid #222', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>Target Profit</label>
            <input style={{ ...inputStyle, flex: 1, minWidth: 120 }} placeholder="e.g. 8,000" type="number" value={targetProfit} onChange={e => setTargetProfit(e.target.value)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 13, color: '#666' }}>$</span>
              <div onClick={() => setTargetMode(m => m === '$' ? '%' : '$')}
                style={{ width: 44, height: 24, borderRadius: 12, background: targetMode === '%' ? '#EAB308' : '#2a2a2a', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: targetMode === '%' ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: 13, color: '#666' }}>%</span>
            </div>
          </div>

          {/* Result cards */}
          <div className="calc-results">
            {[
              { label: 'ALL-IN COST', value: `$${Math.round(allIn).toLocaleString()}`, color: '#fff', accent: '#EAB308' },
              { label: 'BREAK-EVEN', value: `$${Math.round(allIn).toLocaleString()}`, color: '#fff', accent: '#EAB308' },
              { label: 'MIN SELL REQUIRED', value: `$${Math.round(minSell).toLocaleString()}`, color: '#EAB308', accent: '#EAB308' },
              {
                label: 'PROJECTED PROFIT',
                value: projectedProfit !== null ? `${projectedProfit >= 0 ? '' : '-'}$${Math.abs(Math.round(projectedProfit)).toLocaleString()}` : '—',
                color: projectedProfit === null ? '#555' : projectedProfit >= 0 ? '#22c55e' : '#ef4444',
                accent: projectedProfit === null ? '#333' : projectedProfit >= 0 ? '#22c55e' : '#ef4444',
              },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 10, padding: '14px 16px', borderBottom: `2px solid ${stat.accent}` }}>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Status badge */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111', border: '1px solid #2a2a2a', borderRadius: 20, padding: '8px 20px' }}>
              <span style={{ fontSize: 14, color: statusColor }}>{status === 'UNKNOWN' ? '⊙' : status === 'PROFITABLE' ? '↑' : status === 'LOSS' ? '↓' : '='}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>{status}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={reset} style={{ flex: 1, background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: 8, padding: '11px', fontSize: 13, cursor: 'pointer' }}>↺ Reset</button>
            <button onClick={copyResults} style={{ flex: 1, background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: 8, padding: '11px', fontSize: 13, cursor: 'pointer' }}>⧉ Copy</button>
          </div>
        </div>
      </main>
    </>
  )
}