'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Supplier = {
  id: string
  company: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

type Truck = {
  id: string
  year: number | null
  make: string | null
  model: string | null
  vin: string
  stock_number: string | null
  bought_from: string | null
  purchase_price: number | null
  bought_on: string | null
  status: string
}

const IS: React.CSSProperties = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif', minHeight: 44 }
const LS: React.CSSProperties = { fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }

const fmt = (d: string | null) => {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function SupplierForm({ form, setForm, saving, onSave, onCancel }: {
  form: any; setForm: any; saving: boolean; onSave: () => void; onCancel: () => void
}) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={LS}>Company Name *</label><input style={IS} placeholder="Lussicam Inc." value={form.company} onChange={e => setForm((p: any) => ({ ...p, company: e.target.value }))} /></div>
        <div><label style={LS}>Contact Name</label><input style={IS} placeholder="John Smith" value={form.contact_name} onChange={e => setForm((p: any) => ({ ...p, contact_name: e.target.value }))} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={LS}>Phone</label><input style={IS} placeholder="905-555-0100" value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} /></div>
        <div><label style={LS}>Email</label><input style={IS} placeholder="info@example.com" value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} /></div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={LS}>Address</label>
        <input style={IS} placeholder="123 Truck Ave, Brampton, ON" value={form.address} onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={LS}>Notes</label>
        <textarea style={{ ...IS, height: 70, resize: 'vertical' }} placeholder="Any notes..." value={form.notes} onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, minHeight: 50 }}>Cancel</button>
        <button onClick={onSave} disabled={saving} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 50 }}>
          {saving ? 'Saving...' : 'Save Supplier'}
        </button>
      </div>
    </div>
  )
}

