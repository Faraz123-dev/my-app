'use client'

import { useState } from 'react'

type Invoice = {
  id: string; vendor: string; description: string; linkedTruck: string
  amount: number; invoiceDate: string; dueDate: string; status: 'Paid' | 'Unpaid' | 'Overdue'
}

const inputStyle = {
  width: '100%', background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8,
  padding: '10px 14px', color: '#e5e5e5', fontSize: 13, outline: 'none',
  boxSizing: 'border-box' as const, fontFamily: 'system-ui, sans-serif',
}
const labelStyle = { fontSize: 12, color: '#888', marginBottom: 6, display: 'block' as const }

const statusColor = (s: string) => {
  if (s === 'Paid') return { bg: '#0f2a1a', color: '#22c55e', border: '#166534' }
  if (s === 'Overdue') return { bg: '#2a0f0f', color: '#ef4444', border: '#7f1d1d' }
  return { bg: '#1a1a0f', color: '#EAB308', border: '#854d0e' }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All Invoices')
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [form, setForm] = useState({
    vendor: '', description: '', linkedTruck: '', amount: '',
    invoiceDate: new Date().toISOString().split('T')[0], dueDate: '',
    status: 'Unpaid' as Invoice['status'],
  })

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    const matchSearch = !q || inv.vendor.toLowerCase().includes(q) || inv.description.toLowerCase().includes(q) || inv.linkedTruck.toLowerCase().includes(q)
    return matchSearch && (filter === 'All Invoices' || inv.status === filter)
  })

  const totalAmount = invoices.reduce((s, i) => s + i.amount, 0)
  const unpaid = invoices.filter(i => i.status === 'Unpaid')
  const unpaidAmount = unpaid.reduce((s, i) => s + i.amount, 0)
  const overdue = invoices.filter(i => i.status === 'Overdue')
  const overdueAmount = overdue.reduce((s, i) => s + i.amount, 0)
  const paidAmount = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)

  const addInvoice = () => {
    if (!form.vendor || !form.amount) return
    setInvoices(prev => [{ id: Date.now().toString(), vendor: form.vendor, description: form.description, linkedTruck: form.linkedTruck, amount: parseFloat(form.amount), invoiceDate: form.invoiceDate, dueDate: form.dueDate, status: form.status }, ...prev])
    setShowModal(false)
    setForm({ vendor: '', description: '', linkedTruck: '', amount: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', status: 'Unpaid' })
  }

  return (
    <>
      <style>{`
        .inv-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
        @media (max-width: 640px) {
          .inv-stats { grid-template-columns: 1fr 1fr !important; }
          .modal-grid { grid-template-columns: 1fr !important; }
          .modal-grid-3 { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      <main style={{ padding: '16px', overflowY: 'auto', background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#fff', margin: 0 }}>Invoices</h1>
          <button onClick={() => setShowModal(true)} style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
        </div>

        {/* Stats */}
        <div className="inv-stats">
          {[
            { label: 'TOTAL', icon: '📄', main: String(invoices.length), sub: `$${totalAmount.toLocaleString()}` },
            { label: 'UNPAID', icon: '$', main: `${unpaid.length}`, sub: `$${unpaidAmount.toLocaleString()}` },
            { label: 'OVERDUE', icon: '⚠', main: `${overdue.length}`, sub: `$${overdueAmount.toLocaleString()}` },
            { label: 'PAID', icon: '✓', main: `$${paidAmount.toLocaleString()}`, sub: 'Settled' },
          ].map(card => (
            <div key={card.label} style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '12px 14px', borderBottom: '2px solid #EAB308' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: '#666', letterSpacing: '0.1em' }}>{card.label}</span>
                <span style={{ fontSize: 14, color: '#EAB308' }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#EAB308', marginBottom: 2 }}>{card.main}</div>
              <div style={{ fontSize: 11, color: '#555' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters + view toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 13 }}>🔍</span>
            <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Search vendor, truck..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }} value={filter} onChange={e => setFilter(e.target.value)}>
            {['All Invoices', 'Paid', 'Unpaid', 'Overdue'].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', background: '#161616', border: '1px solid #222', borderRadius: 6, overflow: 'hidden' }}>
            {(['cards', 'table'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '5px 10px', fontSize: 11, cursor: 'pointer', border: 'none', background: viewMode === m ? '#EAB308' : 'transparent', color: viewMode === m ? '#000' : '#666' }}>{m === 'cards' ? '▦' : '☰'}</button>
            ))}
          </div>
        </div>

        {/* Card view */}
        {viewMode === 'cards' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📥</div>
                <div style={{ fontSize: 13 }}>No invoices found.</div>
              </div>
            ) : filtered.map(inv => {
              const sc = statusColor(inv.status)
              return (
                <div key={inv.id} style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{inv.vendor}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{inv.description || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#EAB308' }}>${inv.amount.toLocaleString()}</span>
                      <button onClick={() => setInvoices(p => p.filter(i => i.id !== inv.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{inv.status}</span>
                    {inv.linkedTruck && <span style={{ fontSize: 11, color: '#777' }}>🚛 {inv.linkedTruck}</span>}
                    <span style={{ fontSize: 11, color: '#666' }}>{inv.invoiceDate}</span>
                    {inv.dueDate && <span style={{ fontSize: 11, color: inv.status === 'Overdue' ? '#ef4444' : '#666' }}>Due {inv.dueDate}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table view */
          <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #222' }}>
                    {['Vendor', 'Description', 'Linked Truck', 'Amount', 'Invoice Date', 'Due Date', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#555', fontWeight: 400, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#555' }}>No invoices found.</div>
                    </td></tr>
                  ) : filtered.map(inv => {
                    const sc = statusColor(inv.status)
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #1e1e1e' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1a1a1a'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <td style={{ padding: '10px 12px', color: '#ccc', fontWeight: 500, whiteSpace: 'nowrap' }}>{inv.vendor}</td>
                        <td style={{ padding: '10px 12px', color: '#888', whiteSpace: 'nowrap' }}>{inv.description || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#888', whiteSpace: 'nowrap' }}>{inv.linkedTruck || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#EAB308', fontWeight: 500, whiteSpace: 'nowrap' }}>${inv.amount.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', color: '#888', whiteSpace: 'nowrap' }}>{inv.invoiceDate}</td>
                        <td style={{ padding: '10px 12px', color: inv.status === 'Overdue' ? '#ef4444' : '#888', whiteSpace: 'nowrap' }}>{inv.dueDate || '—'}</td>
                        <td style={{ padding: '10px 12px' }}><span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 5, padding: '2px 8px', fontSize: 11 }}>{inv.status}</span></td>
                        <td style={{ padding: '10px 12px' }}><button onClick={() => setInvoices(p => p.filter(i => i.id !== inv.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>✕</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid #1e1e1e', fontSize: 12, color: '#555' }}>Showing {filtered.length} of {invoices.length} invoices</div>
          </div>
        )}

        {/* Add Invoice Modal */}
        {showModal && (
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>Add Invoice</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 22 }}>×</button>
              </div>
              <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>Vendor *</label><input style={inputStyle} placeholder="e.g. Ryder Truck Parts" value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} /></div>
                <div><label style={labelStyle}>Amount *</label><input style={inputStyle} type="number" placeholder="5,000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>Description</label><input style={inputStyle} placeholder="e.g. Engine repair parts" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>Linked Truck</label><input style={inputStyle} placeholder="e.g. 2020 Freightliner Cascadia" value={form.linkedTruck} onChange={e => setForm(p => ({ ...p, linkedTruck: e.target.value }))} /></div>
              <div className="modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div><label style={labelStyle}>Invoice Date</label><input style={inputStyle} type="date" value={form.invoiceDate} onChange={e => setForm(p => ({ ...p, invoiceDate: e.target.value }))} /></div>
                <div><label style={labelStyle}>Due Date</label><input style={inputStyle} type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
                <div><label style={labelStyle}>Status</label><select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Invoice['status'] }))}><option>Unpaid</option><option>Paid</option><option>Overdue</option></select></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: '#111', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 10, padding: '12px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={addInvoice} style={{ flex: 2, background: '#EAB308', border: 'none', color: '#000', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add Invoice</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}