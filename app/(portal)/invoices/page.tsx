'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Invoice = {
  id: string; truck_id: string; vendor: string; description: string
  amount: number; status: string; date: string | null; invoice_url: string | null
  truck_year?: number | null; truck_make?: string | null; truck_model?: string | null; truck_vin?: string
}
type Truck = { id: string; year: number | null; make: string | null; model: string | null; vin: string }

const statusStyle = (s: string) => {
  if (s === 'Paid')    return { bg: 'var(--green-dim)', color: 'var(--green)' }
  if (s === 'Overdue') return { bg: 'var(--red-dim)',   color: 'var(--red)'   }
  return                      { bg: 'var(--gold-dim)',  color: 'var(--gold)'  }
}

function UploadCell({ invoice, onUploaded }: { invoice: Invoice; onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const path = `vendor_invoices/${invoice.id}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('invoices').getPublicUrl(path)
      await supabase.from('vendor_invoices').update({ invoice_url: data.publicUrl }).eq('id', invoice.id)
      onUploaded(data.publicUrl)
    }
    setUploading(false)
  }
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {invoice.invoice_url && (
        <a href={invoice.invoice_url} target="_blank" rel="noreferrer"
          style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 99, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600, textDecoration: 'none' }}>
          📄 View
        </a>
      )}
      <button onClick={() => ref.current?.click()} disabled={uploading}
        style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 99, padding: '3px 10px', fontSize: 11, cursor: uploading ? 'default' : 'pointer', fontWeight: 600 }}>
        {uploading ? '...' : invoice.invoice_url ? '🔄 Replace' : '📎 Upload'}
      </button>
      <input ref={ref} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

export default function InvoicesPage() {
  const [invoices,     setInvoices]     = useState<Invoice[]>([])
  const [trucks,       setTrucks]       = useState<Truck[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState('All')
  const [showModal,    setShowModal]    = useState(false)
  const [editInv,      setEditInv]      = useState<Invoice | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [expandedTrucks, setExpandedTrucks] = useState<Set<string>>(new Set())
  const emptyForm = { truck_id: '', vendor: '', description: '', amount: '', status: 'Unpaid', date: new Date().toISOString().split('T')[0] }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: inv }, { data: tr }] = await Promise.all([
      supabase.from('vendor_invoices').select('*').order('date', { ascending: false }),
      supabase.from('Inventory Data').select('id,year,make,model,vin').order('bought_on', { ascending: false }),
    ])
    const truckMap: Record<string, Truck> = {}
    ;(tr || []).forEach((t: Truck) => { truckMap[t.id] = t })
    const joined = (inv || []).map((i: Invoice) => ({
      ...i,
      truck_year:  truckMap[i.truck_id]?.year,
      truck_make:  truckMap[i.truck_id]?.make,
      truck_model: truckMap[i.truck_id]?.model,
      truck_vin:   truckMap[i.truck_id]?.vin,
    }))
    setInvoices(joined)
    setTrucks(tr || [])
    // expand all by default
    const ids = new Set((tr || []).map((t: Truck) => t.id))
    setExpandedTrucks(ids)
    setLoading(false)
  }

  async function saveInvoice() {
    if (!form.vendor || !form.amount) return alert('Vendor and amount are required.')
    if (!form.truck_id) return alert('Please link this invoice to a truck.')
    setSaving(true)
    const { error } = await supabase.from('vendor_invoices').insert([{
      truck_id: form.truck_id, vendor: form.vendor, description: form.description,
      amount: parseFloat(form.amount), status: form.status, date: form.date || null,
    }])
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowModal(false); setForm(emptyForm); loadAll()
  }

  async function saveEdit() {
    if (!editInv) return
    setSaving(true)
    const { error } = await supabase.from('vendor_invoices').update({
      vendor: editInv.vendor, description: editInv.description,
      amount: editInv.amount, status: editInv.status, date: editInv.date,
    }).eq('id', editInv.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setInvoices(prev => prev.map(i => i.id === editInv.id ? { ...i, ...editInv } : i))
    setEditInv(null)
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return
    await supabase.from('vendor_invoices').delete().eq('id', id)
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  async function toggleStatus(inv: Invoice) {
    const next = inv.status === 'Unpaid' ? 'Paid' : inv.status === 'Paid' ? 'Overdue' : 'Unpaid'
    await supabase.from('vendor_invoices').update({ status: next }).eq('id', inv.id)
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: next } : i))
  }

  function toggleTruck(truckId: string) {
    setExpandedTrucks(prev => {
      const next = new Set(prev)
      if (next.has(truckId)) next.delete(truckId)
      else next.add(truckId)
      return next
    })
  }

  const filtered = invoices.filter(i => {
    const q = search.toLowerCase()
    return (!q || [i.vendor, i.description, i.truck_make, i.truck_model, i.truck_vin].some(v => v?.toLowerCase().includes(q)))
      && (filter === 'All' || i.status === filter)
  })

  // Group by truck_id
  const grouped: Record<string, Invoice[]> = {}
  filtered.forEach(inv => {
    if (!grouped[inv.truck_id]) grouped[inv.truck_id] = []
    grouped[inv.truck_id].push(inv)
  })
  const groupedEntries = Object.entries(grouped)

  const totalAmt   = invoices.reduce((s, i) => s + i.amount, 0)
  const unpaidAmt  = invoices.filter(i => i.status === 'Unpaid').reduce((s, i) => s + i.amount, 0)
  const overdueAmt = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0)
  const paidAmt    = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)

  const IS: React.CSSProperties = { width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif' }
  const LS: React.CSSProperties = { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }
  const truckLabel = (t: Truck) => `${t.year || ''} ${t.make || ''} ${t.model || ''} — ${t.vin}`.trim()

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .inv-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
        @media(max-width:768px){ .inv-stats{grid-template-columns:1fr 1fr!important} }
        .inv-row:hover { background: var(--hover); }
      `}</style>

      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>FINANCE</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Vendor Invoices</h1>
          </div>
          <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '9px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,179,8,0.35)' }}>+ Add Invoice</button>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', marginBottom: 20 }} />

        {/* Stats */}
        <div className="inv-stats">
          {[
            { label: 'TOTAL INVOICES', val: String(invoices.length),          sub: `$${totalAmt.toLocaleString()} total`,                                color: 'var(--text)',  icon: '📄' },
            { label: 'UNPAID',         val: `$${unpaidAmt.toLocaleString()}`,  sub: `${invoices.filter(i=>i.status==='Unpaid').length} invoices`,          color: 'var(--gold)',  icon: '💳' },
            { label: 'OVERDUE',        val: `$${overdueAmt.toLocaleString()}`, sub: `${invoices.filter(i=>i.status==='Overdue').length} invoices`,         color: 'var(--red)',   icon: '⚠️' },
            { label: 'PAID',           val: `$${paidAmt.toLocaleString()}`,    sub: `${invoices.filter(i=>i.status==='Paid').length} settled`,             color: 'var(--green)', icon: '✅' },
          ].map(c => (
            <div key={c.label} className="gcard" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.14em', fontWeight: 700 }}>{c.label}</span>
                <span style={{ fontSize: 16 }}>{c.icon}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color, marginBottom: 3, letterSpacing: '-0.02em' }}>{c.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>🔍</span>
            <input style={{ ...IS, paddingLeft: 34 }} placeholder="Search vendor, truck, VIN..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={{ ...IS, width: 'auto', cursor: 'pointer' }} value={filter} onChange={e => setFilter(e.target.value)}>
            {['All', 'Unpaid', 'Paid', 'Overdue'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => setExpandedTrucks(new Set(Object.keys(grouped)))}
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
            Expand All
          </button>
          <button onClick={() => setExpandedTrucks(new Set())}
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
            Collapse All
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : groupedEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text4)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📥</div>
            <div>No invoices found.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groupedEntries.map(([truckId, truckInvoices]) => {
              const first = truckInvoices[0]
              const isExpanded = expandedTrucks.has(truckId)
              const truckTotal = truckInvoices.reduce((s, i) => s + i.amount, 0)
              const unpaidCount = truckInvoices.filter(i => i.status === 'Unpaid').length
              const overdueCount = truckInvoices.filter(i => i.status === 'Overdue').length
              const truckName = first.truck_make
                ? `${first.truck_year || ''} ${first.truck_make} ${first.truck_model || ''}`.trim()
                : `Truck — ${truckId.slice(0, 8)}`

              return (
                <div key={truckId} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden' }}>

                  {/* Truck header — click to expand/collapse */}
                  <div onClick={() => toggleTruck(truckId)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--border2)' : 'none', background: isExpanded ? 'var(--hover)' : 'transparent', transition: 'background 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18 }}>🚛</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{truckName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'monospace' }}>{first.truck_vin || truckId}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); window.location.href = `/inventory/${truckId}` }}
                        style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}>
                        View Truck →
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>${truckTotal.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                          {truckInvoices.length} invoice{truckInvoices.length !== 1 ? 's' : ''}
                          {unpaidCount > 0 && <span style={{ color: 'var(--orange)', marginLeft: 6 }}>· {unpaidCount} unpaid</span>}
                          {overdueCount > 0 && <span style={{ color: 'var(--red)', marginLeft: 6 }}>· {overdueCount} overdue</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 14, color: 'var(--text3)', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </div>
                  </div>

                  {/* Invoice rows */}
                  {isExpanded && (
                    <div>
                      {truckInvoices.map((inv, idx) => {
                        const sc = statusStyle(inv.status)
                        return (
                          <div key={inv.id} className="inv-row"
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: idx < truckInvoices.length - 1 ? '1px solid var(--border2)' : 'none', transition: 'background 0.15s' }}>
                            {/* Vendor + description */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{inv.vendor}</div>
                              {inv.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{inv.description}</div>}
                            </div>
                            {/* Amount */}
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
                              ${inv.amount.toLocaleString()}
                            </div>
                            {/* Date */}
                            <div style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0, minWidth: 90 }}>
                              {inv.date || '—'}
                            </div>
                            {/* Status */}
                            <button onClick={() => toggleStatus(inv)}
                              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}`, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                              title="Click to cycle">
                              {inv.status}
                            </button>
                            {/* Upload */}
                            <div style={{ flexShrink: 0 }}>
                              <UploadCell invoice={inv} onUploaded={url => setInvoices(prev => prev.map(i => i.id===inv.id ? {...i,invoice_url:url} : i))} />
                            </div>
                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button onClick={() => setEditInv(inv)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 13, padding: 4 }} onMouseEnter={e=>(e.currentTarget.style.color='var(--gold)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text4)')}>✏️</button>
                              <button onClick={() => deleteInvoice(inv.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: 4 }} onMouseEnter={e=>(e.currentTarget.style.color='var(--red)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text4)')}>🗑</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: 'var(--text4)' }}>
              {filtered.length} invoice{filtered.length !== 1 ? 's' : ''} across {groupedEntries.length} truck{groupedEntries.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* ADD MODAL */}
        {showModal && (
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(10px)', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Add Vendor Invoice</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={LS}>Linked Truck *</label>
                <select style={{ ...IS, cursor: 'pointer' }} value={form.truck_id} onChange={e => setForm(p => ({ ...p, truck_id: e.target.value }))}>
                  <option value="">— Select a truck —</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{truckLabel(t)}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Vendor *</label><input style={IS} placeholder="e.g. Ryder Parts" value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} /></div>
                <div><label style={LS}>Amount *</label><input style={IS} type="number" placeholder="5000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={LS}>Description</label><input style={IS} placeholder="e.g. Engine repair parts" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                <div><label style={LS}>Date</label><input style={IS} type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
                <div><label style={LS}>Status</label>
                  <select style={{ ...IS, cursor: 'pointer' }} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option>Unpaid</option><option>Paid</option><option>Overdue</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '13px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button onClick={saveInvoice} disabled={saving} style={{ flex: 2, background: saving ? 'var(--hover)' : 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: saving ? 'var(--text3)' : '#000', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, cursor: saving ? 'default' : 'pointer' }}>{saving ? 'Saving...' : 'Add Invoice'}</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editInv && (
          <div onClick={() => setEditInv(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(10px)', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Edit Invoice</h2>
                <button onClick={() => setEditInv(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={LS}>Vendor</label><input style={IS} value={editInv.vendor} onChange={e => setEditInv(p => p ? { ...p, vendor: e.target.value } : p)} /></div>
                <div><label style={LS}>Amount ($)</label><input style={IS} type="number" value={editInv.amount} onChange={e => setEditInv(p => p ? { ...p, amount: parseFloat(e.target.value)||0 } : p)} /></div>
              </div>
              <div style={{ marginBottom: 14 }}><label style={LS}>Description</label><input style={IS} value={editInv.description} onChange={e => setEditInv(p => p ? { ...p, description: e.target.value } : p)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                <div><label style={LS}>Date</label><input style={IS} type="date" value={editInv.date || ''} onChange={e => setEditInv(p => p ? { ...p, date: e.target.value } : p)} /></div>
                <div><label style={LS}>Status</label>
                  <select style={{ ...IS, cursor: 'pointer' }} value={editInv.status} onChange={e => setEditInv(p => p ? { ...p, status: e.target.value } : p)}>
                    <option>Unpaid</option><option>Paid</option><option>Overdue</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditInv(null)} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '13px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button onClick={saveEdit} disabled={saving} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}