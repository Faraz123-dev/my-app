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
  kilometers: number | null
  units: number | null
  asking_price: number | null
  offer_price: number | null
  towing_distance_km: number | null
  towing_rate: number | null
  towing_cost: number | null
  notes: string | null
}

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  'New':         { bg: 'var(--blue-dim)',   color: 'var(--blue)',   border: 'var(--blue)' },
  'Contacted':   { bg: 'var(--gold-dim)',   color: 'var(--gold)',   border: 'var(--gold)' },
  'Negotiating': { bg: 'var(--orange-dim)', color: 'var(--orange)', border: 'var(--orange)' },
  'Deal':        { bg: 'var(--green-dim)',  color: 'var(--green)',  border: 'var(--green)' },
  'Passed':      { bg: 'var(--hover)',      color: 'var(--text3)',  border: 'var(--border)' },
}

const STATUSES = ['New', 'Contacted', 'Negotiating', 'Deal', 'Passed']

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
  status: 'New', company: '', contact_name: '', phone: '', email: '',
  year: '', make: '', model: '', kilometers: '', units: '1',
  asking_price: '', offer_price: '',
  towing_distance_km: '', towing_rate: '3', notes: '',
}

type FormType = typeof emptyForm

const IS: React.CSSProperties = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif' }
const LS: React.CSSProperties = { fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }

