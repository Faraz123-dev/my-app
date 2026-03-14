'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string; status: string; bought_on: string | null; vin: string
  year: number | null; make: string | null; model: string | null
  colour: string | null; kilometers: number | null; bought_from: string | null
  purchase_price: number | null; recondition_cost: number | null
  date_sold: string | null; customer: string | null; sold_price: number | null
  payment_status: string | null; notes: string | null
}

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  Purchased:           { bg: 'rgba(255,255,255,0.04)', color: '#888', border: 'rgba(255,255,255,0.1)' },
  'In Reconditioning': { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  'Ready to List':     { bg: 'rgba(234,179,8,0.1)',   color: '#EAB308', border: 'rgba(234,179,8,0.3)' },
  Listed:              { bg: 'rgba(56,189,248,0.1)',  color: '#38bdf8', border: 'rgba(56,189,248,0.3)' },
  'Deal Pending':      { bg: 'rgba(249,115,22,0.1)',  color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  Sold:                { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
}

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export default function InventoryPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [paymentFilter, setPaymentFilter] = useState('All Payments')
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [newTruck, setNewTruck] = useState({ status: 'Purchased', bought_on: new Date().toISOString().split('T')[0], vin: '', year: '', make: '', model: '', colour: '', kilometers: '', bought_from: '', purchase_price: '', recondition_cost: '0', notes: '' })

  useEffect(() => { loadTrucks() }, [])

  async function loadTrucks() {
    setLoading(true)
    const { data, error } = await supabase.from('Inventory Data').select('*').order('bought_on', { ascending: false })
    if (error) setError(error.message)
    else setTrucks(data || [])
    setLoading(false)
  }

  async function addTruck() {
    if (!newTruck.vin) return alert('VIN is required')
    const { error } = await supabase.from('Inventory Data').insert([{ status: newTruck.status, bought_on: newTruck.bought_on, vin: newTruck.vin, year: parseInt(newTruck.year) || null, make: newTruck.make || null, model: newTruck.model || null, colour: newTruck.colour || null, kilometers: parseInt(newTruck.kilometers) || null, bought_from: newTruck.bought_from || null, purchase_price: parseFloat(newTruck.purchase_price) || 0, recondition_cost: parseFloat(newTruck.recondition_cost) || 0, payment_status: 'N/A', notes: newTruck.notes || null }])
    if (error) return alert('Error: ' + error.message)
    setShowAddModal(false)
    setNewTruck({ status: 'Purchased', bought_on: new Date().toISOString().split('T')[0], vin: '', year: '', make: '', model: '', colour: '', kilometers: '', bought_from: '', purchase_price: '', recondition_cost: '0', notes: '' })
    loadTrucks()
  }

  async function deleteTruck(id: string) {
    if (!confirm('Delete this truck?')) return
    await supabase.from('Inventory Data').delete().eq('id', id)
    loadTrucks()
  }

  const filtered = trucks.filter(t => {
    const q = search.toLowerCase()
    return (!q || [t.vin, t.make, t.model, t.customer, t.bought_from].some(v => v?.toLowerCase().includes(q))) && (statusFilter === 'All Statuses' || t.status === statusFilter) && (paymentFilter === 'All Payments' || t.payment_status === paymentFilter)
  })

  const inStock = trucks.filter(t => t.status !== 'Sold').length
  const sold = trucks.filter(t => t.status === 'Sold').length
  const pend = trucks.filter(t => t.payment_status === 'Unpaid').length

  const IS = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'system-ui,sans-serif' }
  const LS = { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' as const }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .inv-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 16px; cursor: pointer; transition: all 0.18s; box-shadow: var(--shadow-card); }
        .inv-card:hover { border-color: var(--gold); transform: translateY(-1px); box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
        .inv-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
        @media(max-width:640px){ .inv-filters select { flex:1; } }
      `}</style>
      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>FLEET</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Inventory</h1>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '9px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px var(--gold-glow)', transition: 'all 0.18s' }}>+ Add Truck</button>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)', marginBottom: 20 }} />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Total', value: trucks.length, color: 'var(--text2)' },
            { label: 'In Stock', value: inStock, color: 'var(--gold)' },
            { label: 'Sold', value: sold, color: 'var(--green)' },
            { label: 'Pending', value: pend, color: 'var(--orange)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 99, padding: '5px 14px', fontSize: 12, color: 'var(--text2)' }}>
              {s.label} <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['cards', 'table'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', border: 'none', background: viewMode === m ? 'var(--gold)' : 'transparent', color: viewMode === m ? '#000' : 'var(--text3)', fontWeight: viewMode === m ? 700 : 400, transition: 'all 0.15s' }}>{m === 'cards' ? '▦' : '☰'}</button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="inv-filters">
          <div style={{ position: 'relative', flex: 2, minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>🔍</span>
            <input style={{ ...IS, paddingLeft: 34 }} placeholder="Search VIN, Make, Model..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={{ ...IS, cursor: 'pointer' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {['All Statuses', 'Purchased', 'In Reconditioning', 'Ready to List', 'Listed', 'Deal Pending', 'Sold'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select style={{ ...IS, cursor: 'pointer' }} value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
            {['All Payments', 'Paid', 'Unpaid', 'N/A'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--red)' }}>Error: {error}</div>
        ) : viewMode === 'cards' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--text4)' }}>No trucks found</div>
              : filtered.map(truck => {
                const allIn = (truck.purchase_price || 0) + (truck.recondition_cost || 0)
                const profit = truck.sold_price != null ? truck.sold_price - allIn : null
                const sc = statusColors[truck.status] || statusColors['Purchased']
                return (
                  <div key={truck.id} className="inv-card" onClick={() => window.location.href = `/inventory/${truck.id}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{truck.year} {truck.make} {truck.model}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, fontFamily: 'monospace' }}>{truck.vin}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{truck.status}</span>
                        <button onClick={e => { e.stopPropagation(); deleteTruck(truck.id) }} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                      {[
                        { l: 'PURCHASE', v: `$${(truck.purchase_price || 0).toLocaleString()}`, c: 'var(--text)' },
                        { l: 'ALL-IN', v: `$${allIn.toLocaleString()}`, c: 'var(--text)' },
                        { l: 'PROFIT', v: profit == null ? '—' : `${profit < 0 ? '-' : ''}$${Math.abs(profit).toLocaleString()}`, c: profit == null ? 'var(--text4)' : profit >= 0 ? 'var(--green)' : 'var(--red)' },
                      ].map(s => (
                        <div key={s.l}>
                          <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 3, letterSpacing: '0.1em', fontWeight: 600 }}>{s.l}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                      {truck.kilometers && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{truck.kilometers.toLocaleString()} km</span>}
                      {truck.bought_on && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Bought {fmt(truck.bought_on)}</span>}
                      {truck.customer && <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>→ {truck.customer}</span>}
                      {truck.payment_status && truck.payment_status !== 'N/A' && (
                        <span style={{ background: truck.payment_status === 'Paid' ? 'var(--green-dim)' : 'var(--red-dim)', color: truck.payment_status === 'Paid' ? 'var(--green)' : 'var(--red)', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>{truck.payment_status}</span>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Status', 'Bought On', 'VIN', 'Year', 'Make', 'Model', 'KMs', 'Purchase', 'All-In', 'Sold Price', 'Profit', 'Payment', ''].map(h => (
                      <th key={h} style={{ padding: '11px 13px', textAlign: 'left', color: 'var(--text4)', fontWeight: 600, fontSize: 10, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? <tr><td colSpan={13} style={{ padding: 48, textAlign: 'center', color: 'var(--text4)' }}>No trucks found</td></tr>
                    : filtered.map(truck => {
                      const allIn = (truck.purchase_price || 0) + (truck.recondition_cost || 0)
                      const profit = truck.sold_price != null ? truck.sold_price - allIn : null
                      const sc = statusColors[truck.status] || statusColors['Purchased']
                      return (
                        <tr key={truck.id} onClick={() => window.location.href = `/inventory/${truck.id}`} style={{ borderBottom: '1px solid var(--border2)', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '10px 13px' }}><span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{truck.status}</span></td>
                          <td style={{ padding: '10px 13px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmt(truck.bought_on)}</td>
                          <td style={{ padding: '10px 13px', color: 'var(--text3)', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{truck.vin}</td>
                          <td style={{ padding: '10px 13px', color: 'var(--text)' }}>{truck.year || '—'}</td>
                          <td style={{ padding: '10px 13px', color: 'var(--text)' }}>{truck.make || '—'}</td>
                          <td style={{ padding: '10px 13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{truck.model || '—'}</td>
                          <td style={{ padding: '10px 13px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{truck.kilometers ? Number(truck.kilometers).toLocaleString() : '—'}</td>
                          <td style={{ padding: '10px 13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>${(truck.purchase_price || 0).toLocaleString()}</td>
                          <td style={{ padding: '10px 13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>${allIn.toLocaleString()}</td>
                          <td style={{ padding: '10px 13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{truck.sold_price != null ? `$${truck.sold_price.toLocaleString()}` : '—'}</td>
                          <td style={{ padding: '10px 13px', whiteSpace: 'nowrap', fontWeight: 700, color: profit == null ? 'var(--text4)' : profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{profit == null ? '—' : `${profit < 0 ? '-' : ''}$${Math.abs(profit).toLocaleString()}`}</td>
                          <td style={{ padding: '10px 13px' }}>{truck.payment_status && truck.payment_status !== 'N/A' ? <span style={{ background: truck.payment_status === 'Paid' ? 'var(--green-dim)' : 'var(--red-dim)', color: truck.payment_status === 'Paid' ? 'var(--green)' : 'var(--red)', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{truck.payment_status}</span> : <span style={{ color: 'var(--text4)', fontSize: 11 }}>N/A</span>}</td>
                          <td style={{ padding: '10px 13px' }}><button onClick={e => { e.stopPropagation(); deleteTruck(truck.id) }} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button></td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border2)', fontSize: 12, color: 'var(--text3)' }}>Showing {filtered.length} of {trucks.length} trucks</div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(8px)' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow)' }}>
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Add New Truck</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 22 }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Status</label><select style={{ ...IS, cursor: 'pointer' }} value={newTruck.status} onChange={e => setNewTruck(p => ({ ...p, status: e.target.value }))}>{['Purchased', 'In Reconditioning', 'Ready to List', 'Listed', 'Deal Pending', 'Sold'].map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={LS}>Bought On</label><input type="date" style={IS} value={newTruck.bought_on} onChange={e => setNewTruck(p => ({ ...p, bought_on: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={LS}>VIN *</label><input style={IS} placeholder="17-CHARACTER VIN" value={newTruck.vin} onChange={e => setNewTruck(p => ({ ...p, vin: e.target.value }))} maxLength={17} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {([['Year', 'year', '2020'], ['Make', 'make', 'Freightliner'], ['Model', 'model', 'Cascadia']] as const).map(([label, key, ph]) => (
                  <div key={key}><label style={LS}>{label}</label><input style={IS} placeholder={ph} value={(newTruck as any)[key]} onChange={e => setNewTruck(p => ({ ...p, [key]: e.target.value }))} /></div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Colour</label><input style={IS} placeholder="White" value={newTruck.colour} onChange={e => setNewTruck(p => ({ ...p, colour: e.target.value }))} /></div>
                <div><label style={LS}>KMs</label><input style={IS} placeholder="450000" type="number" value={newTruck.kilometers} onChange={e => setNewTruck(p => ({ ...p, kilometers: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={LS}>Bought From</label><input style={IS} placeholder="e.g. Lussicam Inc." value={newTruck.bought_from} onChange={e => setNewTruck(p => ({ ...p, bought_from: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Purchase Price ($)</label><input style={IS} placeholder="35000" type="number" value={newTruck.purchase_price} onChange={e => setNewTruck(p => ({ ...p, purchase_price: e.target.value }))} /></div>
                <div><label style={LS}>Recondition Cost ($)</label><input style={IS} placeholder="0" type="number" value={newTruck.recondition_cost} onChange={e => setNewTruck(p => ({ ...p, recondition_cost: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 20 }}><label style={LS}>Notes</label><textarea style={{ ...IS, height: 70, resize: 'vertical' }} placeholder="Any purchase notes..." value={newTruck.notes} onChange={e => setNewTruck(p => ({ ...p, notes: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 10, padding: '13px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button onClick={addTruck} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 10, padding: '13px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px var(--gold-glow)' }}>Add Truck</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}