'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Customer = {
  id: string
  name: string
  company: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

type TruckPurchase = {
  id: string
  year: number | null
  make: string | null
  model: string | null
  vin: string
  sold_price: number | null
  date_sold: string | null
  status: string
  customer: string | null
}

const IS: React.CSSProperties = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif', minHeight: 44 }
const LS: React.CSSProperties = { fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }

const fmt = (d: string | null) => {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function CustomerForm({ form, setForm, saving, onSave, onCancel }: {
  form: any; setForm: any; saving: boolean; onSave: () => void; onCancel: () => void
}) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={LS}>Full Name *</label><input style={IS} placeholder="John Smith" value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} /></div>
        <div><label style={LS}>Company</label><input style={IS} placeholder="ABC Transport Inc." value={form.company} onChange={e => setForm((p: any) => ({ ...p, company: e.target.value }))} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={LS}>Phone</label><input style={IS} placeholder="416-555-0100" value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} /></div>
        <div><label style={LS}>Email</label><input style={IS} placeholder="john@example.com" value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} /></div>
      </div>
      <div style={{ marginBottom: 14 }}><label style={LS}>Address</label><input style={IS} placeholder="123 Main St, Toronto, ON" value={form.address} onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))} /></div>
      <div style={{ marginBottom: 20 }}><label style={LS}>Notes</label><textarea style={{ ...IS, height: 70, resize: 'vertical' }} placeholder="Any notes..." value={form.notes} onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))} /></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, minHeight: 50 }}>Cancel</button>
        <button onClick={onSave} disabled={saving} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 50 }}>
          {saving ? 'Saving...' : 'Save Customer'}
        </button>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const [customers,    setCustomers]    = useState<Customer[]>([])
  const [trucks,       setTrucks]       = useState<TruckPurchase[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [showAdd,      setShowAdd]      = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [form,         setForm]         = useState({ name: '', company: '', phone: '', email: '', address: '', notes: '' })
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
    const [{ data: cData }, { data: tData }] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase.from('Inventory Data').select('id,year,make,model,vin,sold_price,date_sold,status,customer').order('date_sold', { ascending: false }),
    ])
    setCustomers(cData || [])
    setTrucks(tData || [])
    setLoading(false)
  }

  async function importFromInventory() {
    const newOnes = trucks.filter(t =>
      t.customer &&
      !customers.some(c => c.name.toLowerCase().trim() === t.customer!.toLowerCase().trim())
    )
    if (newOnes.length === 0) return alert('All inventory customers are already in the system.')
    if (!confirm(`Import ${newOnes.length} new customer${newOnes.length > 1 ? 's' : ''} from inventory?`)) return
    const toInsert = Array.from(new Map(newOnes.map(t => [t.customer!.toLowerCase().trim(), t])).values())
      .map(t => ({ name: t.customer! }))
    const { error } = await supabase.from('customers').insert(toInsert)
    if (error) { alert('Error: ' + error.message); return }
    loadAll()
    alert(`✅ Imported ${toInsert.length} customer${toInsert.length > 1 ? 's' : ''}!`)
  }

  function getTrucksForCustomer(customer: Customer): TruckPurchase[] {
    return trucks.filter(t =>
      t.customer?.toLowerCase().trim() === customer.name.toLowerCase().trim()
    )
  }

  function resetForm() {
    setForm({ name: '', company: '', phone: '', email: '', address: '', notes: '' })
  }

  async function saveCustomer() {
    if (!form.name) return alert('Name is required.')
    setSaving(true)
    const { error } = await supabase.from('customers').insert([{
      name: form.name, company: form.company || null, phone: form.phone || null,
      email: form.email || null, address: form.address || null, notes: form.notes || null,
    }])
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false); resetForm(); loadAll()
  }

  async function updateCustomer() {
    if (!editCustomer) return
    setSaving(true)
    const { error } = await supabase.from('customers').update({
      name: form.name, company: form.company || null, phone: form.phone || null,
      email: form.email || null, address: form.address || null, notes: form.notes || null,
    }).eq('id', editCustomer.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditCustomer(null); resetForm(); loadAll()
  }

  async function deleteCustomer(id: string) {
    if (!confirm('Delete this customer?')) return
    await supabase.from('customers').delete().eq('id', id)
    loadAll()
  }

  function openEdit(c: Customer) {
    setEditCustomer(c)
    setForm({ name: c.name, company: c.company || '', phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' })
  }

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return [c.name, c.company, c.phone, c.email].some(v => v?.toLowerCase().includes(q))
  })

  return (
    <>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      <main style={{ padding: isMobile ? '16px' : '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>CRM</div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Customers</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={importFromInventory}
              style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 99, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>
              ⬇ Import from Inventory
            </button>
            <button onClick={() => { resetForm(); setShowAdd(true) }}
              style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '9px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,179,8,0.35)', minHeight: 44 }}>
              + Add Customer
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', marginBottom: isMobile ? 14 : 20 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Customers', value: customers.length, color: 'var(--text2)' },
            { label: 'Repeat Buyers', value: customers.filter(c => getTrucksForCustomer(c).length > 1).length, color: 'var(--gold)' },
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
            placeholder="Search name, company, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text4)', fontSize: 14 }}>
            {customers.length === 0 ? 'No customers yet. Add your first one!' : 'No results match your search.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => {
              const purchases = getTrucksForCustomer(c)
              const isImported = !c.phone && !c.email && !c.company && !c.address
              return (
                <div key={c.id}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onClick={() => setViewCustomer(c)}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--card-border)')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'var(--gold)', flexShrink: 0 }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{c.name}</div>
                        {c.company && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{c.company}</div>}
                        {isImported && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>Imported</span>
                            <span style={{ fontSize: 11, color: 'var(--text4)' }}>No contact info — click Edit to add</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
                          {c.phone && <span style={{ fontSize: 12, color: 'var(--text2)' }}>📞 {c.phone.replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3') || c.phone}</span>}                          
                          {c.email && <span style={{ fontSize: 12, color: 'var(--text2)' }}>✉️ {c.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      {purchases.length > 0 && (
                        <span style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green)', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                          {purchases.length} truck{purchases.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(c)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>✏️ Edit</button>
                        <button onClick={() => deleteCustomer(c.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: '5px 8px' }}>🗑</button>
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
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Add Customer</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <CustomerForm form={form} setForm={setForm} saving={saving} onSave={saveCustomer} onCancel={() => setShowAdd(false)} />
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editCustomer && (
          <div onClick={() => setEditCustomer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Edit Customer</h2>
                <button onClick={() => setEditCustomer(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <CustomerForm form={form} setForm={setForm} saving={saving} onSave={updateCustomer} onCancel={() => setEditCustomer(null)} />
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {viewCustomer && (
          <div onClick={() => setViewCustomer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              {(() => {
                const purchases = getTrucksForCustomer(viewCustomer)
                const totalSpent = purchases.reduce((s, t) => s + (t.sold_price || 0), 0)
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gold-dim)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--gold)' }}>
                          {viewCustomer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{viewCustomer.name}</div>
                          {viewCustomer.company && <div style={{ fontSize: 13, color: 'var(--text3)' }}>{viewCustomer.company}</div>}
                        </div>
                      </div>
                      <button onClick={() => setViewCustomer(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {[
                        { label: 'TRUCKS BOUGHT', value: String(purchases.length), color: 'var(--text)' },
                        { label: 'TOTAL SPENT', value: totalSpent > 0 ? `$${totalSpent.toLocaleString()}` : '—', color: 'var(--gold)' },
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
                        { icon: '📞', label: 'Phone', value: viewCustomer.phone ? viewCustomer.phone.replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3') || viewCustomer.phone : null },                        { icon: '✉️', label: 'Email', value: viewCustomer.email },
                        { icon: '📍', label: 'Address', value: viewCustomer.address },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
                          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{row.icon} {row.label}</span>
                          <span style={{ fontSize: 13, color: row.value ? 'var(--text)' : 'var(--text4)', textAlign: 'right', maxWidth: '60%' }}>{row.value || '—'}</span>
                        </div>
                      ))}
                      {viewCustomer.notes && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>{viewCustomer.notes}</div>}
                    </div>
                    {purchases.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>PURCHASE HISTORY</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {purchases.map(t => (
                            <div key={t.id} style={{ background: 'var(--hover)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                              onClick={() => window.location.href = `/inventory/${t.id}`}>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{t.year} {t.make} {t.model}</div>
                                <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'monospace', marginTop: 2 }}>{t.vin}</div>
                                {t.date_sold && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>{fmt(t.date_sold)}</div>}
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                {t.sold_price && <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>${t.sold_price.toLocaleString()}</div>}
                                <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>→ View</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button onClick={() => { setViewCustomer(null); openEdit(viewCustomer) }} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>✏️ Edit</button>
                      <button onClick={() => setViewCustomer(null)} style={{ flex: 1, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 800 }}>Close</button>
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