// ── LEAD FORM ─────────────────────────────────────────────────────────────────
function LeadForm({ f, setF, onSubmit, onCancel, submitLabel }: {
  f: FormType
  setF: (v: FormType) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
}) {
  const dist = parseFloat(f.towing_distance_km) || null
  const rate = parseFloat(f.towing_rate) || null
  const units = parseInt(f.units) || 1
  const towing = calcTowing(dist, rate, units)
  const allIn = (parseFloat(f.offer_price) || 0) + (towing || 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Status */}
      <div style={{ marginBottom: 14 }}>
        <label style={LS}>Status</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUSES.map(s => {
            const sc = statusColors[s]
            const active = f.status === s
            return (
              <button key={s} onClick={() => setF({ ...f, status: s })}
                style={{ background: active ? sc.bg : 'var(--hover)', border: `1px solid ${active ? sc.border : 'var(--border)'}`, color: active ? sc.color : 'var(--text3)', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer' }}>
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Seller Info */}
      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>SELLER INFO</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={LS}>Company</label><input style={{ ...IS, minHeight: 44 }} placeholder="e.g. ABC Trucking" value={f.company} onChange={e => setF({ ...f, company: e.target.value })} /></div>
        <div><label style={LS}>Contact Name</label><input style={{ ...IS, minHeight: 44 }} placeholder="John Smith" value={f.contact_name} onChange={e => setF({ ...f, contact_name: e.target.value })} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <div><label style={LS}>Phone</label><input style={{ ...IS, minHeight: 44 }} placeholder="416-555-0100" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
        <div><label style={LS}>Email</label><input style={{ ...IS, minHeight: 44 }} placeholder="john@example.com" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
      </div>

      {/* Truck Info */}
      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>TRUCK INFO</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div><label style={LS}>Year</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="2019" value={f.year} onChange={e => setF({ ...f, year: e.target.value })} /></div>
        <div><label style={LS}>Make</label><input style={{ ...IS, minHeight: 44 }} placeholder="Freightliner" value={f.make} onChange={e => setF({ ...f, make: e.target.value })} /></div>
        <div><label style={LS}>Model</label><input style={{ ...IS, minHeight: 44 }} placeholder="Cascadia" value={f.model} onChange={e => setF({ ...f, model: e.target.value })} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <div><label style={LS}>Kilometers</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="450000" value={f.kilometers} onChange={e => setF({ ...f, kilometers: e.target.value })} /></div>
        <div><label style={LS}>Units</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="1" value={f.units} onChange={e => setF({ ...f, units: e.target.value })} /></div>
      </div>

      {/* Offer */}
      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>OFFER</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <div><label style={LS}>Asking Price ($)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="45000" value={f.asking_price} onChange={e => setF({ ...f, asking_price: e.target.value })} /></div>
        <div><label style={LS}>Our Offer ($)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="38000" value={f.offer_price} onChange={e => setF({ ...f, offer_price: e.target.value })} /></div>
      </div>

      {/* Towing Calculator */}
      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>🚛 TOWING CALCULATOR</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={LS}>Distance (km)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="500" value={f.towing_distance_km} onChange={e => setF({ ...f, towing_distance_km: e.target.value })} /></div>
        <div><label style={LS}>Rate ($/km)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="3" value={f.towing_rate} onChange={e => setF({ ...f, towing_rate: e.target.value })} /></div>
      </div>

      {/* Towing summary */}
      {(f.towing_distance_km || f.offer_price) && (
        <div style={{ background: 'var(--hover)', borderRadius: 10, padding: '14px 16px', marginBottom: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { l: 'TOWING COST', v: towing != null ? `$${towing.toLocaleString()}` : '—', c: towing ? 'var(--orange)' : 'var(--text4)' },
            { l: 'OFFER PRICE', v: f.offer_price ? `$${parseFloat(f.offer_price).toLocaleString()}` : '—', c: 'var(--text)' },
            { l: 'ALL-IN COST', v: allIn > 0 ? `$${allIn.toLocaleString()}` : '—', c: 'var(--gold)' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div>
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
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, minHeight: 50 }}>Cancel</button>
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
      kilometers: lead.kilometers ? String(lead.kilometers) : '',
      units: lead.units ? String(lead.units) : '1',
      asking_price: lead.asking_price ? String(lead.asking_price) : '',
      offer_price: lead.offer_price ? String(lead.offer_price) : '',
      towing_distance_km: lead.towing_distance_km ? String(lead.towing_distance_km) : '',
      towing_rate: lead.towing_rate ? String(lead.towing_rate) : '3',
      notes: lead.notes || '',
    })
  }

  async function addLead() {
    const dist = parseFloat(form.towing_distance_km) || null
    const rate = parseFloat(form.towing_rate) || null
    const units = parseInt(form.units) || 1
    const towing = calcTowing(dist, rate, units)
    const { error } = await supabase.from('leads').insert([{
      status: form.status,
      company: form.company || null,
      contact_name: form.contact_name || null,
      phone: form.phone || null,
      email: form.email || null,
      year: parseInt(form.year) || null,
      make: form.make || null,
      model: form.model || null,
      kilometers: parseInt(form.kilometers) || null,
      units,
      asking_price: parseFloat(form.asking_price) || null,
      offer_price: parseFloat(form.offer_price) || null,
      towing_distance_km: dist,
      towing_rate: rate || 3,
      towing_cost: towing,
      notes: form.notes || null,
    }])
    if (error) return alert('Error: ' + error.message)
    setShowAdd(false)
    setForm({ ...emptyForm })
    loadLeads()
  }

  async function saveLead() {
    if (!editLead) return
    const dist = parseFloat(editForm.towing_distance_km) || null
    const rate = parseFloat(editForm.towing_rate) || null
    const units = parseInt(editForm.units) || 1
    const towing = calcTowing(dist, rate, units)
    const { error } = await supabase.from('leads').update({
      status: editForm.status,
      company: editForm.company || null,
      contact_name: editForm.contact_name || null,
      phone: editForm.phone || null,
      email: editForm.email || null,
      year: parseInt(editForm.year) || null,
      make: editForm.make || null,
      model: editForm.model || null,
      kilometers: parseInt(editForm.kilometers) || null,
      units,
      asking_price: parseFloat(editForm.asking_price) || null,
      offer_price: parseFloat(editForm.offer_price) || null,
      towing_distance_km: dist,
      towing_rate: rate || 3,
      towing_cost: towing,
      notes: editForm.notes || null,
    }).eq('id', editLead.id)
    if (error) return alert('Error: ' + error.message)
    setEditLead(null)
    loadLeads()
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    loadLeads()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  const filtered = leads.filter(l => {
    if (quickFilter === 'active' && ['Deal', 'Passed'].includes(l.status)) return false
    if (quickFilter && quickFilter !== 'active' && l.status !== quickFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (![l.company, l.contact_name, l.make, l.model, l.email].some(v => v?.toLowerCase().includes(q))) return false
    }
    return true
  })

  const counts = {
    total:  leads.length,
    active: leads.filter(l => !['Deal', 'Passed'].includes(l.status)).length,
    deal:   leads.filter(l => l.status === 'Deal').length,
    passed: leads.filter(l => l.status === 'Passed').length,
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
            { label: 'Total',  value: counts.total,  color: 'var(--text2)',  filter: '' },
            { label: 'Active', value: counts.active, color: 'var(--blue)',   filter: 'active' },
            { label: 'Deal',   value: counts.deal,   color: 'var(--green)',  filter: 'Deal' },
            { label: 'Passed', value: counts.passed, color: 'var(--text3)', filter: 'Passed' },
          ].map(s => (
            <div key={s.label} onClick={() => setQuickFilter(qf => qf === s.filter ? '' : s.filter)}
              style={{ background: 'var(--card-bg)', border: `1px solid ${quickFilter === s.filter ? s.color : 'var(--card-border)'}`, borderRadius: 99, padding: '5px 12px', fontSize: 14, color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.15s' }}>
              {s.label} <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 15 }}>🔍</span>
          <input style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px 10px 36px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 44 }}
            placeholder="Search company, contact, make, model..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {STATUSES.map(s => {
            const sc = statusColors[s]
            const active = quickFilter === s
            return (
              <button key={s} onClick={() => setQuickFilter(qf => qf === s ? '' : s)}
                style={{ background: active ? sc.bg : 'var(--card-bg)', border: `1px solid ${active ? sc.border : 'var(--card-border)'}`, color: active ? sc.color : 'var(--text3)', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                {s}
              </button>
            )
          })}
          {quickFilter && <button onClick={() => setQuickFilter('')} style={{ background: 'none', border: 'none', color: 'var(--text4)', fontSize: 12, cursor: 'pointer' }}>× clear</button>}
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
              const sc = statusColors[lead.status] || statusColors['New']
              const allIn = (lead.offer_price || 0) + (lead.towing_cost || 0)
              const isExpanded = expandedId === lead.id
              return (
                <div key={lead.id} onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.18s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{lead.year} {lead.make} {lead.model || '—'}</div>
                      <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{lead.company || '—'}</div>
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
                      {lead.contact_name && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>👤 {lead.contact_name}</div>}
                      {lead.phone && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>📞 {lead.phone}</div>}
                      {lead.kilometers && <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>🚛 {lead.kilometers.toLocaleString()} km</div>}
                      {lead.towing_cost && <div style={{ fontSize: 13, color: 'var(--orange)', marginBottom: 4 }}>🚚 Towing: ${lead.towing_cost.toLocaleString()}</div>}
                      {lead.notes && <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, fontStyle: 'italic' }}>"{lead.notes}"</div>}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {STATUSES.map(s => {
                          const sc2 = statusColors[s]
                          return (
                            <button key={s} onClick={e => { e.stopPropagation(); updateStatus(lead.id, s) }}
                              style={{ background: lead.status === s ? sc2.bg : 'var(--hover)', border: `1px solid ${lead.status === s ? sc2.border : 'var(--border)'}`, color: lead.status === s ? sc2.color : 'var(--text3)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: lead.status === s ? 700 : 400, cursor: 'pointer' }}>
                              {s}
                            </button>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={e => openEdit(lead, e)} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '8px', fontSize: 13, cursor: 'pointer' }}>✏️ Edit</button>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Status', 'Company', 'Contact', 'Truck', 'KMs', 'Units', 'Asking', 'Offer', 'Towing', 'All-In', 'Date', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, fontSize: 13, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => {
                    const sc = statusColors[lead.status] || statusColors['New']
                    const allIn = (lead.offer_price || 0) + (lead.towing_cost || 0)
                    return (
                      <tr key={lead.id} className="lead-row">
                        <td style={{ padding: '12px 14px' }}>
                          <select value={lead.status} onClick={e => e.stopPropagation()}
                            onChange={e => updateStatus(lead.id, e.target.value)}
                            style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{lead.company || '—'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                          <div>{lead.contact_name || '—'}</div>
                          {lead.phone && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{lead.phone}</div>}
                        </td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--text)' }}>{lead.year} {lead.make} {lead.model}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{lead.kilometers ? lead.kilometers.toLocaleString() : '—'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text2)', textAlign: 'center' }}>{lead.units || 1}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{lead.asking_price ? `$${lead.asking_price.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--gold)', fontWeight: 700, whiteSpace: 'nowrap' }}>{lead.offer_price ? `$${lead.offer_price.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--orange)', whiteSpace: 'nowrap' }}>{lead.towing_cost ? `$${lead.towing_cost.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text)', fontWeight: 700, whiteSpace: 'nowrap' }}>{allIn > 0 ? `$${allIn.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text3)', whiteSpace: 'nowrap', fontSize: 12 }}>{fmt(lead.created_at)}</td>
                        <td style={{ padding: '12px 14px' }}>
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
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border2)', fontSize: 13, color: 'var(--text3)' }}>
              Showing {filtered.length} of {leads.length} leads
            </div>
          </div>
        )}

        {/* ADD MODAL */}
        {showAdd && (
          <div onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 600, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>New Lead</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <LeadForm f={form} setF={setForm} onSubmit={addLead} onCancel={() => setShowAdd(false)} submitLabel="Add Lead" />
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editLead && (
          <div onClick={() => setEditLead(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 600, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Edit Lead</h2>
                <button onClick={() => setEditLead(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <LeadForm f={editForm} setF={setEditForm} onSubmit={saveLead} onCancel={() => setEditLead(null)} submitLabel="Save Changes" />
            </div>
          </div>
        )}
      </main>
    </>
  )
}