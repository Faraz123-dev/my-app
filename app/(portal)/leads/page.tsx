'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Lead = {
  id: string
  created_at: string
  status: string
  company: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  year: number | null
  make: string | null
  model: string | null
  colour: string | null
  kilometers: number | null
  units: number | null
  asking_price: number | null
  offer_price: number | null
  towing_distance_km: number | null
  towing_rate: number | null
  towing_cost: number | null
  notes: string | null
  // inventory fields
  vin: string | null
  horsepower: number | null
  ratio: string | null
  recondition_cost: number | null
  bought_on: string | null
  found_by: string | null
}

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  'Offer Sent':     { bg: 'var(--gold-dim)',  color: 'var(--gold)',  border: 'var(--gold)' },
  'Offer Accepted': { bg: 'var(--green-dim)', color: 'var(--green)', border: 'var(--green)' },
}

const STATUSES = ['Offer Sent', 'Offer Accepted']
const TEAM = ['Aamir Javaid', 'Faiz Aamir', 'Faraz Aamir', 'Umar Aamir', 'Waleed Aamir']

const fmt = (d: string | null) => {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function calcTowing(distance: number | null, rate: number | null, units: number | null): number | null {
  if (!distance || !rate) return null
  return distance * rate * (units || 1)
}

const emptyForm = {
  status: 'Offer Sent',
  // seller info
  company: '', contact_name: '', phone: '', email: '', found_by: '',
  // truck info
  year: '', make: '', model: '', colour: '', kilometers: '', units: '1',
  vin: '', horsepower: '', ratio: '',
  // offer
  asking_price: '', offer_price: '', recondition_cost: '0',
  // towing
  towing_distance_km: '', towing_rate: '3',
  // dates
  bought_on: new Date().toISOString().split('T')[0],
  notes: '',
}

type FormType = typeof emptyForm

const IS: React.CSSProperties = {
  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
  borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14,
  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif',
}
const LS: React.CSSProperties = {
  fontSize: 13, color: 'var(--text)', marginBottom: 6, display: 'block', fontWeight: 500,
}
const SEC: React.CSSProperties = {
  fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10,
}

// ── LEAD FORM ─────────────────────────────────────────────────────────────────
function LeadForm({ f, setF, onSubmit, onCancel, submitLabel }: {
  f: FormType
  setF: (v: FormType) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
}) {
  const dist   = parseFloat(f.towing_distance_km) || null
  const rate   = parseFloat(f.towing_rate) || null
  const units  = parseInt(f.units) || 1
  const towing = calcTowing(dist, rate, units)
  const allIn  = (parseFloat(f.offer_price) || 0) + (towing || 0) + (parseFloat(f.recondition_cost) || 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Status */}
      <div style={{ marginBottom: 18 }}>
        <label style={LS}>Status</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUSES.map(s => {
            const sc = statusColors[s]
            const active = f.status === s
            return (
              <button key={s} onClick={() => setF({ ...f, status: s })}
                style={{ background: active ? sc.bg : 'var(--hover)', border: `1px solid ${active ? sc.border : 'var(--border)'}`, color: active ? sc.color : 'var(--text3)', borderRadius: 99, padding: '7px 18px', fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer', flex: 1 }}>
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Seller Info */}
      <div style={SEC}>SELLER INFO</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={LS}>Company</label><input style={{ ...IS, minHeight: 44 }} placeholder="ABC Trucking" value={f.company} onChange={e => setF({ ...f, company: e.target.value })} /></div>
        <div><label style={LS}>Contact Name</label><input style={{ ...IS, minHeight: 44 }} placeholder="John Smith" value={f.contact_name} onChange={e => setF({ ...f, contact_name: e.target.value })} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={LS}>Phone</label><input style={{ ...IS, minHeight: 44 }} placeholder="416-555-0100" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
              <div><label style={LS}>Email</label><input style={{ ...IS, minHeight: 44 }} placeholder="john@example.com" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={LS}>Found By</label>
              <select style={{ ...IS, minHeight: 44, cursor: 'pointer' }} value={f.found_by} onChange={e => setF({ ...f, found_by: e.target.value })}>
                <option value="">— Select —</option>
                {TEAM.map(m => <option key={m}>{m}</option>)}
              </select>
      </div>

      {/* Truck Info */}
      <div style={SEC}>TRUCK INFO</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div><label style={LS}>Year</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="2019" value={f.year} onChange={e => setF({ ...f, year: e.target.value })} /></div>
        <div><label style={LS}>Make</label><input style={{ ...IS, minHeight: 44 }} placeholder="Freightliner" value={f.make} onChange={e => setF({ ...f, make: e.target.value })} /></div>
        <div><label style={LS}>Model</label><input style={{ ...IS, minHeight: 44 }} placeholder="Cascadia" value={f.model} onChange={e => setF({ ...f, model: e.target.value })} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={LS}>Colour</label><input style={{ ...IS, minHeight: 44 }} placeholder="White" value={f.colour} onChange={e => setF({ ...f, colour: e.target.value })} /></div>
        <div><label style={LS}>Kilometers</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="450000" value={f.kilometers} onChange={e => setF({ ...f, kilometers: e.target.value })} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div><label style={LS}>Units</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="1" value={f.units} onChange={e => setF({ ...f, units: e.target.value })} /></div>
        <div><label style={LS}>Horsepower</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="400" value={f.horsepower} onChange={e => setF({ ...f, horsepower: e.target.value })} /></div>
        <div><label style={LS}>Ratio</label><input style={{ ...IS, minHeight: 44 }} placeholder="3.55" value={f.ratio} onChange={e => setF({ ...f, ratio: e.target.value })} /></div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={LS}>VIN</label>
        <input style={{ ...IS, minHeight: 44, fontFamily: 'monospace' }} placeholder="17-character VIN (optional at this stage)" value={f.vin} onChange={e => setF({ ...f, vin: e.target.value })} maxLength={17} />
      </div>

      {/* Offer */}
      <div style={SEC}>OFFER</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={LS}>Asking Price ($)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="45000" value={f.asking_price} onChange={e => setF({ ...f, asking_price: e.target.value })} /></div>
        <div><label style={LS}>Our Offer ($)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="38000" value={f.offer_price} onChange={e => setF({ ...f, offer_price: e.target.value })} /></div>
        <div><label style={LS}>Est. Recon ($)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="0" value={f.recondition_cost} onChange={e => setF({ ...f, recondition_cost: e.target.value })} /></div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={LS}>Expected Purchase Date</label>
        <input type="date" style={{ ...IS, minHeight: 44 }} value={f.bought_on} onChange={e => setF({ ...f, bought_on: e.target.value })} />
      </div>

      {/* Towing Calculator */}
      <div style={{ ...SEC, marginTop: 8 }}>🚛 TOWING CALCULATOR</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={LS}>Distance (km)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="500" value={f.towing_distance_km} onChange={e => setF({ ...f, towing_distance_km: e.target.value })} /></div>
        <div><label style={LS}>Rate ($/km)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="3" value={f.towing_rate} onChange={e => setF({ ...f, towing_rate: e.target.value })} /></div>
      </div>

      {/* Cost Summary */}
      {(f.towing_distance_km || f.offer_price || f.recondition_cost) && (
        <div style={{ background: 'var(--hover)', borderRadius: 10, padding: '14px 16px', marginBottom: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { l: 'TOWING',     v: towing != null ? `$${towing.toLocaleString()}` : '—',          c: towing ? 'var(--orange)' : 'var(--text4)' },
            { l: 'OFFER',      v: f.offer_price ? `$${parseFloat(f.offer_price).toLocaleString()}` : '—', c: 'var(--text)' },
            { l: 'EST. RECON', v: f.recondition_cost ? `$${parseFloat(f.recondition_cost).toLocaleString()}` : '—', c: 'var(--text2)' },
            { l: 'ALL-IN',     v: allIn > 0 ? `$${allIn.toLocaleString()}` : '—',                c: 'var(--gold)' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <label style={LS}>Notes</label>
        <textarea style={{ ...IS, height: 80, resize: 'vertical' }} placeholder="Any notes about this lead..." value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12, padding: '14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, minHeight: 50 }}>Cancel</button>
        <button onClick={onSubmit} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 50 }}>{submitLabel}</button>
      </div>
    </div>
  )
}

// ── LEADS PAGE ────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads, setLeads]             = useState<Lead[]>([])
  const [loading, setLoading]         = useState(true)
  const [showAdd, setShowAdd]         = useState(false)
  const [editLead, setEditLead]       = useState<Lead | null>(null)
  const [form, setForm]               = useState<FormType>({ ...emptyForm })
  const [editForm, setEditForm]       = useState<FormType>({ ...emptyForm })
  const [isMobile, setIsMobile]       = useState(false)
  const [quickFilter, setQuickFilter] = useState('')
  const [search, setSearch]           = useState('')
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [promoting, setPromoting]     = useState<string | null>(null)

  useEffect(() => {
    loadLeads()
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function loadLeads() {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  function openEdit(lead: Lead, e: React.MouseEvent) {
    e.stopPropagation()
    setEditLead(lead)
    setEditForm({
      status: lead.status,
      company: lead.company || '',
      contact_name: lead.contact_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      year: lead.year ? String(lead.year) : '',
      make: lead.make || '',
      model: lead.model || '',
      colour: lead.colour || '',
      kilometers: lead.kilometers ? String(lead.kilometers) : '',
      units: lead.units ? String(lead.units) : '1',
      vin: lead.vin || '',
      horsepower: lead.horsepower ? String(lead.horsepower) : '',
      ratio: lead.ratio || '',
      asking_price: lead.asking_price ? String(lead.asking_price) : '',
      offer_price: lead.offer_price ? String(lead.offer_price) : '',
      recondition_cost: lead.recondition_cost ? String(lead.recondition_cost) : '0',
      towing_distance_km: lead.towing_distance_km ? String(lead.towing_distance_km) : '',
      towing_rate: lead.towing_rate ? String(lead.towing_rate) : '3',
      bought_on: lead.bought_on || new Date().toISOString().split('T')[0],
      notes: lead.notes || '',
      found_by: lead.found_by || '',
    })
  }

  function buildPayload(f: FormType) {
    const dist   = parseFloat(f.towing_distance_km) || null
    const rate   = parseFloat(f.towing_rate) || null
    const units  = parseInt(f.units) || 1
    const towing = calcTowing(dist, rate, units)
    return {
      status: f.status,
      company: f.company || null,
      contact_name: f.contact_name || null,
      phone: f.phone || null,
      email: f.email || null,
      year: parseInt(f.year) || null,
      make: f.make || null,
      model: f.model || null,
      colour: f.colour || null,
      kilometers: parseInt(f.kilometers) || null,
      units,
      vin: f.vin || null,
      horsepower: parseInt(f.horsepower) || null,
      ratio: f.ratio || null,
      asking_price: parseFloat(f.asking_price) || null,
      offer_price: parseFloat(f.offer_price) || null,
      recondition_cost: parseFloat(f.recondition_cost) || 0,
      towing_distance_km: dist,
      towing_rate: rate || 3,
      towing_cost: towing,
      bought_on: f.bought_on || null,
      notes: f.notes || null,
      found_by: f.found_by || null,
    }
  }

  async function addLead() {
    const payload = buildPayload(form)
    const { error } = await supabase.from('leads').insert([payload])
    if (error) return alert('Error: ' + error.message)
    setShowAdd(false)
    setForm({ ...emptyForm })
    loadLeads()
  }

  async function saveLead() {
    if (!editLead) return
    const payload = buildPayload(editForm)
    const { error } = await supabase.from('leads').update(payload).eq('id', editLead.id)
    if (error) return alert('Error: ' + error.message)

    // If status changed to Offer Accepted, promote to inventory
    if (payload.status === 'Offer Accepted' && editLead.status !== 'Offer Accepted') {
      await promoteToInventory(editLead.id, payload)
    }

    setEditLead(null)
    loadLeads()
  }

async function promoteToInventory(leadId: string, data: ReturnType<typeof buildPayload>) {
    setPromoting(leadId)
    const allIn = (data.offer_price || 0) + (data.towing_cost || 0)

    // Generate stock number
    const { data: snData } = await supabase
      .from('Inventory Data')
      .select('stock_number')
      .not('stock_number', 'is', null)
      .order('stock_number', { ascending: false })
      .limit(1)
    const lastSN = snData?.[0]?.stock_number
    let stockNumber: string
    if (lastSN && /^A&S-\d{6}$/.test(lastSN)) {
      stockNumber = `A&S-${String(parseInt(lastSN.replace('A&S-', '')) + 1).padStart(6, '0')}`
    } else {
      const { count } = await supabase.from('Inventory Data').select('*', { count: 'exact', head: true })
      stockNumber = `A&S-${String((count || 0) + 1).padStart(6, '0')}`
    }

    const { error } = await supabase.from('Inventory Data').insert([{
      status: 'Purchased',
      bought_on: data.bought_on || new Date().toISOString().split('T')[0],
      vin: data.vin || 'TBD-' + Date.now(),
      year: data.year,
      make: data.make,
      model: data.model,
      colour: data.colour,
      kilometers: data.kilometers,
      horsepower: data.horsepower,
      ratio: data.ratio,
      bought_from: data.company,
      purchase_price: allIn,
      recondition_cost: data.recondition_cost || 0,
      payment_status: 'N/A',
      stock_number: stockNumber,
      found_by: data.found_by || null,
      notes: [
        data.notes,
        data.towing_cost ? `Towing: $${data.towing_cost.toLocaleString()}` : null,
        data.contact_name ? `Contact: ${data.contact_name}` : null,
        data.phone ? `Phone: ${data.phone}` : null,
      ].filter(Boolean).join(' | ') || null,
    }])

    setPromoting(null)

    if (error) {
      alert('Lead saved, but failed to add to inventory: ' + error.message)
    } else {
      alert(`✅ "${data.year} ${data.make} ${data.model}" has been added to Inventory with status "Purchased"!`)
    }
  }

  async function updateStatus(id: string, status: string, lead: Lead) {
    const prev = lead.status
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads(prev2 => prev2.map(l => l.id === id ? { ...l, status } : l))

    // Auto-promote when switching to Offer Accepted
    if (status === 'Offer Accepted' && prev !== 'Offer Accepted') {
      const payload = buildPayload({
        status,
        company: lead.company || '',
        contact_name: lead.contact_name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        year: lead.year ? String(lead.year) : '',
        make: lead.make || '',
        model: lead.model || '',
        colour: lead.colour || '',
        kilometers: lead.kilometers ? String(lead.kilometers) : '',
        units: lead.units ? String(lead.units) : '1',
        vin: lead.vin || '',
        horsepower: lead.horsepower ? String(lead.horsepower) : '',
        ratio: lead.ratio || '',
        asking_price: lead.asking_price ? String(lead.asking_price) : '',
        offer_price: lead.offer_price ? String(lead.offer_price) : '',
        recondition_cost: lead.recondition_cost ? String(lead.recondition_cost) : '0',
        towing_distance_km: lead.towing_distance_km ? String(lead.towing_distance_km) : '',
        towing_rate: lead.towing_rate ? String(lead.towing_rate) : '3',
        bought_on: lead.bought_on || new Date().toISOString().split('T')[0],
        notes: lead.notes || '',
        found_by: lead.found_by || '',
      })
      await promoteToInventory(id, payload)
    }
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    loadLeads()
  }

  const filtered = leads.filter(l => {
    if (quickFilter && l.status !== quickFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (![l.company, l.contact_name, l.make, l.model, l.email, l.vin].some(v => v?.toLowerCase().includes(q))) return false
    }
    return true
  })

  const counts = {
    total:    leads.length,
    sent:     leads.filter(l => l.status === 'Offer Sent').length,
    accepted: leads.filter(l => l.status === 'Offer Accepted').length,
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .lead-row { border-bottom:1px solid var(--border2); transition:background 0.15s; }
        .lead-row:hover { background:var(--hover); }
      `}</style>

      <main style={{ padding: isMobile ? '16px' : '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>BUYING</div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Pipeline</h1>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: isMobile ? '10px 18px' : '9px 20px', fontSize: isMobile ? 14 : 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,179,8,0.35)', minHeight: 44 }}>
            + Add Lead
          </button>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', marginBottom: isMobile ? 14 : 20 }} />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Total',    value: counts.total,    color: 'var(--text)',  filter: '' },
            { label: 'Offer Sent',     value: counts.sent,     color: 'var(--gold)',   filter: 'Offer Sent' },
            { label: 'Accepted', value: counts.accepted, color: 'var(--green)',  filter: 'Offer Accepted' },
          ].map(s => (
            <div key={s.label} onClick={() => setQuickFilter(qf => qf === s.filter ? '' : s.filter)}
              style={{ background: 'var(--card-bg)', border: `1px solid ${quickFilter === s.filter ? s.color : 'var(--card-border)'}`, borderRadius: 99, padding: '5px 12px', fontSize: 14, color: 'var(--text)', cursor: 'pointer', transition: 'all 0.15s' }}>
              {s.label} <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', fontSize: 15 }}>🔍</span>
          <input style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px 10px 36px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 44 }}
            placeholder="Search company, contact, make, model, VIN..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text4)', fontSize: 14 }}>
            {leads.length === 0 ? 'No leads yet. Click "+ Add Lead" to get started.' : 'No leads match your filter.'}
          </div>
        ) : isMobile ? (

          /* ── MOBILE CARDS ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(lead => {
              const sc = statusColors[lead.status] || statusColors['Offer Sent']
              const allIn = (lead.offer_price || 0) + (lead.towing_cost || 0) + (lead.recondition_cost || 0)
              const isExpanded = expandedId === lead.id
              const isPromoting = promoting === lead.id
              return (
                <div key={lead.id} onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  style={{ background: 'var(--card-bg)', border: `1px solid ${lead.status === 'Offer Accepted' ? 'var(--green)' : 'var(--card-border)'}`, borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.18s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{lead.year} {lead.make} {lead.model || '—'}</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{lead.company || '—'}</div>
                      {lead.vin && <div style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'monospace', marginTop: 2 }}>{lead.vin}</div>}
                    </div>
                    <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{lead.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: isExpanded ? 12 : 0 }}>
                    {[
                      { l: 'ASKING', v: lead.asking_price ? `$${lead.asking_price.toLocaleString()}` : '—', c: 'var(--text)' },
                      { l: 'OFFER',  v: lead.offer_price  ? `$${lead.offer_price.toLocaleString()}`  : '—', c: 'var(--gold)' },
                      { l: 'ALL-IN', v: allIn > 0          ? `$${allIn.toLocaleString()}`             : '—', c: 'var(--orange)' },
                    ].map(s => (
                      <div key={s.l} style={{ background: 'var(--hover)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 3, letterSpacing: '0.1em', fontWeight: 600 }}>{s.l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border2)', paddingTop: 12 }}>
                      {lead.contact_name && <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>👤 {lead.contact_name}</div>}
                      {lead.phone && <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>📞 {lead.phone}</div>}
                      {lead.kilometers && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>🚛 {lead.kilometers.toLocaleString()} km · {lead.units || 1} unit{(lead.units || 1) > 1 ? 's' : ''}</div>}
                      {lead.horsepower && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>⚡ {lead.horsepower} HP {lead.ratio ? `· ${lead.ratio} ratio` : ''}</div>}
                      {lead.towing_cost && <div style={{ fontSize: 13, color: 'var(--orange)', marginBottom: 4 }}>🚚 Towing: ${lead.towing_cost.toLocaleString()}</div>}
                      {lead.recondition_cost ? <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>🔧 Est. Recon: ${lead.recondition_cost.toLocaleString()}</div> : null}
                      {lead.notes && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, fontStyle: 'italic' }}>"{lead.notes}"</div>}

                      {/* Status toggle */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        {STATUSES.map(s => {
                          const sc2 = statusColors[s]
                          return (
                            <button key={s} onClick={e => { e.stopPropagation(); updateStatus(lead.id, s, lead) }}
                              style={{ flex: 1, background: lead.status === s ? sc2.bg : 'var(--hover)', border: `1px solid ${lead.status === s ? sc2.border : 'var(--border)'}`, color: lead.status === s ? sc2.color : 'var(--text3)', borderRadius: 99, padding: '6px 10px', fontSize: 11, fontWeight: lead.status === s ? 700 : 400, cursor: 'pointer' }}>
                              {isPromoting && s === 'Offer Accepted' ? '...' : s}
                            </button>
                          )
                        })}
                      </div>

                      {lead.status === 'Offer Accepted' && (
                        <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--green)', fontWeight: 600, marginBottom: 10 }}>
                          ✅ Added to Inventory
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={e => openEdit(lead, e)} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '8px', fontSize: 13, cursor: 'pointer' }}>✏️ Edit</button>
                        <button onClick={e => { e.stopPropagation(); deleteLead(lead.id) }} style={{ flex: 1, background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 8, padding: '8px', fontSize: 13, cursor: 'pointer' }}>🗑 Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        ) : (

          /* ── TABLE VIEW ── */
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Status', 'Company', 'Contact', 'Found By', 'Truck', 'VIN', 'KMs', 'Units', 'HP', 'Ratio', 'Asking', 'Offer', 'Towing', 'Recon', 'All-In', 'Date', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => {
                    const sc = statusColors[lead.status] || statusColors['Offer Sent']
                    const allIn = (lead.offer_price || 0) + (lead.towing_cost || 0) + (lead.recondition_cost || 0)
                    const isPromoting = promoting === lead.id
                    return (
                      <tr key={lead.id} className="lead-row">
                        <td style={{ padding: '10px 14px' }}>
                          <select value={lead.status} onClick={e => e.stopPropagation()}
                            onChange={e => updateStatus(lead.id, e.target.value, lead)}
                            disabled={isPromoting}
                            style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {isPromoting && <span style={{ fontSize: 10, color: 'var(--text4)', marginLeft: 6 }}>Adding...</span>}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{lead.company || '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          <div>{lead.contact_name || '—'}</div>
                          {lead.phone && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{lead.phone}</div>}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--gold)', fontWeight: 600, whiteSpace: 'nowrap' }}>{lead.found_by || '—'}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text)' }}>{lead.year} {lead.make} {lead.model}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text2)', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>{lead.vin || '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{lead.kilometers ? lead.kilometers.toLocaleString() : '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text)', textAlign: 'center' }}>{lead.units || 1}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text)' }}>{lead.horsepower || '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text)' }}>{lead.ratio || '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{lead.asking_price ? `$${lead.asking_price.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--gold)', fontWeight: 700, whiteSpace: 'nowrap' }}>{lead.offer_price ? `$${lead.offer_price.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--orange)', whiteSpace: 'nowrap' }}>{lead.towing_cost ? `$${lead.towing_cost.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{lead.recondition_cost ? `$${lead.recondition_cost.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '10px 14px', color: lead.status === 'Offer Accepted' ? 'var(--green)' : 'var(--text)', fontWeight: 700, whiteSpace: 'nowrap' }}>{allIn > 0 ? `$${allIn.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text2)', whiteSpace: 'nowrap', fontSize: 12 }}>{fmt(lead.created_at)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={e => openEdit(lead, e)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 13, padding: 4 }}>✏️</button>
                            <button onClick={e => { e.stopPropagation(); deleteLead(lead.id) }} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: 4 }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border2)', fontSize: 13, color: 'var(--text2)' }}>
              Showing {filtered.length} of {leads.length} leads
            </div>
          </div>
        )}

        {/* ADD MODAL */}
        {showAdd && (
          <div onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 620, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>New Lead</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <LeadForm f={form} setF={setForm} onSubmit={addLead} onCancel={() => setShowAdd(false)} submitLabel="Add Lead" />
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editLead && (
          <div onClick={() => setEditLead(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 620, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Edit Lead</h2>
                <button onClick={() => setEditLead(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <LeadForm f={editForm} setF={setEditForm} onSubmit={saveLead} onCancel={() => setEditLead(null)} submitLabel="Save Changes" />
            </div>
          </div>
        )}
      </main>
    </>
  )
}