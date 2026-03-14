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
  const breakEven = allIn
  const targetVal = parseFloat(targetProfit) || 0
  const minSell = targetMode === '$' ? allIn + targetVal : allIn * (1 + targetVal / 100)
  const projectedProfit = sellPrice ? (parseFloat(sellPrice) || 0) - allIn : null

  const status = projectedProfit === null ? 'UNKNOWN'
    : projectedProfit > 0 ? 'PROFITABLE'
    : projectedProfit === 0 ? 'BREAK EVEN'
    : 'LOSS'

  const statusColor = projectedProfit === null ? '#666'
    : projectedProfit > 0 ? '#22c55e'
    : projectedProfit === 0 ? '#EAB308'
    : '#ef4444'

  const reset = () => { setPurchase(''); setRecon(''); setFees('0'); setSellPrice(''); setTargetProfit('') }

  const copyResults = () => {
    const text = `Pre-Purchase Profit Simulator Results
Purchase Price: $${parseFloat(purchase || '0').toLocaleString()}
Est. Recondition: $${parseFloat(recon || '0').toLocaleString()}
Other Fees: $${parseFloat(fees || '0').toLocaleString()}
All-In Cost: $${Math.round(allIn).toLocaleString()}
Break-Even: $${Math.round(breakEven).toLocaleString()}
Min Sell Required: $${Math.round(minSell).toLocaleString()}
Expected Sell Price: ${sellPrice ? '$' + parseFloat(sellPrice).toLocaleString() : 'N/A'}
Projected Profit: ${projectedProfit !== null ? (projectedProfit >= 0 ? '' : '-') + '$' + Math.abs(Math.round(projectedProfit)).toLocaleString() : 'N/A'}
Status: ${status}`
    navigator.clipboard.writeText(text)
  }

  const inputStyle = {
    width: '100%', background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 10,
    padding: '14px 16px', color: '#e5e5e5', fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'monospace',
  }
  const labelStyle = { fontSize: 13, color: '#ccc', marginBottom: 8, display: 'block' as const }

  return (
    <main style={{ padding: '28px', overflowY: 'auto', background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0 }}>Pre-Purchase Profit Simulator</h1>
        </div>
        <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Decide whether a truck is worth buying before you commit.</p>
      </div>

      <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 12, padding: '28px', maxWidth: 900 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div><label style={labelStyle}>Purchase Price (CAD) *</label><input style={inputStyle} placeholder="e.g. 35,000" type="number" value={purchase} onChange={e => setPurchase(e.target.value)} /></div>
          <div><label style={labelStyle}>Est. Recondition Cost (CAD) *</label><input style={inputStyle} placeholder="e.g. 5,000" type="number" value={recon} onChange={e => setRecon(e.target.value)} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div><label style={labelStyle}>Other Fees (CAD)</label><input style={inputStyle} placeholder="0" type="number" value={fees} onChange={e => setFees(e.target.value)} /></div>
          <div><label style={labelStyle}>Expected Sell Price (CAD)</label><input style={{ ...inputStyle, background: sellPrice ? '#0f0f0f' : '#0a0a0a' }} placeholder="Optional" type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} /></div>
        </div>

        <div style={{ border: '1px solid #222', borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>Target Profit (CAD)</label>
          <input style={{ ...inputStyle, maxWidth: 200 }} placeholder="e.g. 8,000" type="number" value={targetProfit} onChange={e => setTargetProfit(e.target.value)} />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#666' }}>$</span>
            <div onClick={() => setTargetMode(m => m === '$' ? '%' : '$')}
              style={{ width: 44, height: 24, borderRadius: 12, background: targetMode === '%' ? '#EAB308' : '#2a2a2a', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 3, left: targetMode === '%' ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, color: '#666' }}>%</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'ALL-IN COST', value: `$${Math.round(allIn).toLocaleString()}`, color: '#fff', accent: '#EAB308' },
            { label: 'BREAK-EVEN', value: `$${Math.round(breakEven).toLocaleString()}`, color: '#fff', accent: '#EAB308' },
            { label: 'MIN SELL REQUIRED', value: `$${Math.round(minSell).toLocaleString()}`, color: '#EAB308', accent: '#EAB308' },
            {
              label: 'PROJECTED PROFIT',
              value: projectedProfit !== null ? `${projectedProfit >= 0 ? '' : '-'}$${Math.abs(Math.round(projectedProfit)).toLocaleString()}` : '—',
              color: projectedProfit === null ? '#555' : projectedProfit >= 0 ? '#22c55e' : '#ef4444',
              accent: projectedProfit === null ? '#333' : projectedProfit >= 0 ? '#22c55e' : '#ef4444',
            },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 10, padding: '16px 18px', borderBottom: `2px solid ${stat.accent}` }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111', border: '1px solid #2a2a2a', borderRadius: 20, padding: '8px 20px' }}>
            <span style={{ fontSize: 14, color: statusColor }}>{status === 'UNKNOWN' ? '⊙' : status === 'PROFITABLE' ? '↑' : status === 'LOSS' ? '↓' : '='}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>{status}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={reset} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>↺ Reset</button>
          <button onClick={copyResults} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>⧉ Copy Results</button>
        </div>
      </div>
    </main>
  )
}