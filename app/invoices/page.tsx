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
  const [preview, setPreview] = useState(false)
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
        <>
          <button onClick={() => setPreview(true)} style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 99, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>📄 View</button>
          {preview && (
            <div onClick={() => setPreview(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <button onClick={() => setPreview(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer' }}>×</button>
              <img src={invoice.invoice_url!} alt="Invoice" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
            </div>
          )}
        </>
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
  const [invoices,  setInvoices]  = useState<Invoice[]>([])
  const [trucks,    setTrucks]    = useState<Truck[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editInv,   setEditInv]   = useState<Invoice | null>(null)
  const [viewMode,  setViewMode]  = useState<'cards' | 'table'>('table')
  const [saving,    setSaving]    = useState(false)
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
      truck_year: truckMap[i.truck_id]?.year,
      truck_make: truckMap[i.truck_id]?.make,
      truck_model: truckMap[i.truck_id]?.model,
      truck_vin: truckMap[i.truck_id]?.vin,
    }))
    setInvoices(joined); setTrucks(tr || [])
    setLoading(false)
  }

  async function saveInvoice() {
    if (!form.vendor || !form.amount) return alert('Vendor and amount are required.')
    if (!form.truck_id) return alert('Please link this invoice to a truck.')
    setSaving(true)
    const { error } = await supabase.from('vendor_invoices').insert([{ truck_id: form.truck_id, vendor: form.vendor, description: form.description, amount: parseFloat(form.amount), status: form.status, date: form.date || null }])
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowModal(false); setForm(emptyForm); loadAll()
  }

  async function saveEdit() {
    if (!editInv) return
    setSaving(true)
    const { error } = await supabase.from('vendor_invoices').update({ vendor: editInv.vendor, description: editInv.description, amount: editInv.amount, status: editInv.status, date: editInv.date }).eq('id', editInv.id)
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

  const filtered = invoices.filter(i => {
    const q = search.toLowerCase()
    return (!q || [i.vendor, i.description, i.truck_make, i.truck_model, i.truck_vin].some(v => v?.toLowerCase().includes(q)))
      && (filter === 'All' || i.status === filter)
  })

  const totalAmt   = invoices.reduce((s, i) => s + i.amount, 0)
  const unpaidAmt  = invoices.filter(i => i.status === 'Unpaid').reduce((s, i) => s + i.amount, 0)
  const overdueAmt = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0)
  const paidAmt    = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)

  const IS = { width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui,sans-serif' }
  const LS = { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' as const, fontWeight: 500 }
  const truckLabel = (t: Truck) => `${t.year || ''} ${t.make || ''} ${t.model || ''} — ${t.vin}`.trim()

  const ModalShell = ({ title, onClose, onSave, children }: any) => (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(10px)', padding: 20 }}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '13px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={onSave} disabled={saving} style={{ flex: 2, background: saving ? 'var(--hover)' : 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: saving ? 'var(--text3)' : '#000', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, cursor: saving ? 'default' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px var(--gold-glow)' }}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .inv-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
        @media(max-width:768px){ .inv-stats{grid-template-columns:1fr 1fr!important} }
      `}</style>
      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>FINANCE</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Vendor Invoices</h1>
          </div>
          <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '9px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px var(--gold-glow)' }}>+ Add Invoice</button>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', marginBottom: 20 }} />

        <div className="inv-stats">
          {[
            { label: 'TOTAL INVOICES', val: String(invoices.length),           sub: `$${totalAmt.toLocaleString()} total`,   color: 'var(--text)',  icon: '📄' },
            { label: 'UNPAID',         val: `$${unpaidAmt.toLocaleString()}`,   sub: `${invoices.filter(i=>i.status==='Unpaid').length} invoices`,   color: 'var(--gold)',  icon: '💳' },
            { label: 'OVERDUE',        val: `$${overdueAmt.toLocaleString()}`,  sub: `${invoices.filter(i=>i.status==='Overdue').length} invoices`,  color: 'var(--red)',   icon: '⚠️' },
            { label: 'PAID',           val: `$${paidAmt.toLocaleString()}`,     sub: `${invoices.filter(i=>i.status==='Paid').length} settled`,      color: 'var(--green)', icon: '✅' },
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

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>🔍</span>
            <input style={{ ...IS, paddingLeft: 34 }} placeholder="Search vendor, truck, VIN..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={{ ...IS, width: 'auto', cursor: 'pointer' }} value={filter} onChange={e => setFilter(e.target.value)}>
            {['All', 'Unpaid', 'Paid', 'Overdue'].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['cards', 'table'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', border: 'none', background: viewMode === m ? 'var(--gold)' : 'transparent', color: viewMode === m ? '#000' : 'var(--text3)', fontWeight: viewMode === m ? 700 : 400, transition: 'all 0.15s' }}>{m === 'cards' ? '▦' : '☰'}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : viewMode === 'cards' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0
              ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text4)' }}><div style={{ fontSize: 32, marginBottom: 12 }}>📥</div><div>No invoices found.</div></div>
              : filtered.map(inv => {
                const sc = statusStyle(inv.status)
                return (
                  <div key={inv.id} className="gcard" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{inv.vendor}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{inv.description || '—'}</div>
                        {inv.truck_make && <div onClick={() => window.location.href=`/inventory/${inv.truck_id}`} style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4, cursor: 'pointer', fontWeight: 600 }}>🚛 {inv.truck_year} {inv.truck_make} {inv.truck_model}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--gold)' }}>${inv.amount.toLocaleString()}</span>
                        <button onClick={() => setEditInv(inv)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 13 }} onMouseEnter={e=>(e.currentTarget.style.color='var(--gold)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text4)')}>✏️</button>
                        <button onClick={() => deleteInvoice(inv.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14 }} onMouseEnter={e=>(e.currentTarget.style.color='var(--red)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text4)')}>🗑</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                      <button onClick={() => toggleStatus(inv)} style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}`, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} title="Click to cycle">{inv.status}</button>
                      {inv.date && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{inv.date}</span>}
                    </div>
                    <UploadCell invoice={inv} onUploaded={url => setInvoices(prev => prev.map(i => i.id===inv.id ? {...i,invoice_url:url} : i))} />
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
                    {['Vendor','Description','Linked Truck','Amount','Date','Status','Invoice File',''].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: 'var(--text4)', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text4)' }}>No invoices found.</td></tr>
                    : filtered.map(inv => {
                      const sc = statusStyle(inv.status)
                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
                          onMouseEnter={e=>(e.currentTarget.style.background='var(--hover)')}
                          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                          <td style={{ padding: '10px 14px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{inv.vendor}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text2)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.description || '—'}</td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            {inv.truck_make
                              ? <span onClick={() => window.location.href=`/inventory/${inv.truck_id}`} style={{ color: 'var(--blue)', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>🚛 {inv.truck_year} {inv.truck_make} {inv.truck_model}</span>
                              : <span style={{ color: 'var(--text4)' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--gold)', fontWeight: 700, whiteSpace: 'nowrap' }}>${inv.amount.toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{inv.date || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <button onClick={() => toggleStatus(inv)} style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}`, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} title="Click to cycle">{inv.status}</button>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <UploadCell invoice={inv} onUploaded={url => setInvoices(prev => prev.map(i => i.id===inv.id ? {...i,invoice_url:url} : i))} />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <button onClick={() => setEditInv(inv)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 13 }} onMouseEnter={e=>(e.currentTarget.style.color='var(--gold)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text4)')}>✏️</button>
                              <button onClick={() => deleteInvoice(inv.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14 }} onMouseEnter={e=>(e.currentTarget.style.color='var(--red)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text4)')}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border2)', fontSize: 12, color: 'var(--text3)' }}>Showing {filtered.length} of {invoices.length} invoices</div>
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
                <button onClick={saveInvoice} disabled={saving} style={{ flex: 2, background: saving ? 'var(--hover)' : 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: saving ? 'var(--text3)' : '#000', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, cursor: saving ? 'default' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px var(--gold-glow)' }}>{saving ? 'Saving...' : 'Add Invoice'}</button>
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
                <button onClick={saveEdit} disabled={saving} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px var(--gold-glow)' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}