'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Vendor = {
  id: string
  company: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  category: string | null
  notes: string | null
  created_at: string
}

type VendorInvoice = {
  id: string
  truck_id: string
  vendor: string
  description: string
  amount: number
  status: string
  date: string | null
}

type Truck = {
  id: string
  year: number | null
  make: string | null
  model: string | null
  vin: string
}

const IS: React.CSSProperties = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif', minHeight: 44 }
const LS: React.CSSProperties = { fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }

const CATEGORIES = ['Truck Seller', 'Parts', 'Labor', 'Towing', 'Wash', 'Inspection', 'Transport', 'Other']

const categoryColor: Record<string, string> = {
  Parts: 'var(--blue)', Labor: 'var(--orange)', Towing: 'var(--gold)',
  Wash: 'var(--green)', Inspection: 'var(--text2)', Transport: 'var(--text2)', Other: 'var(--text3)',
}

const fmt = (d: string | null) => {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// ── VENDOR FORM (outside page component to avoid hydration error) ─────────────
function VendorForm({ form, setForm, saving, onSave, onCancel }: {
  form: any; setForm: any; saving: boolean; onSave: () => void; onCancel: () => void
}) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={LS}>Company Name *</label><input style={IS} placeholder="Kalas Truck Repair" value={form.company} onChange={e => setForm((p: any) => ({ ...p, company: e.target.value }))} /></div>
        <div><label style={LS}>Contact Name</label><input style={IS} placeholder="Mike Kalas" value={form.contact_name} onChange={e => setForm((p: any) => ({ ...p, contact_name: e.target.value }))} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={LS}>Phone</label><input style={IS} placeholder="905-555-0100" value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} /></div>
        <div><label style={LS}>Email</label><input style={IS} placeholder="info@example.com" value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={LS}>Address</label><input style={IS} placeholder="456 Industrial Rd, Brampton" value={form.address} onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))} /></div>
        <div>
          <label style={LS}>Category</label>
          <select style={{ ...IS, cursor: 'pointer' }} value={form.category} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))}>
            <option value="">— Select —</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}><label style={LS}>Notes</label><textarea style={{ ...IS, height: 70, resize: 'vertical' }} placeholder="Any notes..." value={form.notes} onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))} /></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, minHeight: 50 }}>Cancel</button>
        <button onClick={onSave} disabled={saving} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 50 }}>
          {saving ? 'Saving...' : 'Save Vendor'}
        </button>
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function VendorsPage() {
  const [vendors,    setVendors]    = useState<Vendor[]>([])
  const [invoices,   setInvoices]   = useState<VendorInvoice[]>([])
  const [trucks,     setTrucks]     = useState<Truck[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('')
  const [showAdd,    setShowAdd]    = useState(false)
  const [editVendor, setEditVendor] = useState<Vendor | null>(null)
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null)
  const [form,       setForm]       = useState({ company: '', contact_name: '', phone: '', email: '', address: '', category: '', notes: '' })
  const [saving,     setSaving]     = useState(false)
  const [isMobile,   setIsMobile]   = useState(false)

  useEffect(() => {
    loadAll()
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: vData }, { data: iData }, { data: tData }] = await Promise.all([
      supabase.from('vendors').select('*').order('company'),
      supabase.from('vendor_invoices').select('*').order('date', { ascending: false }),
      supabase.from('Inventory Data').select('id,year,make,model,vin'),
    ])
    setVendors(vData || [])
    setInvoices(iData || [])
    setTrucks(tData || [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ company: '', contact_name: '', phone: '', email: '', address: '', category: '', notes: '' })
  }

  function getInvoicesForVendor(vendor: Vendor): VendorInvoice[] {
    return invoices.filter(i => i.vendor.toLowerCase().trim() === vendor.company.toLowerCase().trim())
  }

  function getTruck(truckId: string): Truck | undefined {
    return trucks.find(t => t.id === truckId)
  }

  async function saveVendor() {
    if (!form.company) return alert('Company name is required.')
    setSaving(true)
    const { error } = await supabase.from('vendors').insert([{
      company: form.company, contact_name: form.contact_name || null,
      phone: form.phone || null, email: form.email || null,
      address: form.address || null, category: form.category || null,
      notes: form.notes || null,
    }])
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false); resetForm(); loadAll()
  }

  async function updateVendor() {
    if (!editVendor) return
    setSaving(true)
    const { error } = await supabase.from('vendors').update({
      company: form.company, contact_name: form.contact_name || null,
      phone: form.phone || null, email: form.email || null,
      address: form.address || null, category: form.category || null,
      notes: form.notes || null,
    }).eq('id', editVendor.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditVendor(null); resetForm(); loadAll()
  }

  async function deleteVendor(id: string) {
    if (!confirm('Delete this vendor?')) return
    await supabase.from('vendors').delete().eq('id', id)
    loadAll()
  }

  function openEdit(v: Vendor) {
    setEditVendor(v)
    setForm({ company: v.company, contact_name: v.contact_name || '', phone: v.phone || '', email: v.email || '', address: v.address || '', category: v.category || '', notes: v.notes || '' })
  }

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q || [v.company, v.contact_name, v.phone, v.email].some(x => x?.toLowerCase().includes(q))
    const matchCat = !catFilter || v.category === catFilter
    return matchSearch && matchCat
  })

  const totalPaid   = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const totalUnpaid = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0)

  return (
    <>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      <main style={{ padding: isMobile ? '16px' : '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>PURCHASING</div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Suppliers & Vendors</h1>
          </div>
          <button onClick={() => { resetForm(); setShowAdd(true) }}
            style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '9px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,179,8,0.35)', minHeight: 44 }}>
            + Add Vendor
          </button>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', marginBottom: isMobile ? 14 : 20 }} />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Vendors',  value: vendors.length,               color: 'var(--text2)' },
            { label: 'Total Paid',     value: `$${totalPaid.toLocaleString()}`,   color: 'var(--green)' },
            { label: 'Outstanding',    value: `$${totalUnpaid.toLocaleString()}`, color: 'var(--orange)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 15 }}>🔍</span>
            <input style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px 10px 36px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 44 } as React.CSSProperties}
              placeholder="Search company, contact..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', cursor: 'pointer', minHeight: 44 } as React.CSSProperties}
            value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text4)', fontSize: 14 }}>
            {vendors.length === 0 ? 'No vendors yet. Add your first one!' : 'No results match your search.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(v => {
              const vInvoices = getInvoicesForVendor(v)
              const totalSpend = vInvoices.reduce((s, i) => s + i.amount, 0)
              const unpaid = vInvoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0)
              return (
                <div key={v.id}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onClick={() => setViewVendor(v)}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--card-border)')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{v.company}</span>
                        {v.category && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: categoryColor[v.category] || 'var(--text3)', background: 'var(--hover)', border: `1px solid ${categoryColor[v.category] || 'var(--border)'}`, borderRadius: 99, padding: '2px 8px' }}>
                            {v.category}
                          </span>
                        )}
                      </div>
                      {v.contact_name && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Contact: {v.contact_name}</div>}
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {v.phone && <span style={{ fontSize: 12, color: 'var(--text2)' }}>📞 {v.phone}</span>}
                        {v.email && <span style={{ fontSize: 12, color: 'var(--text2)' }}>✉️ {v.email}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        {vInvoices.length > 0 && <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 2 }}>{vInvoices.length} invoice{vInvoices.length !== 1 ? 's' : ''}</div>}
                        {totalSpend > 0 && <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>${totalSpend.toLocaleString()}</div>}
                        {unpaid > 0 && <div style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600 }}>Unpaid: ${unpaid.toLocaleString()}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(v)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>✏️ Edit</button>
                        <button onClick={() => deleteVendor(v.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: '5px 8px' }}>🗑</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ADD MODAL */}
        {showAdd && (
          <div onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Add Vendor</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <VendorForm form={form} setForm={setForm} saving={saving} onSave={saveVendor} onCancel={() => setShowAdd(false)} />
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editVendor && (
          <div onClick={() => setEditVendor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Edit Vendor</h2>
                <button onClick={() => setEditVendor(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <VendorForm form={form} setForm={setForm} saving={saving} onSave={updateVendor} onCancel={() => setEditVendor(null)} />
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {viewVendor && (
          <div onClick={() => setViewVendor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              {(() => {
                const vInvoices = getInvoicesForVendor(viewVendor)
                const totalSpend = vInvoices.reduce((s, i) => s + i.amount, 0)
                const unpaid = vInvoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0)
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{viewVendor.company}</div>
                        {viewVendor.category && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: categoryColor[viewVendor.category] || 'var(--text3)', background: 'var(--hover)', border: `1px solid ${categoryColor[viewVendor.category] || 'var(--border)'}`, borderRadius: 99, padding: '2px 10px', marginTop: 4, display: 'inline-block' }}>
                            {viewVendor.category}
                          </span>
                        )}
                      </div>
                      <button onClick={() => setViewVendor(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {[
                        { label: 'INVOICES',    value: String(vInvoices.length), color: 'var(--text)' },
                        { label: 'TOTAL SPEND', value: totalSpend > 0 ? `$${totalSpend.toLocaleString()}` : '—', color: 'var(--gold)' },
                        { label: 'OUTSTANDING', value: unpaid > 0 ? `$${unpaid.toLocaleString()}` : '—', color: unpaid > 0 ? 'var(--orange)' : 'var(--text4)' },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'var(--hover)', borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                      <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>CONTACT INFO</div>
                      {[
                        { icon: '👤', label: 'Contact', value: viewVendor.contact_name },
                        { icon: '📞', label: 'Phone',   value: viewVendor.phone },
                        { icon: '✉️', label: 'Email',   value: viewVendor.email },
                        { icon: '📍', label: 'Address', value: viewVendor.address },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
                          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{row.icon} {row.label}</span>
                          <span style={{ fontSize: 13, color: row.value ? 'var(--text)' : 'var(--text4)', textAlign: 'right', maxWidth: '60%' }}>{row.value || '—'}</span>
                        </div>
                      ))}
                      {viewVendor.notes && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>{viewVendor.notes}</div>}
                    </div>

                    {vInvoices.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>INVOICE HISTORY</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {vInvoices.map(inv => {
                            const truck = getTruck(inv.truck_id)
                            return (
                              <div key={inv.id}
                                style={{ background: 'var(--hover)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: truck ? 'pointer' : 'default' }}
                                onClick={() => truck && (window.location.href = `/inventory/${truck.id}`)}>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{inv.description || inv.vendor}</div>
                                  {truck && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{truck.year} {truck.make} {truck.model}</div>}
                                  {inv.date && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>{fmt(inv.date)}</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>${inv.amount.toLocaleString()}</div>
                                  <span style={{ fontSize: 10, fontWeight: 600, color: inv.status === 'Paid' ? 'var(--green)' : 'var(--orange)', background: inv.status === 'Paid' ? 'var(--green-dim)' : 'var(--orange-dim)', borderRadius: 99, padding: '1px 8px' }}>{inv.status}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button onClick={() => { setViewVendor(null); openEdit(viewVendor) }} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>✏️ Edit</button>
                      <button onClick={() => setViewVendor(null)} style={{ flex: 1, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 800 }}>Close</button>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </main>
    </>
  )
}