'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PO = {
  id: string
  created_at: string
  po_number: string | null
  date: string | null
  vendor: string | null
  truck_id: string | null
  description: string | null
  amount: number | null
  tax_rate: number | null
  tax_amount: number | null
  total: number | null
  status: string
  notes: string | null
}

type Truck = {
  id: string
  stock_number: string | null
  year: number | null
  make: string | null
  model: string | null
  vin: string
}

const STATUSES = ['Draft', 'Sent', 'Received', 'Paid', 'Cancelled']

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  Draft:     { bg: 'var(--hover)',      color: 'var(--text3)',  border: 'var(--border)' },
  Sent:      { bg: 'var(--blue-dim)',   color: 'var(--blue)',   border: 'var(--blue)' },
  Received:  { bg: 'var(--gold-dim)',   color: 'var(--gold)',   border: 'var(--gold)' },
  Paid:      { bg: 'var(--green-dim)',  color: 'var(--green)',  border: 'var(--green)' },
  Cancelled: { bg: 'var(--red-dim)',    color: 'var(--red)',    border: 'var(--red)' },
}

const fmt = (d: string | null) => {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const money = (n: number | null | undefined) =>
  n != null ? `$${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'

const emptyForm = {
  po_number: '',
  date: new Date().toISOString().split('T')[0],
  vendor: '',
  truck_id: '',
  description: '',
  amount: '',
  tax_rate: '13',
  status: 'Draft',
  notes: '',
}
type FormType = typeof emptyForm

const IS: React.CSSProperties = {
  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
  borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14,
  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif',
}
const LS: React.CSSProperties = {
  fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500,
}
const TD: React.CSSProperties = {
  padding: '11px 14px', color: 'var(--text)', whiteSpace: 'nowrap', fontSize: 14,
}

function calcTax(amount: string, taxRate: string) {
  const a = parseFloat(amount) || 0
  const r = parseFloat(taxRate) || 0
  const tax = Math.round(a * (r / 100) * 100) / 100
  return { tax, total: Math.round((a + tax) * 100) / 100 }
}

function POForm({ f, setF, trucks, onSubmit, onCancel, submitLabel }: {
  f: FormType; setF: (v: FormType) => void; trucks: Truck[]
  onSubmit: () => void; onCancel: () => void; submitLabel: string
}) {
  const { tax, total } = calcTax(f.amount, f.tax_rate)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 14 }}>
        <label style={LS}>PO Number <span style={{ color: 'var(--text4)', fontWeight: 400 }}>(auto-generated if blank)</span></label>
        <input style={{ ...IS, minHeight: 44, fontFamily: 'monospace' }} placeholder="e.g. PO-000001"
          value={f.po_number} onChange={e => setF({ ...f, po_number: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={LS}>Status</label>
          <select style={{ ...IS, minHeight: 44, cursor: 'pointer' }} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={LS}>Date</label>
          <input type="date" style={{ ...IS, minHeight: 44 }} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={LS}>Vendor / Supplier</label>
        <input style={{ ...IS, minHeight: 44 }} placeholder="e.g. Lussicam Inc." value={f.vendor} onChange={e => setF({ ...f, vendor: e.target.value })} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={LS}>Linked Truck <span style={{ color: 'var(--text4)', fontWeight: 400 }}>(optional)</span></label>
        <select style={{ ...IS, minHeight: 44, cursor: 'pointer' }} value={f.truck_id} onChange={e => setF({ ...f, truck_id: e.target.value })}>
          <option value="">— No truck linked —</option>
          {trucks.map(t => (
            <option key={t.id} value={t.id}>
              {t.stock_number ? `${t.stock_number} · ` : ''}{t.year} {t.make} {t.model}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={LS}>Description</label>
        <input style={{ ...IS, minHeight: 44 }} placeholder="What is being purchased?" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
      </div>
      <div style={{ height: 1, background: 'var(--border2)', marginBottom: 14 }} />
      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 12 }}>PRICING</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={LS}>Amount ($)</label>
          <input type="number" style={{ ...IS, minHeight: 44 }} placeholder="0.00" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
        </div>
        <div>
          <label style={LS}>Tax Rate (%)</label>
          <input type="number" style={{ ...IS, minHeight: 44 }} placeholder="13" value={f.tax_rate} onChange={e => setF({ ...f, tax_rate: e.target.value })} />
        </div>
      </div>
      {(parseFloat(f.amount) > 0) && (
        <div style={{ background: 'var(--hover)', borderRadius: 10, padding: '14px 16px', marginBottom: 18, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { l: 'SUBTOTAL', v: money(parseFloat(f.amount) || 0), c: 'var(--text)' },
            { l: `HST (${f.tax_rate}%)`, v: money(tax), c: 'var(--text2)' },
            { l: 'TOTAL', v: money(total), c: 'var(--gold)' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <label style={LS}>Notes</label>
        <textarea style={{ ...IS, height: 70, resize: 'vertical' }} placeholder="Any additional notes..." value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12, padding: '14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, minHeight: 50 }}>Cancel</button>
        <button onClick={onSubmit} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 50 }}>{submitLabel}</button>
      </div>
    </div>
  )
}

export default function PurchaseOrdersPage() {
  const [pos, setPOs]                 = useState<PO[]>([])
  const [trucks, setTrucks]           = useState<Truck[]>([])
  const [loading, setLoading]         = useState(true)
  const [isMobile, setIsMobile]       = useState(false)
  const [showAdd, setShowAdd]         = useState(false)
  const [editPO, setEditPO]           = useState<PO | null>(null)
  const [form, setForm]               = useState<FormType>({ ...emptyForm })
  const [editForm, setEditForm]       = useState<FormType>({ ...emptyForm })
  const [search, setSearch]           = useState('')
  const [quickFilter, setQuickFilter] = useState('')

  useEffect(() => {
    loadAll()
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: poData }, { data: truckData }] = await Promise.all([
      supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('Inventory Data').select('id, stock_number, year, make, model, vin').order('stock_number'),
    ])
    setPOs(poData || [])
    setTrucks(truckData || [])
    setLoading(false)
  }

  async function generatePONumber(): Promise<string> {
    const { data } = await supabase
      .from('purchase_orders')
      .select('po_number')
      .not('po_number', 'is', null)
      .order('po_number', { ascending: false })
      .limit(1)
    const last = data?.[0]?.po_number
    if (last && /^PO-\d{6}$/.test(last)) {
      return `PO-${String(parseInt(last.replace('PO-', '')) + 1).padStart(6, '0')}`
    }
    const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
    return `PO-${String((count || 0) + 1).padStart(6, '0')}`
  }

  function buildPayload(f: FormType) {
    const { tax, total } = calcTax(f.amount, f.tax_rate)
    return {
      po_number: f.po_number || null,
      date: f.date || null,
      vendor: f.vendor || null,
      truck_id: f.truck_id || null,
      description: f.description || null,
      amount: parseFloat(f.amount) || 0,
      tax_rate: parseFloat(f.tax_rate) || 0,
      tax_amount: tax,
      total,
      status: f.status,
      notes: f.notes || null,
    }
  }

  async function addPO() {
    const payload = buildPayload(form)
    if (!payload.po_number) payload.po_number = await generatePONumber()
    const { error } = await supabase.from('purchase_orders').insert([payload])
    if (error) return alert('Error: ' + error.message)
    setShowAdd(false)
    setForm({ ...emptyForm })
    loadAll()
  }

  async function savePO() {
    if (!editPO) return
    const payload = buildPayload(editForm)
    const { error } = await supabase.from('purchase_orders').update(payload).eq('id', editPO.id)
    if (error) return alert('Error: ' + error.message)
    setEditPO(null)
    loadAll()
  }

  async function deletePO(id: string) {
    if (!confirm('Delete this purchase order?')) return
    await supabase.from('purchase_orders').delete().eq('id', id)
    loadAll()
  }

  function openEdit(po: PO, e: React.MouseEvent) {
    e.stopPropagation()
    setEditPO(po)
    setEditForm({
      po_number: po.po_number || '',
      date: po.date || new Date().toISOString().split('T')[0],
      vendor: po.vendor || '',
      truck_id: po.truck_id || '',
      description: po.description || '',
      amount: po.amount ? String(po.amount) : '',
      tax_rate: po.tax_rate ? String(po.tax_rate) : '13',
      status: po.status,
      notes: po.notes || '',
    })
  }

  function getTruckLabel(truckId: string | null) {
    if (!truckId) return null
    const t = trucks.find(tr => tr.id === truckId)
    if (!t) return null
    return `${t.stock_number ? t.stock_number + ' · ' : ''}${t.year} ${t.make} ${t.model}`
  }

  const filtered = pos.filter(p => {
    if (quickFilter && p.status !== quickFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (![p.po_number, p.vendor, p.description].some(v => v?.toLowerCase().includes(q))) return false
    }
    return true
  })

  const totalSpend  = pos.reduce((s, p) => s + (p.total || 0), 0)
  const unpaidTotal = pos.filter(p => p.status !== 'Paid' && p.status !== 'Cancelled').reduce((s, p) => s + (p.total || 0), 0)
  const counts = {
    total:    pos.length,
    draft:    pos.filter(p => p.status === 'Draft').length,
    sent:     pos.filter(p => p.status === 'Sent').length,
    received: pos.filter(p => p.status === 'Received').length,
    paid:     pos.filter(p => p.status === 'Paid').length,
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .po-row { border-bottom:1px solid var(--border2); transition:background 0.15s; }
        .po-row:hover { background:var(--hover); }
      `}</style>

      <main style={{ padding: isMobile ? '16px' : '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>BUYING</div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Purchase Orders</h1>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: isMobile ? '10px 18px' : '9px 20px', fontSize: isMobile ? 14 : 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,179,8,0.35)', minHeight: 44 }}>
            + New PO
          </button>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', marginBottom: isMobile ? 14 : 20 }} />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { l: 'TOTAL ORDERS',  v: String(counts.total), c: 'var(--text)' },
            { l: 'TOTAL SPEND',   v: money(totalSpend),    c: 'var(--gold)' },
            { l: 'OUTSTANDING',   v: money(unpaidTotal),   c: 'var(--orange)' },
            { l: 'PAID ORDERS',   v: String(counts.paid),  c: 'var(--green)' },
          ].map(s => (
            <div key={s.l} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>{s.l}</div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'All',      value: '',         count: counts.total,    color: 'var(--text2)' },
            { label: 'Draft',    value: 'Draft',    count: counts.draft,    color: 'var(--text3)' },
            { label: 'Sent',     value: 'Sent',     count: counts.sent,     color: 'var(--blue)' },
            { label: 'Received', value: 'Received', count: counts.received, color: 'var(--gold)' },
            { label: 'Paid',     value: 'Paid',     count: counts.paid,     color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} onClick={() => setQuickFilter(qf => qf === s.value ? '' : s.value)}
              style={{ background: 'var(--card-bg)', border: `1px solid ${quickFilter === s.value ? s.color : 'var(--card-border)'}`, borderRadius: 99, padding: '5px 12px', fontSize: 13, color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.15s' }}>
              {s.label} <span style={{ color: s.color, fontWeight: 700 }}>{s.count}</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 15 }}>🔍</span>
          <input style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px 10px 36px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 44 }}
            placeholder="Search PO#, vendor, description..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text4)', fontSize: 14 }}>
            {pos.length === 0 ? 'No purchase orders yet. Click "+ New PO" to get started.' : 'No POs match your filter.'}
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(po => {
              const sc = statusColors[po.status] || statusColors['Draft']
              const truckLabel = getTruckLabel(po.truck_id)
              return (
                <div key={po.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 800, color: 'var(--gold)', marginBottom: 2 }}>{po.po_number || '—'}</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{po.vendor || '—'}</div>
                      {po.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{po.description}</div>}
                      {truckLabel && <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 3 }}>🚛 {truckLabel}</div>}
                    </div>
                    <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{po.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                    {[
                      { l: 'SUBTOTAL', v: money(po.amount), c: 'var(--text)' },
                      { l: 'HST', v: money(po.tax_amount), c: 'var(--text2)' },
                      { l: 'TOTAL', v: money(po.total), c: 'var(--gold)' },
                    ].map(s => (
                      <div key={s.l} style={{ background: 'var(--hover)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 3, letterSpacing: '0.1em', fontWeight: 600 }}>{s.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text4)' }}>{fmt(po.date)}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={e => openEdit(po, e)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>✏️ Edit</button>
                      <button onClick={() => deletePO(po.id)} style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>🗑</button>
                    </div>
                  </div>
                </div>
              )
            })}
            <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--text4)' }}>{filtered.length} of {pos.length} orders</div>
          </div>
        ) : (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gold)', position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}><th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>PO #</th><th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>STATUS</th><th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>DATE</th><th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>VENDOR</th><th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>TRUCK</th><th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>DESCRIPTION</th><th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>SUBTOTAL</th><th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>HST</th><th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>TOTAL</th><th style={{ padding: '12px 14px' }} /></tr>
                </thead>
                <tbody>
                  {filtered.map(po => {
                    const sc = statusColors[po.status] || statusColors['Draft']
                    const truckLabel = getTruckLabel(po.truck_id)
                    return (
                      <tr key={po.id} className="po-row"><td style={{ ...TD, fontFamily: 'monospace', fontWeight: 800, color: 'var(--gold)' }}>{po.po_number || '—'}</td><td style={{ padding: '11px 14px' }}><span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>{po.status}</span></td><td style={{ ...TD, color: 'var(--text3)', fontSize: 13 }}>{fmt(po.date)}</td><td style={{ ...TD, fontWeight: 600 }}>{po.vendor || '—'}</td><td style={{ ...TD, color: 'var(--blue)', fontSize: 13 }}>{truckLabel || '—'}</td><td style={{ ...TD, color: 'var(--text2)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{po.description || '—'}</td><td style={{ ...TD, textAlign: 'right' }}>{money(po.amount)}</td><td style={{ ...TD, textAlign: 'right', color: 'var(--text3)' }}>{money(po.tax_amount)}</td><td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>{money(po.total)}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={e => openEdit(po, e)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 13, padding: 4 }}>✏️</button>
                            <button onClick={() => deletePO(po.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: 4 }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border2)', fontSize: 13, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Showing {filtered.length} of {pos.length} orders</span>
              <span style={{ fontWeight: 700, color: 'var(--gold)' }}>Filtered total: {money(filtered.reduce((s, p) => s + (p.total || 0), 0))}</span>
            </div>
          </div>
        )}

        {/* ADD MODAL */}
        {showAdd && (
          <div onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 580, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>New Purchase Order</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <POForm f={form} setF={setForm} trucks={trucks} onSubmit={addPO} onCancel={() => setShowAdd(false)} submitLabel="Create PO" />
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editPO && (
          <div onClick={() => setEditPO(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 580, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Edit Purchase Order</h2>
                  {editPO.po_number && <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--gold)', fontWeight: 700, marginTop: 4 }}>{editPO.po_number}</div>}
                </div>
                <button onClick={() => setEditPO(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <POForm f={editForm} setF={setEditForm} trucks={trucks} onSubmit={savePO} onCancel={() => setEditPO(null)} submitLabel="Save Changes" />
            </div>
          </div>
        )}
      </main>
    </>
  )
}