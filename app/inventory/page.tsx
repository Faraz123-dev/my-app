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
  Purchased:           { bg: '#1a1a1a', color: '#888', border: '#333' },
  'In Reconditioning': { bg: '#1a2a1a', color: '#22c55e', border: '#2a4a2a' },
  'Ready to List':     { bg: '#2a2a0a', color: '#EAB308', border: '#4a4a0a' },
  Listed:              { bg: '#1a2a2a', color: '#38bdf8', border: '#2a4a4a' },
  'Deal Pending':      { bg: '#2a1a00', color: '#f97316', border: '#4a3a00' },
  Sold:                { bg: '#0a2a0a', color: '#22c55e', border: '#1a4a1a' },
}

const fmt = (date: string | null) =>
  date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const inputStyle = {
  background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8,
  padding: '9px 14px', color: '#e5e5e5', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box' as const, fontFamily: 'system-ui, sans-serif',
}
const labelStyle = { fontSize: 12, color: '#888', marginBottom: 6, display: 'block' as const }

export default function InventoryPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [paymentFilter, setPaymentFilter] = useState('All Payments')
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [newTruck, setNewTruck] = useState({
    status: 'Purchased', bought_on: new Date().toISOString().split('T')[0],
    vin: '', year: '', make: '', model: '', colour: '',
    kilometers: '', bought_from: '', purchase_price: '', recondition_cost: '0', notes: '',
  })

  useEffect(() => { fetchTrucks() }, [])

  async function fetchTrucks() {
    setLoading(true)
    const { data, error } = await supabase.from('Inventory Data').select('*').order('bought_on', { ascending: false })
    if (error) setError(error.message)
    else setTrucks(data || [])
    setLoading(false)
  }

  async function addTruck() {
    if (!newTruck.vin) return alert('VIN is required')
    const { error } = await supabase.from('Inventory Data').insert([{
      status: newTruck.status, bought_on: newTruck.bought_on, vin: newTruck.vin,
      year: parseInt(newTruck.year) || null, make: newTruck.make || null,
      model: newTruck.model || null, colour: newTruck.colour || null,
      kilometers: parseInt(newTruck.kilometers) || null, bought_from: newTruck.bought_from || null,
      purchase_price: parseFloat(newTruck.purchase_price) || 0,
      recondition_cost: parseFloat(newTruck.recondition_cost) || 0,
      payment_status: 'N/A', notes: newTruck.notes || null,
    }])
    if (error) return alert('Error: ' + error.message)
    setShowAddModal(false)
    setNewTruck({ status: 'Purchased', bought_on: new Date().toISOString().split('T')[0], vin: '', year: '', make: '', model: '', colour: '', kilometers: '', bought_from: '', purchase_price: '', recondition_cost: '0', notes: '' })
    fetchTrucks()
  }

  async function deleteTruck(id: string) {
    if (!confirm('Delete this truck?')) return
    await supabase.from('Inventory Data').delete().eq('id', id)
    fetchTrucks()
  }

  const filtered = trucks.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || [t.vin, t.make, t.model, t.customer, t.bought_from].some(v => v?.toLowerCase().includes(q))
    return matchSearch && (statusFilter === 'All Statuses' || t.status === statusFilter) && (paymentFilter === 'All Payments' || t.payment_status === paymentFilter)
  })

  const inStock = trucks.filter(t => t.status !== 'Sold').length
  const sold = trucks.filter(t => t.status === 'Sold').length
  const pending = trucks.filter(t => t.payment_status === 'Unpaid').length

  return (
    <>
      <style>{`
        .inv-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
        .inv-filters input { flex: 1; min-width: 160px; }
        .inv-filters select { min-width: 130px; }
        @media (max-width: 640px) {
          .inv-filters select { flex: 1; }
        }
      `}</style>
      <main style={{ padding: '16px', overflowY: 'auto', background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#fff', margin: 0 }}>Inventory</h1>
          <button onClick={() => setShowAddModal(true)} style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 7, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: trucks.length, color: '#888' },
            { label: 'In Stock', value: inStock, color: '#EAB308' },
            { label: 'Sold', value: sold, color: '#22c55e' },
            { label: 'Pending', value: pending, color: '#f97316' },
          ].map(s => (
            <div key={s.label} style={{ background: '#161616', border: '1px solid #252525', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#666' }}>
              {s.label} <span style={{ color: s.color, fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}
          {/* View toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', background: '#161616', border: '1px solid #252525', borderRadius: 6, overflow: 'hidden' }}>
            {(['cards', 'table'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '5px 10px', fontSize: 11, cursor: 'pointer', border: 'none', background: viewMode === m ? '#EAB308' : 'transparent', color: viewMode === m ? '#000' : '#666' }}>{m === 'cards' ? '▦' : '☰'}</button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="inv-filters">
          <div style={{ position: 'relative', flex: 2, minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 13 }}>🔍</span>
            <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Search VIN, Make, Model..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {['All Statuses', 'Purchased', 'In Reconditioning', 'Ready to List', 'Listed', 'Deal Pending', 'Sold'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
            {['All Payments', 'Paid', 'Unpaid', 'N/A'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>Loading inventory...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#ef4444' }}>Error: {error}</div>
        ) : viewMode === 'cards' ? (
          /* CARD VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#555' }}>No trucks found</div>
            ) : filtered.map(truck => {
              const allIn = (truck.purchase_price || 0) + (truck.recondition_cost || 0)
              const profit = truck.sold_price != null ? truck.sold_price - allIn : null
              const sc = statusColors[truck.status] || statusColors['Purchased']
              return (
                <div key={truck.id} onClick={() => window.location.href = `/inventory/${truck.id}`}
                  style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#333')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{truck.year} {truck.make} {truck.model}</div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 2, fontFamily: 'monospace' }}>{truck.vin}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 4, padding: '3px 8px', fontSize: 11, whiteSpace: 'nowrap' }}>{truck.status}</span>
                      <button onClick={e => { e.stopPropagation(); deleteTruck(truck.id) }} style={{ background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer', fontSize: 14 }}>🗑</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div><div style={{ fontSize: 9, color: '#555', marginBottom: 2 }}>PURCHASE</div><div style={{ fontSize: 13, color: '#ccc' }}>${(truck.purchase_price || 0).toLocaleString()}</div></div>
                    <div><div style={{ fontSize: 9, color: '#555', marginBottom: 2 }}>ALL-IN</div><div style={{ fontSize: 13, color: '#ccc' }}>${allIn.toLocaleString()}</div></div>
                    <div><div style={{ fontSize: 9, color: '#555', marginBottom: 2 }}>PROFIT</div><div style={{ fontSize: 13, fontWeight: 600, color: profit == null ? '#444' : profit >= 0 ? '#22c55e' : '#ef4444' }}>{profit == null ? '—' : `${profit < 0 ? '-' : ''}$${Math.abs(profit).toLocaleString()}`}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                    {truck.kilometers && <span style={{ fontSize: 11, color: '#666' }}>{truck.kilometers.toLocaleString()} km</span>}
                    {truck.bought_on && <span style={{ fontSize: 11, color: '#666' }}>Bought {fmt(truck.bought_on)}</span>}
                    {truck.customer && <span style={{ fontSize: 11, color: '#888' }}>→ {truck.customer}</span>}
                    {truck.payment_status && truck.payment_status !== 'N/A' && (
                      <span style={{ background: truck.payment_status === 'Paid' ? '#0a2a0a' : '#2a0a0a', color: truck.payment_status === 'Paid' ? '#22c55e' : '#ef4444', border: `1px solid ${truck.payment_status === 'Paid' ? '#1a4a1a' : '#4a1a1a'}`, borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>{truck.payment_status}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* TABLE VIEW - horizontally scrollable */
          <div style={{ background: '#161616', border: '1px solid #252525', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #222' }}>
                    {['Status', 'Bought On', 'VIN', 'Year', 'Make', 'Model', 'KMs', 'Purchase', 'All-In', 'Sold Price', 'Profit', 'Payment', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#555', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={13} style={{ padding: 48, textAlign: 'center', color: '#555' }}>No trucks found</td></tr>
                  ) : filtered.map(truck => {
                    const allIn = (truck.purchase_price || 0) + (truck.recondition_cost || 0)
                    const profit = truck.sold_price != null ? truck.sold_price - allIn : null
                    const sc = statusColors[truck.status] || statusColors['Purchased']
                    return (
                      <tr key={truck.id} onClick={() => window.location.href = `/inventory/${truck.id}`}
                        style={{ borderBottom: '1px solid #1a1a1a', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1c1c1c')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '10px 12px' }}><span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 4, padding: '2px 7px', fontSize: 11, whiteSpace: 'nowrap' }}>{truck.status}</span></td>
                        <td style={{ padding: '10px 12px', color: '#888', whiteSpace: 'nowrap' }}>{fmt(truck.bought_on)}</td>
                        <td style={{ padding: '10px 12px', color: '#aaa', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{truck.vin}</td>
                        <td style={{ padding: '10px 12px', color: '#ccc' }}>{truck.year || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#ccc' }}>{truck.make || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#ccc', whiteSpace: 'nowrap' }}>{truck.model || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#888', whiteSpace: 'nowrap' }}>{truck.kilometers ? Number(truck.kilometers).toLocaleString() : '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#ccc', whiteSpace: 'nowrap' }}>${(truck.purchase_price || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', color: '#ccc', whiteSpace: 'nowrap' }}>${allIn.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', color: '#ccc', whiteSpace: 'nowrap' }}>{truck.sold_price != null ? `$${truck.sold_price.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontWeight: 600, color: profit == null ? '#444' : profit >= 0 ? '#22c55e' : '#ef4444' }}>{profit == null ? '—' : `${profit < 0 ? '-' : ''}$${Math.abs(profit).toLocaleString()}`}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {truck.payment_status && truck.payment_status !== 'N/A'
                            ? <span style={{ background: truck.payment_status === 'Paid' ? '#0a2a0a' : '#2a0a0a', color: truck.payment_status === 'Paid' ? '#22c55e' : '#ef4444', border: `1px solid ${truck.payment_status === 'Paid' ? '#1a4a1a' : '#4a1a1a'}`, borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{truck.payment_status}</span>
                            : <span style={{ color: '#444', fontSize: 11 }}>N/A</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}><button onClick={e => { e.stopPropagation(); deleteTruck(truck.id) }} style={{ background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer', fontSize: 14 }}>🗑</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid #1e1e1e', fontSize: 12, color: '#555' }}>Showing {filtered.length} of {trucks.length} trucks</div>
          </div>
        )}

        {/* Add Truck Modal */}
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>Add New Truck</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 22 }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={labelStyle}>Status</label><select style={{ ...inputStyle, cursor: 'pointer' }} value={newTruck.status} onChange={e => setNewTruck(p => ({ ...p, status: e.target.value }))}>{['Purchased', 'In Reconditioning', 'Ready to List', 'Listed', 'Deal Pending', 'Sold'].map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={labelStyle}>Bought On</label><input type="date" style={inputStyle} value={newTruck.bought_on} onChange={e => setNewTruck(p => ({ ...p, bought_on: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={labelStyle}>VIN *</label><input style={inputStyle} placeholder="17-CHARACTER VIN" value={newTruck.vin} onChange={e => setNewTruck(p => ({ ...p, vin: e.target.value }))} maxLength={17} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {([['Year', 'year', '2020'], ['Make', 'make', 'Freightliner'], ['Model', 'model', 'Cascadia']] as const).map(([label, key, ph]) => (
                  <div key={key}><label style={labelStyle}>{label}</label><input style={inputStyle} placeholder={ph} value={(newTruck as any)[key]} onChange={e => setNewTruck(p => ({ ...p, [key]: e.target.value }))} /></div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={labelStyle}>Colour</label><input style={inputStyle} placeholder="White" value={newTruck.colour} onChange={e => setNewTruck(p => ({ ...p, colour: e.target.value }))} /></div>
                <div><label style={labelStyle}>KMs</label><input style={inputStyle} placeholder="450000" type="number" value={newTruck.kilometers} onChange={e => setNewTruck(p => ({ ...p, kilometers: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={labelStyle}>Bought From</label><input style={inputStyle} placeholder="e.g. Lussicam Inc." value={newTruck.bought_from} onChange={e => setNewTruck(p => ({ ...p, bought_from: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={labelStyle}>Purchase Price ($)</label><input style={inputStyle} placeholder="35000" type="number" value={newTruck.purchase_price} onChange={e => setNewTruck(p => ({ ...p, purchase_price: e.target.value }))} /></div>
                <div><label style={labelStyle}>Recondition Cost ($)</label><input style={inputStyle} placeholder="0" type="number" value={newTruck.recondition_cost} onChange={e => setNewTruck(p => ({ ...p, recondition_cost: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} placeholder="Any purchase notes..." value={newTruck.notes} onChange={e => setNewTruck(p => ({ ...p, notes: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: 8, padding: '12px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={addTruck} style={{ flex: 2, background: '#EAB308', border: 'none', color: '#000', borderRadius: 8, padding: '12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add Truck</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}