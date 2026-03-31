'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
  const [ratio, setRatio] = useState('')
  const [horsepower, setHorsepower] = useState('')
  const [frontAxle, setFrontAxle] = useState('')
  const [rearAxle, setRearAxle] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [estRecon, setEstRecon] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [decision, setDecision] = useState('Follow Up')
  const [simPurchase, setSimPurchase] = useState('')
  const [simRecon, setSimRecon] = useState('')
  const [simFees, setSimFees] = useState('0')
  const [simSell, setSimSell] = useState('')
  const [simTarget, setSimTarget] = useState('')
  const [targetMode, setTargetMode] = useState<'$' | '%'>('$')
  const [showSim, setShowSim] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const truckPayload = (status: string) => ({
    status,
    bought_on: new Date().toISOString().split('T')[0],
    vin: vin || 'UNKNOWN',
    year: parseInt(year) || null,
    make: make || null,
    model: model || null,
    kilometers: parseInt(kilometers.replace(/,/g, '')) || null,
    ratio: ratio || null,
    horsepower: horsepower || null,
    front_axle: frontAxle || null,
    rear_axle: rearAxle || null,
    purchase_price: parseFloat(offerPrice) || null,
    recondition_cost: parseFloat(estRecon) || 0,
    payment_status: 'N/A',
    notes: [
      notes,
      decision ? `Decision: ${decision}` : null,
      sellerContact ? `Seller contact: ${sellerContact}` : null,
      Object.entries(checked).filter(([, v]) => v).length > 0
        ? `Passed: ${Object.entries(checked).filter(([, v]) => v).map(([k]) => k).join(', ')}`
        : null,
    ].filter(Boolean).join('\n') || null,
    bought_from: sellerName || null,
  })

  async function saveIntakeOnly() {
    if (!vin && !sellerName && !make) return alert('Please enter at least a VIN, make, or seller name.')
    setSaving(true)
    const { data: truck, error } = await supabase
      .from('Inventory Data')
      .insert([truckPayload('Intake')])
      .select()
      .single()
    setSaving(false)
    if (error) { alert('Error saving intake: ' + error.message); return }
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      router.push(truck ? `/inventory/${truck.id}` : '/inventory')
    }, 1200)
  }

  async function createTruckAndBuy() {
    if (!vin) return alert('VIN is required to create a truck file.')
    setSaving(true)
    const { data: truck, error } = await supabase
      .from('Inventory Data')
      .insert([truckPayload('Purchased')])
      .select()
      .single()
    setSaving(false)
    if (error) { alert('Error creating truck: ' + error.message); return }
    router.push(truck ? `/inventory/${truck.id}` : '/inventory')
  }

  const allIn = (parseFloat(simPurchase) || 0) + (parseFloat(simRecon) || 0) + (parseFloat(simFees) || 0)
  const projectedProfit = simSell ? (parseFloat(simSell) || 0) - allIn : null
  const targetVal = parseFloat(simTarget) || 0
  const minSell = targetMode === '$' ? allIn + targetVal : allIn * (1 + targetVal / 100)
  const profitStatus = projectedProfit === null ? 'UNKNOWN' : projectedProfit > 0 ? 'PROFITABLE' : projectedProfit === 0 ? 'BREAK EVEN' : 'LOSS'
  const profitColor = projectedProfit === null ? 'var(--text3)' : projectedProfit > 0 ? 'var(--green)' : projectedProfit === 0 ? 'var(--gold)' : 'var(--red)'

  const IS = { width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui,sans-serif', transition: 'border-color 0.15s' }
  const LS = { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' as const, fontWeight: 500 }

  return (
    <>
      <style>{`
        .intake-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .intake-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
        @media(max-width:640px){
          .intake-2{grid-template-columns:1fr!important}
          .intake-3{grid-template-columns:1fr 1fr!important}
        }
      `}</style>
      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>ACQUISITION</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Truck Acquisition</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Evaluate and acquire trucks for your fleet.</p>  
          <div style={{ marginTop: 16, height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)' }} />
        </div>

        {/* Seller */}
        <div className="gcard" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Seller Information</div>
          <div className="intake-2">
            <div><label style={LS}>Seller Name *</label><input style={IS} placeholder="e.g. ABC Auctions" value={sellerName} onChange={e => setSellerName(e.target.value)} /></div>
            <div><label style={LS}>Contact</label><input style={IS} placeholder="Phone or email" value={sellerContact} onChange={e => setSellerContact(e.target.value)} /></div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="gcard" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Vehicle Details</div>
          <div style={{ marginBottom: 12 }}><label style={LS}>VIN</label><input style={IS} placeholder="17-character VIN" value={vin} onChange={e => setVin(e.target.value)} maxLength={17} /></div>
          <div className="intake-3" style={{ marginBottom: 12 }}>
            <div><label style={LS}>Year</label><input style={IS} placeholder="2020" value={year} onChange={e => setYear(e.target.value)} /></div>
            <div><label style={LS}>Make</label><input style={IS} placeholder="Freightliner" value={make} onChange={e => setMake(e.target.value)} /></div>
            <div><label style={LS}>Model</label><input style={IS} placeholder="Cascadia" value={model} onChange={e => setModel(e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={LS}>Kilometers</label><input style={IS} placeholder="450,000" value={kilometers} onChange={e => {
            const raw = e.target.value.replace(/[^0-9]/g, '')
            setKilometers(raw ? parseInt(raw).toLocaleString() : '')
          }} /></div>
          <div className="intake-2" style={{ marginBottom: 12 }}>
            <div><label style={LS}>Horsepower (HP)</label><input style={IS} placeholder="e.g. 475" value={horsepower} onChange={e => setHorsepower(e.target.value)} /></div>
            <div><label style={LS}>Ratio</label><input style={IS} placeholder="e.g. 3.55" value={ratio} onChange={e => setRatio(e.target.value)} /></div>
          </div>
          <div className="intake-2">
            <div><label style={LS}>Front Axle</label><input style={IS} placeholder="e.g. 12,000 lbs" value={frontAxle} onChange={e => setFrontAxle(e.target.value)} /></div>
            <div><label style={LS}>Rear Axle</label><input style={IS} placeholder="e.g. 40,000 lbs" value={rearAxle} onChange={e => setRearAxle(e.target.value)} /></div>
          </div>
        </div>

        {/* Inspection */}
        <div className="gcard" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Inspection Checklist</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {inspectionItems.map(item => (
              <div key={item.id} onClick={() => setChecked(p => ({ ...p, [item.id]: !p[item.id] }))} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 0' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${checked[item.id] ? 'var(--gold)' : 'var(--border)'}`, background: checked[item.id] ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {checked[item.id] && <span style={{ color: '#000', fontSize: 11, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: checked[item.id] ? 'var(--text)' : 'var(--text2)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment */}
        <div className="gcard" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Assessment</div>
          <div style={{ marginBottom: 12 }}>
            <label style={LS}>Notes</label>
            <textarea style={{ ...IS, height: 80, resize: 'vertical' }} placeholder="General observations..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="intake-2" style={{ marginBottom: 12 }}>
            {/* ── Est. Recondition — auto-fills simulator ── */}
            <div>
              <label style={LS}>Est. Recondition ($)</label>
              <input
                style={IS}
                placeholder="5000"
                value={estRecon}
                type="number"
                onChange={e => {
                  setEstRecon(e.target.value)
                  setSimRecon(e.target.value)
                }}
              />
            </div>
            {/* ── Offer Price — auto-fills simulator + opens it ── */}
            <div>
              <label style={LS}>Offer Price ($)</label>
              <input
                style={IS}
                placeholder="28000"
                value={offerPrice}
                type="number"
                onChange={e => {
                  setOfferPrice(e.target.value)
                  setSimPurchase(e.target.value)
                  if (e.target.value) setShowSim(true)
                }}
              />
            </div>
          </div>
          <div>
            <label style={LS}>Decision</label>
            <select style={{ ...IS, cursor: 'pointer' }} value={decision} onChange={e => setDecision(e.target.value)}>
              <option>Follow Up</option><option>Buy</option><option>Pass</option><option>Negotiate</option>
            </select>
          </div>
        </div>

        {/* Profit Simulator */}
        <div className="gcard" style={{ marginBottom: 20 }}>
          <button onClick={() => setShowSim(s => !s)} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📈</span>
              Pre-Purchase Profit Simulator
              {(simPurchase || simRecon) && (
                <span style={{ background: 'var(--gold-dim)', color: 'var(--gold)', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>Auto-filled</span>
              )}
            </div>
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>{showSim ? '▲' : '▼'}</span>
          </button>

          {showSim && (
            <div style={{ marginTop: 20 }}>
              <div className="intake-2" style={{ marginBottom: 12 }}>
                <div>
                  <label style={LS}>Purchase Price ($)</label>
                  <input style={{ ...IS, borderColor: simPurchase ? 'var(--gold)' : 'var(--input-border)' }} placeholder="35,000" value={simPurchase} onChange={e => setSimPurchase(e.target.value)} type="number" />
                </div>
                <div>
                  <label style={LS}>Est. Recondition ($)</label>
                  <input style={{ ...IS, borderColor: simRecon ? 'var(--gold)' : 'var(--input-border)' }} placeholder="5,000" value={simRecon} onChange={e => setSimRecon(e.target.value)} type="number" />
                </div>
              </div>
              <div className="intake-2" style={{ marginBottom: 12 }}>
                <div><label style={LS}>Other Fees ($)</label><input style={IS} placeholder="0" value={simFees} onChange={e => setSimFees(e.target.value)} type="number" /></div>
                <div><label style={LS}>Expected Sell Price ($)</label><input style={IS} placeholder="Optional" value={simSell} onChange={e => setSimSell(e.target.value)} type="number" /></div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={LS}>Target Profit</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...IS, flex: 1 }} placeholder="e.g. 8,000" value={simTarget} onChange={e => setSimTarget(e.target.value)} type="number" />
                  <div style={{ display: 'flex', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    {(['$', '%'] as const).map(m => (
                      <button key={m} onClick={() => setTargetMode(m)} style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer', border: 'none', background: targetMode === m ? 'var(--gold)' : 'transparent', color: targetMode === m ? '#000' : 'var(--text3)', fontWeight: targetMode === m ? 800 : 400 }}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { l: 'ALL-IN COST',      v: `$${Math.round(allIn).toLocaleString()}`,                                                                                              c: 'var(--text)'  },
                  { l: 'BREAK-EVEN',       v: `$${Math.round(allIn).toLocaleString()}`,                                                                                              c: 'var(--text)'  },
                  { l: 'MIN SELL',         v: `$${Math.round(minSell).toLocaleString()}`,                                                                                            c: 'var(--gold)'  },
                  { l: 'PROJECTED PROFIT', v: projectedProfit !== null ? `${projectedProfit >= 0 ? '' : '-'}$${Math.abs(Math.round(projectedProfit)).toLocaleString()}` : '—',       c: profitColor    },
                ].map(s => (
                  <div key={s.l} style={{ background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>{s.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--hover)', border: `1px solid ${profitColor}`, borderRadius: 99, padding: '7px 18px', boxShadow: `0 4px 20px ${profitColor}33` }}>
                  <span style={{ fontSize: 13, color: profitColor }}>{profitStatus === 'UNKNOWN' ? '⊙' : profitStatus === 'PROFITABLE' ? '↑' : profitStatus === 'LOSS' ? '↓' : '='}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: profitColor }}>{profitStatus}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setSimPurchase(''); setSimRecon(''); setSimFees('0'); setSimSell(''); setSimTarget('') }}
                  style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  ↺ Reset
                </button>
                {/* Copy results button */}
                <button
                  onClick={() => navigator.clipboard.writeText(`All-In: $${Math.round(allIn).toLocaleString()}\nMin Sell: $${Math.round(minSell).toLocaleString()}\nProjected Profit: ${projectedProfit !== null ? `${projectedProfit >= 0 ? '' : '-'}$${Math.abs(Math.round(projectedProfit)).toLocaleString()}` : 'N/A'}\nStatus: ${profitStatus}`)}
                  style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  ⧉ Copy Results
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={saveIntakeOnly}
            disabled={saving}
            style={{ flex: 1, background: saved ? 'var(--green-dim)' : 'var(--hover)', border: `1px solid ${saved ? 'var(--green)' : 'var(--border)'}`, color: saved ? 'var(--green)' : 'var(--text2)', borderRadius: 12, padding: '14px', fontSize: 13, cursor: saving ? 'default' : 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Intake Only'}
          </button>
          <button
            onClick={createTruckAndBuy}
            disabled={saving}
            style={{ flex: 2, background: saving ? 'var(--hover)' : 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: saving ? 'var(--text3)' : '#000', borderRadius: 12, padding: '14px', fontSize: 13, cursor: saving ? 'default' : 'pointer', fontWeight: 800, boxShadow: saving ? 'none' : '0 4px 16px var(--gold-glow)', transition: 'all 0.2s' }}>
            {saving ? 'Creating...' : 'Create Truck File & Buy'}
          </button>
        </div>
      </main>
    </>
  )
}