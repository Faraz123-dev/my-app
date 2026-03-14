'use client'

import { useState } from 'react'

type Invoice = {
  id: string; vendor: string; description: string; linkedTruck: string
  amount: number; invoiceDate: string; dueDate: string; status: 'Paid' | 'Unpaid' | 'Overdue'
}

const statusStyle = (s: string) => {
  if (s === 'Paid') return { bg: 'var(--green-dim)', color: 'var(--green)' }
  if (s === 'Overdue') return { bg: 'var(--red-dim)', color: 'var(--red)' }
  return { bg: 'var(--gold-dim)', color: 'var(--gold)' }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All Invoices')
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [form, setForm] = useState({ vendor: '', description: '', linkedTruck: '', amount: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', status: 'Unpaid' as Invoice['status'] })

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    return (!q || inv.vendor.toLowerCase().includes(q) || inv.description.toLowerCase().includes(q) || inv.linkedTruck.toLowerCase().includes(q)) && (filter === 'All Invoices' || inv.status === filter)
  })

  const totalAmt = invoices.reduce((s, i) => s + i.amount, 0)
  const unpaid = invoices.filter(i => i.status === 'Unpaid')
  const overdue = invoices.filter(i => i.status === 'Overdue')
  const paidAmt = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)

  const addInvoice = () => {
    if (!form.vendor || !form.amount) return
    setInvoices(p => [{ id: Date.now().toString(), ...form, amount: parseFloat(form.amount) }, ...p])
    setShowModal(false)
    setForm({ vendor: '', description: '', linkedTruck: '', amount: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', status: 'Unpaid' })
  }

  const IS = { width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui,sans-serif' }
  const LS = { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' as const, fontWeight: 500 }

  return (
    <>
      <style>{`
        .inv-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
        @media(max-width:640px){ .inv-stats{grid-template-columns:1fr 1fr!important} .modal-2{grid-template-columns:1fr!important} .modal-3{grid-template-columns:1fr 1fr!important} }
      `}</style>
      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>FINANCE</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Invoices</h1>
          </div>
          <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '9px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px var(--gold-glow)' }}>+ Add Invoice</button>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', marginBottom: 20 }} />

        <div className="inv-stats">
          {[
            { label: 'TOTAL', icon: '📄', main: String(invoices.length), sub: `$${totalAmt.toLocaleString()}` },
            { label: 'UNPAID', icon: '💳', main: String(unpaid.length), sub: `$${unpaid.reduce((s, i) => s + i.amount, 0).toLocaleString()}` },
            { label: 'OVERDUE', icon: '⚠️', main: String(overdue.length), sub: `$${overdue.reduce((s, i) => s + i.amount, 0).toLocaleString()}` },
            { label: 'PAID', icon: '✅', main: `$${paidAmt.toLocaleString()}`, sub: 'Settled' },
          ].map(card => (
            <div key={card.label} className="gcard" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.14em', fontWeight: 700 }}>{card.label}</span>
                <span style={{ fontSize: 16 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', marginBottom: 3, letterSpacing: '-0.02em' }}>{card.main}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>🔍</span>
            <input style={{ ...IS, paddingLeft: 34 }} placeholder="Search vendor, truck..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={{ ...IS, width: 'auto', cursor: 'pointer' }} value={filter} onChange={e => setFilter(e.target.value)}>
            {['All Invoices', 'Paid', 'Unpaid', 'Overdue'].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['cards', 'table'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', border: 'none', background: viewMode === m ? 'var(--gold)' : 'transparent', color: viewMode === m ? '#000' : 'var(--text3)', fontWeight: viewMode === m ? 700 : 400, transition: 'all 0.15s' }}>{m === 'cards' ? '▦' : '☰'}</button>
            ))}
          </div>
        </div>

        {viewMode === 'cards' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0
              ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text4)' }}><div style={{ fontSize: 32, marginBottom: 12 }}>📥</div><div style={{ fontSize: 13 }}>No invoices found.</div></div>
              : filtered.map(inv => {
                const sc = statusStyle(inv.status)
                return (
                  <div key={inv.id} className="gcard" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{inv.vendor}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{inv.description || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--gold)', letterSpacing: '-0.02em' }}>${inv.amount.toLocaleString()}</span>
                        <button onClick={() => setInvoices(p => p.filter(i => i.id !== inv.id))} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>✕</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{inv.status}</span>
                      {inv.linkedTruck && <span style={{ fontSize: 11, color: 'var(--text2)' }}>🚛 {inv.linkedTruck}</span>}
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{inv.invoiceDate}</span>
                      {inv.dueDate && <span style={{ fontSize: 11, color: inv.status === 'Overdue' ? 'var(--red)' : 'var(--text3)' }}>Due {inv.dueDate}</span>}
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Vendor', 'Description', 'Truck', 'Amount', 'Invoice Date', 'Due Date', 'Status', ''].map(h => (
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
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                          <td style={{ padding: '11px 14px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{inv.vendor}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{inv.description || '—'}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{inv.linkedTruck || '—'}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--gold)', fontWeight: 700, whiteSpace: 'nowrap' }}>${inv.amount.toLocaleString()}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{inv.invoiceDate}</td>
                          <td style={{ padding: '11px 14px', color: inv.status === 'Overdue' ? 'var(--red)' : 'var(--text3)', whiteSpace: 'nowrap' }}>{inv.dueDate || '—'}</td>
                          <td style={{ padding: '11px 14px' }}><span style={{ background: sc.bg, color: sc.color, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{inv.status}</span></td>
                          <td style={{ padding: '11px 14px' }}><button onClick={() => setInvoices(p => p.filter(i => i.id !== inv.id))} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>✕</button></td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border2)', fontSize: 12, color: 'var(--text3)' }}>Showing {filtered.length} of {invoices.length} invoices</div>
          </div>
        )}

        {showModal && (
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow)' }}>
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Add Invoice</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 22 }}>×</button>
              </div>
              <div className="modal-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={LS}>Vendor *</label><input style={IS} placeholder="e.g. Ryder Truck Parts" value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} /></div>
                <div><label style={LS}>Amount *</label><input style={IS} type="number" placeholder="5,000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={LS}>Description</label><input style={IS} placeholder="e.g. Engine repair parts" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div style={{ marginBottom: 12 }}><label style={LS}>Linked Truck</label><input style={IS} placeholder="e.g. 2020 Freightliner Cascadia" value={form.linkedTruck} onChange={e => setForm(p => ({ ...p, linkedTruck: e.target.value }))} /></div>
              <div className="modal-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div><label style={LS}>Invoice Date</label><input style={IS} type="date" value={form.invoiceDate} onChange={e => setForm(p => ({ ...p, invoiceDate: e.target.value }))} /></div>
                <div><label style={LS}>Due Date</label><input style={IS} type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
                <div><label style={LS}>Status</label><select style={{ ...IS, cursor: 'pointer' }} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Invoice['status'] }))}><option>Unpaid</option><option>Paid</option><option>Overdue</option></select></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '13px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button onClick={addInvoice} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px var(--gold-glow)' }}>Add Invoice</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}