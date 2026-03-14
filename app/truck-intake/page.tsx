'use client'

import { useState } from 'react'

const inspectionItems = [
  { id: 'engine', label: 'Engine runs properly' },
  { id: 'transmission', label: 'Transmission shifts smoothly' },
  { id: 'brakes', label: 'Brakes in good condition' },
  { id: 'tires', label: 'Tires in good condition' },
  { id: 'body', label: 'No major body damage' },
  { id: 'electrical', label: 'Electrical systems functional' },
  { id: 'ac', label: 'AC / Heating works' },
  { id: 'warnings', label: 'No warning lights on dash' },
]

export default function TruckIntakePage() {
  const [sellerName, setSellerName] = useState('')
  const [sellerContact, setSellerContact] = useState('')
  const [vin, setVin] = useState('')
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [kilometers, setKilometers] = useState('')
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [estRecondition, setEstRecondition] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [decision, setDecision] = useState('Follow Up')
  const [simPurchase, setSimPurchase] = useState('')
  const [simRecon, setSimRecon] = useState('')
  const [simFees, setSimFees] = useState('0')
  const [simSellPrice, setSimSellPrice] = useState('')
  const [simTargetProfit, setSimTargetProfit] = useState('')
  const [targetMode, setTargetMode] = useState<'$' | '%'>('$')
  const [showSim, setShowSim] = useState(false)

  const allInCost = (parseFloat(simPurchase) || 0) + (parseFloat(simRecon) || 0) + (parseFloat(simFees) || 0)
  const projectedProfit = simSellPrice ? (parseFloat(simSellPrice) || 0) - allInCost : null
  const targetVal = parseFloat(simTargetProfit) || 0
  const minSell = targetMode === '$' ? allInCost + targetVal : allInCost * (1 + targetVal / 100)
  const profitStatus = projectedProfit === null ? 'UNKNOWN' : projectedProfit > 0 ? 'PROFITABLE' : projectedProfit === 0 ? 'BREAK EVEN' : 'LOSS'
  const profitColor = projectedProfit === null ? '#666' : projectedProfit > 0 ? '#22c55e' : projectedProfit === 0 ? '#EAB308' : '#ef4444'
  const toggleCheck = (id: string) => setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }))

  const inputStyle = {
    width: '100%', background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8,
    padding: '10px 14px', color: '#e5e5e5', fontSize: 13, outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'system-ui, sans-serif',
  }
  const labelStyle = { fontSize: 12, color: '#888', marginBottom: 6, display: 'block' as const }
  const sectionStyle = { background: '#161616', border: '1px solid #252525', borderRadius: 10, padding: '16px', marginBottom: 14 }

  return (
    <>
      <style>{`
        .intake-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .intake-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) {
          .intake-grid { grid-template-columns: 1fr !important; }
          .intake-grid-3 { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      <main style={{ padding: '16px', overflowY: 'auto', background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Truck Intake</h1>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Inspect and evaluate a truck for purchase.</p>

        {/* Seller Info */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 14 }}>Seller Information</div>
          <div className="intake-grid">
            <div><label style={labelStyle}>Seller Name *</label><input style={inputStyle} placeholder="e.g. ABC Auctions" value={sellerName} onChange={e => setSellerName(e.target.value)} /></div>
            <div><label style={labelStyle}>Seller Contact</label><input style={inputStyle} placeholder="Phone or email" value={sellerContact} onChange={e => setSellerContact(e.target.value)} /></div>
          </div>
        </div>

        {/* Vehicle Details */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 14 }}>Vehicle Details</div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>VIN</label><input style={inputStyle} placeholder="17-character VIN" value={vin} onChange={e => setVin(e.target.value)} maxLength={17} /></div>
          <div className="intake-grid-3" style={{ marginBottom: 12 }}>
            <div><label style={labelStyle}>Year</label><input style={inputStyle} placeholder="2020" value={year} onChange={e => setYear(e.target.value)} /></div>
            <div><label style={labelStyle}>Make</label><input style={inputStyle} placeholder="Freightliner" value={make} onChange={e => setMake(e.target.value)} /></div>
            <div><label style={labelStyle}>Model</label><input style={inputStyle} placeholder="Cascadia" value={model} onChange={e => setModel(e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Kilometers</label><input style={inputStyle} placeholder="450000" value={kilometers} onChange={e => setKilometers(e.target.value)} type="number" /></div>
        </div>

        {/* Inspection */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 14 }}>Inspection Checklist</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {inspectionItems.map(item => (
              <div key={item.id} onClick={() => toggleCheck(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 0' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${checkedItems[item.id] ? '#EAB308' : '#333'}`, background: checkedItems[item.id] ? '#EAB308' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {checkedItems[item.id] && <span style={{ color: '#000', fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: checkedItems[item.id] ? '#ccc' : '#888' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 14 }}>Assessment</div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="General observations..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <div className="intake-grid" style={{ marginBottom: 12 }}>
            <div><label style={labelStyle}>Est. Recondition ($)</label><input style={inputStyle} placeholder="5000" value={estRecondition} onChange={e => setEstRecondition(e.target.value)} type="number" /></div>
            <div><label style={labelStyle}>Offer Price ($)</label><input style={inputStyle} placeholder="28000" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} type="number" /></div>
          </div>
          <div><label style={labelStyle}>Decision</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={decision} onChange={e => setDecision(e.target.value)}>
              <option>Follow Up</option><option>Buy</option><option>Pass</option><option>Negotiate</option>
            </select>
          </div>
        </div>

        {/* Profit Simulator - collapsible on mobile */}
        <div style={{ background: '#161616', border: '1px solid #252525', borderRadius: 10, marginBottom: 16 }}>
          <button onClick={() => setShowSim(s => !s)} style={{ width: '100%', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#EAB308' }}>📈</span> Pre-Purchase Profit Simulator</div>
            <span style={{ color: '#555' }}>{showSim ? '▲' : '▼'}</span>
          </button>
          {showSim && (
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>Purchase Price ($)</label><input style={inputStyle} placeholder="35,000" value={simPurchase} onChange={e => setSimPurchase(e.target.value)} type="number" /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>Est. Recondition Cost ($)</label><input style={inputStyle} placeholder="5,000" value={simRecon} onChange={e => setSimRecon(e.target.value)} type="number" /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>Other Fees ($)</label><input style={inputStyle} placeholder="0" value={simFees} onChange={e => setSimFees(e.target.value)} type="number" /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>Expected Sell Price ($)</label><input style={inputStyle} placeholder="Optional" value={simSellPrice} onChange={e => setSimSellPrice(e.target.value)} type="number" /></div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Target Profit</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="e.g. 8,000" value={simTargetProfit} onChange={e => setSimTargetProfit(e.target.value)} type="number" />
                  <div style={{ display: 'flex', background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                    {(['$', '%'] as const).map(mode => (
                      <button key={mode} onClick={() => setTargetMode(mode)} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', border: 'none', background: targetMode === mode ? '#EAB308' : 'transparent', color: targetMode === mode ? '#000' : '#888', fontWeight: targetMode === mode ? 600 : 400 }}>{mode}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[
                  { label: 'ALL-IN COST', value: `$${allInCost.toLocaleString()}`, color: '#fff' },
                  { label: 'BREAK-EVEN', value: `$${allInCost.toLocaleString()}`, color: '#fff' },
                  { label: 'MIN SELL', value: `$${Math.round(minSell).toLocaleString()}`, color: '#EAB308' },
                  { label: 'PROJECTED PROFIT', value: projectedProfit !== null ? `${projectedProfit >= 0 ? '' : '-'}$${Math.abs(projectedProfit).toLocaleString()}` : '—', color: projectedProfit !== null ? (projectedProfit >= 0 ? '#22c55e' : '#ef4444') : '#666' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 8, padding: '12px' }}>
                    <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.08em', marginBottom: 4 }}>{stat.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', padding: '8px', borderRadius: 6, background: '#0f0f0f', border: '1px solid #2a2a2a', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: profitColor, fontWeight: 600 }}>{profitStatus === 'UNKNOWN' ? '⊙' : profitStatus === 'PROFITABLE' ? '↑' : profitStatus === 'LOSS' ? '↓' : '='} {profitStatus}</span>
              </div>
              <button onClick={() => { setSimPurchase(''); setSimRecon(''); setSimFees('0'); setSimSellPrice(''); setSimTargetProfit('') }}
                style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: 6, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>↺ Reset</button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 8, padding: '13px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Save Intake Only</button>
          <button style={{ flex: 2, background: '#EAB308', border: 'none', color: '#000', borderRadius: 8, padding: '13px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Create Truck File & Buy</button>
        </div>
      </main>
    </>
  )
}