export default function SuppliersPage() {
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([])
  const [trucks,       setTrucks]       = useState<Truck[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [showAdd,      setShowAdd]      = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null)
  const [form,         setForm]         = useState({ company: '', contact_name: '', phone: '', email: '', address: '', notes: '' })
  const [saving,       setSaving]       = useState(false)
  const [isMobile,     setIsMobile]     = useState(false)

  useEffect(() => {
    loadAll()
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: sData }, { data: tData }] = await Promise.all([
      supabase.from('suppliers').select('*').order('company'),
      supabase.from('Inventory Data').select('id,year,make,model,vin,stock_number,bought_from,purchase_price,bought_on,status'),
    ])
    setSuppliers(sData || [])
    setTrucks(tData || [])
    setLoading(false)
  }

  async function importFromInventory() {
    const newOnes = trucks.filter(t =>
      t.bought_from &&
      !suppliers.some(s => s.company.toLowerCase().trim() === t.bought_from!.toLowerCase().trim())
    )
    if (newOnes.length === 0) return alert('All inventory suppliers are already in the system.')
    if (!confirm(`Import ${newOnes.length} new supplier${newOnes.length > 1 ? 's' : ''} from inventory?`)) return
    const toInsert = Array.from(new Map(newOnes.map(t => [t.bought_from!.toLowerCase().trim(), t])).values())
      .map(t => ({ company: t.bought_from! }))
    const { error } = await supabase.from('suppliers').insert(toInsert)
    if (error) { alert('Error: ' + error.message); return }
    loadAll()
    alert(`✅ Imported ${toInsert.length} supplier${toInsert.length > 1 ? 's' : ''}!`)
  }

  function getTrucksForSupplier(supplier: Supplier): Truck[] {
    return trucks.filter(t =>
      t.bought_from?.toLowerCase().trim() === supplier.company.toLowerCase().trim()
    )
  }

  function resetForm() {
    setForm({ company: '', contact_name: '', phone: '', email: '', address: '', notes: '' })
  }

  async function saveSupplier() {
    if (!form.company) return alert('Company name is required.')
    setSaving(true)
    const { error } = await supabase.from('suppliers').insert([{
      company: form.company, contact_name: form.contact_name || null,
      phone: form.phone || null, email: form.email || null,
      address: form.address || null, notes: form.notes || null,
    }])
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false); resetForm(); loadAll()
  }

  async function updateSupplier() {
    if (!editSupplier) return
    setSaving(true)
    const { error } = await supabase.from('suppliers').update({
      company: form.company, contact_name: form.contact_name || null,
      phone: form.phone || null, email: form.email || null,
      address: form.address || null, notes: form.notes || null,
    }).eq('id', editSupplier.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditSupplier(null); resetForm(); loadAll()
  }

  async function deleteSupplier(id: string) {
    if (!confirm('Delete this supplier?')) return
    await supabase.from('suppliers').delete().eq('id', id)
    loadAll()
  }

  function openEdit(s: Supplier) {
    setEditSupplier(s)
    setForm({ company: s.company, contact_name: s.contact_name || '', phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '' })
  }

  const filtered = suppliers.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return [s.company, s.contact_name, s.phone, s.email].some(x => x?.toLowerCase().includes(q))
  })

  const totalSpent = trucks.reduce((sum, t) => sum + (t.purchase_price || 0), 0)
  const totalTrucks = trucks.filter(t => t.bought_from).length

  return (
    <>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      <main style={{ padding: isMobile ? '16px' : '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>SOURCING</div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Suppliers</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={importFromInventory}
              style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 99, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>
              ⬇ Import from Inventory
            </button>
            <button onClick={() => { resetForm(); setShowAdd(true) }}
              style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '9px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,179,8,0.35)', minHeight: 44 }}>
              + Add Supplier
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', marginBottom: isMobile ? 14 : 20 }} />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Suppliers', value: suppliers.length, color: 'var(--text2)' },
            { label: 'Trucks Sourced',  value: totalTrucks,      color: 'var(--gold)' },
            { label: 'Total Spent',     value: `$${totalSpent.toLocaleString()}`, color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 15 }}>🔍</span>
          <input style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px 10px 36px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 44 } as React.CSSProperties}
            placeholder="Search company, contact..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text4)', fontSize: 14 }}>
            {suppliers.length === 0 ? 'No suppliers yet. Add your first one or import from inventory!' : 'No results match your search.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(s => {
              const sTrucks = getTrucksForSupplier(s)
              const spent = sTrucks.reduce((sum, t) => sum + (t.purchase_price || 0), 0)
              const isImported = !s.phone && !s.email && !s.address && !s.contact_name
              return (
                <div key={s.id}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onClick={() => setViewSupplier(s)}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--card-border)')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{s.company}</div>
                      {s.contact_name && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Contact: {s.contact_name}</div>}
                      {isImported && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <span style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>Imported</span>
                          <span style={{ fontSize: 11, color: 'var(--text4)' }}>No contact info — click Edit to add</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {s.phone && <span style={{ fontSize: 12, color: 'var(--text2)' }}>📞 {s.phone}</span>}
                        {s.email && <span style={{ fontSize: 12, color: 'var(--text2)' }}>✉️ {s.email}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        {sTrucks.length > 0 && (
                          <span style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green)', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                            {sTrucks.length} truck{sTrucks.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {spent > 0 && <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)', marginTop: 4 }}>${spent.toLocaleString()}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(s)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>✏️ Edit</button>
                        <button onClick={() => deleteSupplier(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: '5px 8px' }}>🗑</button>
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
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Add Supplier</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <SupplierForm form={form} setForm={setForm} saving={saving} onSave={saveSupplier} onCancel={() => setShowAdd(false)} />
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editSupplier && (
          <div onClick={() => setEditSupplier(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Edit Supplier</h2>
                <button onClick={() => setEditSupplier(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <SupplierForm form={form} setForm={setForm} saving={saving} onSave={updateSupplier} onCancel={() => setEditSupplier(null)} />
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {viewSupplier && (
          <div onClick={() => setViewSupplier(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              {(() => {
                const sTrucks = getTrucksForSupplier(viewSupplier)
                const spent = sTrucks.reduce((sum, t) => sum + (t.purchase_price || 0), 0)
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{viewSupplier.company}</div>
                        {viewSupplier.contact_name && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{viewSupplier.contact_name}</div>}
                      </div>
                      <button onClick={() => setViewSupplier(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {[
                        { label: 'TRUCKS BOUGHT', value: String(sTrucks.length), color: 'var(--text)' },
                        { label: 'TOTAL SPENT',   value: spent > 0 ? `$${spent.toLocaleString()}` : '—', color: 'var(--gold)' },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'var(--hover)', borderRadius: 10, padding: '12px 16px' }}>
                          <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                      <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>CONTACT INFO</div>
                      {[
                        { icon: '👤', label: 'Contact', value: viewSupplier.contact_name },
                        { icon: '📞', label: 'Phone',   value: viewSupplier.phone },
                        { icon: '✉️', label: 'Email',   value: viewSupplier.email },
                        { icon: '📍', label: 'Address', value: viewSupplier.address },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
                          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{row.icon} {row.label}</span>
                          <span style={{ fontSize: 13, color: row.value ? 'var(--text)' : 'var(--text4)', textAlign: 'right', maxWidth: '60%' }}>{row.value || '—'}</span>
                        </div>
                      ))}
                      {viewSupplier.notes && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>{viewSupplier.notes}</div>}
                    </div>

                    {sTrucks.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>TRUCKS PURCHASED FROM THIS SUPPLIER</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {sTrucks.map(t => (
                            <div key={t.id}
                              style={{ background: 'var(--hover)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                              onClick={() => window.location.href = `/inventory/${t.id}`}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {t.stock_number && <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: 'var(--gold)', background: 'var(--gold-dim)', border: '1px solid var(--gold)', borderRadius: 4, padding: '1px 6px' }}>{t.stock_number}</span>}
                                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{t.year} {t.make} {t.model}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'monospace', marginTop: 2 }}>{t.vin}</div>
                                {t.bought_on && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>{fmt(t.bought_on)}</div>}
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                {t.purchase_price && <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>${t.purchase_price.toLocaleString()}</div>}
                                <div style={{ fontSize: 11, color: t.status === 'Sold' ? 'var(--green)' : 'var(--text4)', fontWeight: 600, marginTop: 2 }}>{t.status}</div>
                                <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>→ View</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button onClick={() => { setViewSupplier(null); openEdit(viewSupplier) }} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>✏️ Edit</button>
                      <button onClick={() => setViewSupplier(null)} style={{ flex: 1, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 800 }}>Close</button>
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