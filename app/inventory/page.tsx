'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string; status: string; bought_on: string | null; vin: string
  year: number | null; make: string | null; model: string | null
  colour: string | null; kilometers: number | null; bought_from: string | null
  purchase_price: number | null; recondition_cost: number | null
  date_sold: string | null; customer: string | null; sold_price: number | null
  payment_status: string | null; notes: string | null; photo_url: string | null
}

type SortDir = 'asc' | 'desc'

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  Intake:              { bg: 'var(--gold-dim)',   color: 'var(--gold)',   border: 'var(--gold)' },
  Purchased:           { bg: 'var(--hover)',      color: 'var(--text2)',  border: 'var(--border)' },
  'In Reconditioning': { bg: 'var(--green-dim)',  color: 'var(--green)',  border: 'var(--green)' },
  'Ready to List':     { bg: 'var(--gold-dim)',   color: 'var(--gold)',   border: 'var(--gold)' },
  Listed:              { bg: 'var(--blue-dim)',   color: 'var(--blue)',   border: 'var(--blue)' },
  'Deal Pending':      { bg: 'var(--orange-dim)', color: 'var(--orange)', border: 'var(--orange)' },
  Sold:                { bg: 'var(--green-dim)',  color: 'var(--green)',  border: 'var(--green)' },
}

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

function PhotoCell({ truck, onUploaded, onRemoved }: { truck: Truck; onUploaded: (url: string) => void; onRemoved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `trucks/${truck.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('invoices').getPublicUrl(path)
      await supabase.from('Inventory Data').update({ photo_url: data.publicUrl }).eq('id', truck.id)
      onUploaded(data.publicUrl)
    }
    setUploading(false)
  }

  async function removePhoto(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Remove this photo?')) return
    const path = truck.photo_url!.split('/invoices/')[1]
    if (path) await supabase.storage.from('invoices').remove([path])
    await supabase.from('Inventory Data').update({ photo_url: null }).eq('id', truck.id)
    onRemoved()
  }

  if (truck.photo_url) {
    return (
      <>
        <div onClick={e => { e.stopPropagation(); setPreview(truck.photo_url) }}
          style={{ width: 48, height: 36, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', flexShrink: 0, position: 'relative' }}>
          <img src={truck.photo_url} alt="Truck" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {preview && (
          <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${preview})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(0.3)', transform: 'scale(1.1)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{truck.year} {truck.make} {truck.model}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={e => { e.stopPropagation(); fileRef.current?.click() }} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 99, padding: '7px 18px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>🔄 Replace</button>
                <button onClick={removePhoto} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#fff', borderRadius: 99, padding: '7px 18px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>🗑 Remove</button>
                <button onClick={() => setPreview(null)} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>
            <div onClick={e => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, flex: 1, padding: '0 16px 16px' }}>
              <img src={preview} alt="Truck" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.8)', display: 'block' }} />
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </>
    )
  }

  return (
    <>
      <button onClick={e => { e.stopPropagation(); fileRef.current?.click() }} disabled={uploading}
        style={{ width: 48, height: 36, borderRadius: 6, border: '1px dashed var(--border)', background: 'var(--hover)', color: uploading ? 'var(--text4)' : 'var(--text3)', cursor: uploading ? 'default' : 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
        onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>
        {uploading ? '⟳' : '📷'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </>
  )
}

// Unique values for a column
function getUnique(trucks: Truck[], key: keyof Truck): string[] {
  const vals = trucks.map(t => {
    const v = t[key]
    return v != null ? String(v) : null
  }).filter(Boolean) as string[]
  return Array.from(new Set(vals)).sort()
}

export default function InventoryPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Sorting
  const [sortCol, setSortCol] = useState<keyof Truck>('bought_on')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Column filters — key = column, value = selected filter value
  const [colFilters, setColFilters] = useState<Partial<Record<keyof Truck, string>>>({})

  // Filter popup state
  const [filterPopup, setFilterPopup] = useState<{ col: keyof Truck; x: number; y: number } | null>(null)
  const [filterSearch, setFilterSearch] = useState('')
  const popupRef = useRef<HTMLDivElement>(null)

  // Date range filters
  const [boughtFrom, setBoughtFrom] = useState('')
  const [boughtTo, setBoughtTo] = useState('')
  const [soldFrom, setSoldFrom] = useState('')
  const [soldTo, setSoldTo] = useState('')
  const [showDateFilters, setShowDateFilters] = useState(false)

  const [newTruck, setNewTruck] = useState({ status: 'Purchased', bought_on: new Date().toISOString().split('T')[0], vin: '', year: '', make: '', model: '', colour: '', kilometers: '', bought_from: '', purchase_price: '', recondition_cost: '0', notes: '' })
  const [editTruck, setEditTruck] = useState<Truck | null>(null)
  const [editForm, setEditForm] = useState<Partial<Truck>>({})

  useEffect(() => { loadTrucks() }, [])

  // Close popup on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setFilterPopup(null)
        setFilterSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadTrucks() {
    setLoading(true)
    const { data, error } = await supabase.from('Inventory Data').select('*')
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
    loadTrucks()
  }

  async function deleteTruck(id: string) {
    if (!confirm('Delete this truck?')) return
    await supabase.from('Inventory Data').delete().eq('id', id)
    loadTrucks()
  }

  function openEdit(truck: Truck, e: React.MouseEvent) {
    e.stopPropagation()
    setEditTruck(truck)
    setEditForm({ status: truck.status, bought_on: truck.bought_on, vin: truck.vin, year: truck.year, make: truck.make, model: truck.model, colour: truck.colour, kilometers: truck.kilometers, bought_from: truck.bought_from, purchase_price: truck.purchase_price, recondition_cost: truck.recondition_cost, sold_price: truck.sold_price, date_sold: truck.date_sold, customer: truck.customer, payment_status: truck.payment_status, notes: truck.notes })
  }

  async function saveEdit() {
    if (!editTruck) return
    const payload = { ...editForm, year: editForm.year ? Number(editForm.year) : null, kilometers: editForm.kilometers ? Number(editForm.kilometers) : null, purchase_price: editForm.purchase_price ? Number(editForm.purchase_price) : null, recondition_cost: editForm.recondition_cost ? Number(editForm.recondition_cost) : null, sold_price: editForm.sold_price ? Number(editForm.sold_price) : null, date_sold: editForm.date_sold || null, customer: editForm.customer || null, bought_from: editForm.bought_from || null, colour: editForm.colour || null, notes: editForm.notes || null }
    const { error } = await supabase.from('Inventory Data').update(payload).eq('id', editTruck.id)
    if (error) { alert('Error: ' + error.message); return }
    setTrucks(prev => prev.map(t => t.id === editTruck.id ? { ...t, ...payload } : t))
    setEditTruck(null)
  }

  // Sort handler
  function handleSort(col: keyof Truck) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  // Open filter popup
  function openFilter(e: React.MouseEvent, col: keyof Truck) {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setFilterPopup({ col, x: rect.left, y: rect.bottom + 4 })
    setFilterSearch('')
  }

  // Apply sort + column filters + search + date ranges
  const filtered = trucks
    .filter(t => {
      const q = search.toLowerCase()
      if (q && ![t.vin, t.make, t.model, t.customer, t.bought_from].some(v => v?.toLowerCase().includes(q))) return false
      for (const [col, val] of Object.entries(colFilters)) {
        if (!val) continue
        const tv = (t as any)[col]
        if (tv == null || String(tv) !== val) return false
      }
      if (boughtFrom && (!t.bought_on || t.bought_on < boughtFrom)) return false
      if (boughtTo && (!t.bought_on || t.bought_on > boughtTo)) return false
      if (soldFrom && (!t.date_sold || t.date_sold < soldFrom)) return false
      if (soldTo && (!t.date_sold || t.date_sold > soldTo)) return false
      return true
    })
    .sort((a, b) => {
      const av = (a as any)[sortCol]
      const bv = (b as any)[sortCol]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })

  const inStock = trucks.filter(t => t.status !== 'Sold').length
  const sold = trucks.filter(t => t.status === 'Sold').length
  const pend = trucks.filter(t => t.payment_status === 'Unpaid').length
  const activeFilterCount = Object.values(colFilters).filter(Boolean).length + [boughtFrom, boughtTo, soldFrom, soldTo].filter(Boolean).length

  function clearAllFilters() {
    setColFilters({})
    setBoughtFrom(''); setBoughtTo(''); setSoldFrom(''); setSoldTo('')
  }

  const IS: React.CSSProperties = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif' }
  const LS: React.CSSProperties = { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }

  // Column definitions for the table
  type Col = { key: keyof Truck | 'allIn' | 'profit'; label: string; sortKey?: keyof Truck; filterable?: boolean }
  const cols: Col[] = [
    { key: 'status',           label: 'Status',      sortKey: 'status',         filterable: true },
    { key: 'bought_on',        label: 'Bought On',   sortKey: 'bought_on',      filterable: false },
    { key: 'vin',              label: 'VIN',         sortKey: 'vin',            filterable: false },
    { key: 'year',             label: 'Year',        sortKey: 'year',           filterable: true },
    { key: 'make',             label: 'Make',        sortKey: 'make',           filterable: true },
    { key: 'model',            label: 'Model',       sortKey: 'model',          filterable: true },
    { key: 'colour',           label: 'Colour',      sortKey: 'colour',         filterable: true },
    { key: 'kilometers',       label: 'KMs',         sortKey: 'kilometers',     filterable: false },
    { key: 'bought_from',      label: 'Bought From', sortKey: 'bought_from',    filterable: true },
    { key: 'purchase_price',   label: 'Purchase',    sortKey: 'purchase_price', filterable: false },
    { key: 'recondition_cost', label: 'Recon',       sortKey: 'recondition_cost', filterable: false },
    { key: 'allIn',            label: 'All-In',      filterable: false },
    { key: 'date_sold',        label: 'Date Sold',   sortKey: 'date_sold',      filterable: false },
    { key: 'customer',         label: 'Customer',    sortKey: 'customer',       filterable: true },
    { key: 'sold_price',       label: 'Sold Price',  sortKey: 'sold_price',     filterable: false },
    { key: 'profit',           label: 'Profit',      filterable: false },
    { key: 'payment_status',   label: 'Payment',     sortKey: 'payment_status', filterable: true },
  ]

  // Popup filter values
  const popupValues = filterPopup
    ? getUnique(trucks, filterPopup.col).filter(v => !filterSearch || v.toLowerCase().includes(filterSearch.toLowerCase()))
    : []

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .inv-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 16px; cursor: pointer; transition: all 0.18s; box-shadow: var(--shadow-card); }
        .inv-card:hover { border-color: var(--gold); transform: translateY(-1px); }
        .th-btn { display:flex; align-items:center; gap:4px; background:none; border:none; color:var(--text4); cursor:pointer; font-size:10px; font-weight:600; letter-spacing:0.08em; padding:0; white-space:nowrap; transition:color 0.15s; }
        .th-btn:hover { color: var(--text2); }
        .th-btn.active { color: var(--gold); }
        .filter-icon { font-size:9px; opacity:0.6; transition:opacity 0.15s; }
        .filter-icon:hover { opacity:1; }
        .filter-icon.on { opacity:1; color:var(--gold); }
      `}</style>

      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>FLEET</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Inventory</h1>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '9px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px var(--gold-glow)', transition: 'all 0.18s' }}>+ Add Truck</button>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)', marginBottom: 20 }} />

        {/* Stats + view toggle */}
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

          {/* Active filter count badge */}
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)', borderRadius: 99, padding: '5px 12px', fontSize: 11, color: 'var(--gold)', fontWeight: 700, cursor: 'pointer' }}>
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active × clear
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['cards', 'table'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', border: 'none', background: viewMode === m ? 'var(--gold)' : 'transparent', color: viewMode === m ? '#000' : 'var(--text3)', fontWeight: viewMode === m ? 700 : 400, transition: 'all 0.15s' }}>
                {m === 'cards' ? '▦' : '☰'}
              </button>
            ))}
          </div>
        </div>

        {/* Search + Date Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>🔍</span>
            <input style={{ ...IS, paddingLeft: 34 }} placeholder="Search VIN, Make, Model, Customer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Date filter toggle button */}
          <button onClick={() => setShowDateFilters(p => !p)} style={{ background: showDateFilters ? 'var(--gold-dim)' : 'var(--card-bg)', border: `1px solid ${showDateFilters ? 'var(--gold)' : 'var(--card-border)'}`, color: showDateFilters ? 'var(--gold)' : 'var(--text2)', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            📅 Date Filters {(boughtFrom || boughtTo || soldFrom || soldTo) ? '●' : ''}
          </button>
        </div>

        {/* Date range filter panel */}
        {showDateFilters && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Bought On range */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>BOUGHT ON</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, display: 'block' }}>From</label>
                  <input type="date" style={IS} value={boughtFrom} onChange={e => setBoughtFrom(e.target.value)} />
                </div>
                <span style={{ color: 'var(--text4)', marginTop: 18 }}>→</span>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, display: 'block' }}>To</label>
                  <input type="date" style={IS} value={boughtTo} onChange={e => setBoughtTo(e.target.value)} />
                </div>
                {(boughtFrom || boughtTo) && (
                  <button onClick={() => { setBoughtFrom(''); setBoughtTo('') }} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 16, marginTop: 18 }}>×</button>
                )}
              </div>
            </div>

            {/* Date Sold range */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>DATE SOLD</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, display: 'block' }}>From</label>
                  <input type="date" style={IS} value={soldFrom} onChange={e => setSoldFrom(e.target.value)} />
                </div>
                <span style={{ color: 'var(--text4)', marginTop: 18 }}>→</span>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, display: 'block' }}>To</label>
                  <input type="date" style={IS} value={soldTo} onChange={e => setSoldTo(e.target.value)} />
                </div>
                {(soldFrom || soldTo) && (
                  <button onClick={() => { setSoldFrom(''); setSoldTo('') }} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 16, marginTop: 18 }}>×</button>
                )}
              </div>
            </div>

            {/* Quick month shortcuts */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>QUICK SELECT — SOLD DATE</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(() => {
                  const buttons = []
                  const now = new Date()
                  for (let i = 0; i < 6; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                    const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
                    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
                    const to = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
                    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    const isActive = soldFrom === from && soldTo === to
                    buttons.push(
                      <button key={from} onClick={() => { setSoldFrom(from); setSoldTo(to) }}
                        style={{ background: isActive ? 'var(--gold)' : 'var(--hover)', border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`, color: isActive ? '#000' : 'var(--text2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: isActive ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                        {label}
                      </button>
                    )
                  }
                  return buttons
                })()}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--red)' }}>Error: {error}</div>
        ) : viewMode === 'cards' ? (

          /* ── CARD VIEW ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0
              ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--text4)' }}>No trucks found</div>
              : filtered.map(truck => {
                const allIn = (truck.purchase_price || 0) + (truck.recondition_cost || 0)
                const profit = truck.sold_price != null ? truck.sold_price - allIn : null
                const sc = statusColors[truck.status] || { bg: 'rgba(255,255,255,0.04)', color: '#888', border: 'rgba(255,255,255,0.1)' }
                return (
                  <div key={truck.id} className="inv-card" onClick={() => window.location.href = `/inventory/${truck.id}`}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                      <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                        <PhotoCell truck={truck} onUploaded={url => setTrucks(prev => prev.map(t => t.id === truck.id ? { ...t, photo_url: url } : t))} onRemoved={() => setTrucks(prev => prev.map(t => t.id === truck.id ? { ...t, photo_url: null } : t))} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truck.year} {truck.make} {truck.model}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, fontFamily: 'monospace' }}>{truck.vin}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{truck.status}</span>
                            <button onClick={e => openEdit(truck, e)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>✏️</button>
                            <button onClick={e => { e.stopPropagation(); deleteTruck(truck.id) }} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
                          </div>
                        </div>
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

          /* ── TABLE VIEW with sortable/filterable headers ── */
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Photo header */}
                    <th style={{ padding: '11px 12px', textAlign: 'left', color: 'var(--text4)', fontWeight: 600, fontSize: 10, letterSpacing: '0.08em' }}>PHOTO</th>

                    {cols.map(col => {
                      const isActive = sortCol === col.sortKey
                      return (
                        <th key={col.key} style={{ padding: '11px 12px', textAlign: 'left', whiteSpace: 'nowrap', userSelect: 'none' }}>
                          {col.sortKey ? (
                            <button className={`th-btn${isActive ? ' active' : ''}`} onClick={() => handleSort(col.sortKey!)}>
                              {col.label}
                              <span style={{ fontSize: 8, marginLeft: 2 }}>
                                {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                              </span>
                            </button>
                          ) : (
                            <span style={{ fontSize: 10, color: 'var(--text4)', fontWeight: 600, letterSpacing: '0.08em' }}>{col.label}</span>
                          )}
                        </th>
                      )
                    })}
                    <th style={{ padding: '11px 12px' }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={cols.length + 2} style={{ padding: 48, textAlign: 'center', color: 'var(--text4)' }}>No trucks found</td></tr>
                    : filtered.map(truck => {
                      const allIn = (truck.purchase_price || 0) + (truck.recondition_cost || 0)
                      const profit = truck.sold_price != null ? truck.sold_price - allIn : null
                      const sc = statusColors[truck.status] || { bg: 'rgba(255,255,255,0.04)', color: '#888', border: 'rgba(255,255,255,0.1)' }
                      return (
                        <tr key={truck.id}
                          onClick={() => window.location.href = `/inventory/${truck.id}`}
                          style={{ borderBottom: '1px solid var(--border2)', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                          <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                            <PhotoCell truck={truck}
                              onUploaded={url => setTrucks(prev => prev.map(t => t.id === truck.id ? { ...t, photo_url: url } : t))}
                              onRemoved={() => setTrucks(prev => prev.map(t => t.id === truck.id ? { ...t, photo_url: null } : t))} />
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{truck.status}</span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmt(truck.bought_on)}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text3)', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{truck.vin}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text)' }}>{truck.year || '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text)' }}>{truck.make || '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{truck.model || '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{truck.colour || '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{truck.kilometers ? Number(truck.kilometers).toLocaleString() : '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{truck.bought_from || '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>${(truck.purchase_price || 0).toLocaleString()}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>${(truck.recondition_cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>${allIn.toLocaleString()}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{truck.date_sold ? fmt(truck.date_sold) : '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{truck.customer || '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{truck.sold_price != null ? `$${truck.sold_price.toLocaleString()}` : '—'}</td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontWeight: 700, color: profit == null ? 'var(--text4)' : profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {profit == null ? '—' : `${profit < 0 ? '-' : ''}$${Math.abs(profit).toLocaleString()}`}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {truck.payment_status && truck.payment_status !== 'N/A'
                              ? <span style={{ background: truck.payment_status === 'Paid' ? 'var(--green-dim)' : 'var(--red-dim)', color: truck.payment_status === 'Paid' ? 'var(--green)' : 'var(--red)', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{truck.payment_status}</span>
                              : <span style={{ color: 'var(--text4)', fontSize: 11 }}>N/A</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={e => openEdit(truck, e)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>✏️</button>
                              <button onClick={e => { e.stopPropagation(); deleteTruck(truck.id) }} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border2)', fontSize: 12, color: 'var(--text3)' }}>
              Showing {filtered.length} of {trucks.length} trucks
              {activeFilterCount > 0 && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>· {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>}
            </div>
          </div>
        )}

        {/* ── FILTER POPUP ── */}
        {filterPopup && (
          <div ref={popupRef} style={{ position: 'fixed', left: filterPopup.x, top: filterPopup.y, zIndex: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', minWidth: 180, maxWidth: 240, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border2)' }}>
              <input
                autoFocus
                style={{ ...IS, padding: '6px 10px', fontSize: 12 }}
                placeholder={`Filter ${cols.find(c => c.sortKey === filterPopup.col)?.label}...`}
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)} />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {/* Clear option */}
              <div onClick={() => { setColFilters(p => { const n = { ...p }; delete n[filterPopup.col]; return n }); setFilterPopup(null) }}
                style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 12, color: colFilters[filterPopup.col] ? 'var(--gold)' : 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border2)', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {colFilters[filterPopup.col] ? '✕ Clear filter' : 'All values'}
              </div>
              {popupValues.length === 0
                ? <div style={{ padding: '12px 14px', color: 'var(--text4)', fontSize: 12 }}>No values found</div>
                : popupValues.map(val => (
                  <div key={val}
                    onClick={() => { setColFilters(p => ({ ...p, [filterPopup.col]: val })); setFilterPopup(null); setFilterSearch('') }}
                    style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 12, color: colFilters[filterPopup.col] === val ? 'var(--gold)' : 'var(--text)', fontWeight: colFilters[filterPopup.col] === val ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    {val}
                    {colFilters[filterPopup.col] === val && <span style={{ fontSize: 10 }}>✓</span>}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── ADD TRUCK MODAL ── */}
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(8px)' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow)' }}>
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Add New Truck</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 22 }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Status</label><select style={{ ...IS, cursor: 'pointer' }} value={newTruck.status} onChange={e => setNewTruck(p => ({ ...p, status: e.target.value }))}>{['Purchased','In Reconditioning','Ready to List','Listed','Deal Pending','Sold'].map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={LS}>Bought On</label><input type="date" style={IS} value={newTruck.bought_on} onChange={e => setNewTruck(p => ({ ...p, bought_on: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={LS}>VIN *</label><input style={IS} placeholder="17-CHARACTER VIN" value={newTruck.vin} onChange={e => setNewTruck(p => ({ ...p, vin: e.target.value }))} maxLength={17} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {([['Year','year','2020'],['Make','make','Freightliner'],['Model','model','Cascadia']] as const).map(([l,k,p]) => (
                  <div key={k}><label style={LS}>{l}</label><input style={IS} placeholder={p} value={(newTruck as any)[k]} onChange={e => setNewTruck(prev => ({ ...prev, [k]: e.target.value }))} /></div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Colour</label><input style={IS} placeholder="White" value={newTruck.colour} onChange={e => setNewTruck(p => ({ ...p, colour: e.target.value }))} /></div>
                <div><label style={LS}>KMs</label><input style={IS} type="number" placeholder="450000" value={newTruck.kilometers} onChange={e => setNewTruck(p => ({ ...p, kilometers: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={LS}>Bought From</label><input style={IS} placeholder="e.g. Lussicam Inc." value={newTruck.bought_from} onChange={e => setNewTruck(p => ({ ...p, bought_from: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Purchase Price ($)</label><input style={IS} type="number" placeholder="35000" value={newTruck.purchase_price} onChange={e => setNewTruck(p => ({ ...p, purchase_price: e.target.value }))} /></div>
                <div><label style={LS}>Recondition Cost ($)</label><input style={IS} type="number" placeholder="0" value={newTruck.recondition_cost} onChange={e => setNewTruck(p => ({ ...p, recondition_cost: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 20 }}><label style={LS}>Notes</label><textarea style={{ ...IS, height: 70, resize: 'vertical' }} placeholder="Any purchase notes..." value={newTruck.notes} onChange={e => setNewTruck(p => ({ ...p, notes: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 10, padding: '13px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button onClick={addTruck} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 10, padding: '13px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Add Truck</button>
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT TRUCK MODAL ── */}
        {editTruck && (
          <div onClick={() => setEditTruck(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(10px)', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Edit Truck</h2>
                <button onClick={() => setEditTruck(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Status</label><select style={{ ...IS, cursor: 'pointer' }} value={editForm.status || ''} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>{['Intake','Purchased','In Reconditioning','Ready to List','Listed','Deal Pending','Sold'].map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={LS}>Bought On</label><input style={IS} type="date" value={editForm.bought_on || ''} onChange={e => setEditForm(p => ({ ...p, bought_on: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={LS}>VIN</label><input style={IS} value={editForm.vin || ''} onChange={e => setEditForm(p => ({ ...p, vin: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={LS}>Year</label><input style={IS} type="number" value={editForm.year || ''} onChange={e => setEditForm(p => ({ ...p, year: e.target.value as any }))} /></div>
                <div><label style={LS}>Make</label><input style={IS} value={editForm.make || ''} onChange={e => setEditForm(p => ({ ...p, make: e.target.value }))} /></div>
                <div><label style={LS}>Model</label><input style={IS} value={editForm.model || ''} onChange={e => setEditForm(p => ({ ...p, model: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Colour</label><input style={IS} value={editForm.colour || ''} onChange={e => setEditForm(p => ({ ...p, colour: e.target.value }))} /></div>
                <div><label style={LS}>Kilometers</label><input style={IS} type="number" value={editForm.kilometers || ''} onChange={e => setEditForm(p => ({ ...p, kilometers: e.target.value as any }))} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={LS}>Bought From</label><input style={IS} value={editForm.bought_from || ''} onChange={e => setEditForm(p => ({ ...p, bought_from: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Purchase Price ($)</label><input style={IS} type="number" value={editForm.purchase_price || ''} onChange={e => setEditForm(p => ({ ...p, purchase_price: e.target.value as any }))} /></div>
                <div><label style={LS}>Recondition Cost ($)</label><input style={IS} type="number" value={editForm.recondition_cost || ''} onChange={e => setEditForm(p => ({ ...p, recondition_cost: e.target.value as any }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={LS}>Sold Price ($)</label><input style={IS} type="number" value={editForm.sold_price || ''} onChange={e => setEditForm(p => ({ ...p, sold_price: e.target.value as any }))} /></div>
                <div><label style={LS}>Date Sold</label><input style={IS} type="date" value={editForm.date_sold || ''} onChange={e => setEditForm(p => ({ ...p, date_sold: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><label style={LS}>Customer</label><input style={IS} value={editForm.customer || ''} onChange={e => setEditForm(p => ({ ...p, customer: e.target.value }))} /></div>
                <div><label style={LS}>Payment Status</label><select style={{ ...IS, cursor: 'pointer' }} value={editForm.payment_status || 'N/A'} onChange={e => setEditForm(p => ({ ...p, payment_status: e.target.value }))}>{['N/A','Paid','Unpaid'].map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div style={{ marginBottom: 22 }}><label style={LS}>Notes</label><textarea style={{ ...IS, height: 70, resize: 'vertical' }} value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditTruck(null)} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '13px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button onClick={saveEdit} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}