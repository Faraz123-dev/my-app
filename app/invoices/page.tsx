'use client'

import { useState } from 'react'

type Invoice = {
  id: string
  vendor: string
  description: string
  linkedTruck: string
  amount: number
  invoiceDate: string
  dueDate: string
  status: 'Paid' | 'Unpaid' | 'Overdue'
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All Invoices')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    vendor: '', description: '', linkedTruck: '', amount: '',
    invoiceDate: new Date().toISOString().split('T')[0], dueDate: '',
    status: 'Unpaid' as Invoice['status'],
  })

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    const matchSearch = !q || inv.vendor.toLowerCase().includes(q) || inv.description.toLowerCase().includes(q) || inv.linkedTruck.toLowerCase().includes(q)
    const matchFilter = filter === 'All Invoices' || inv.status === filter
    return matchSearch && matchFilter
  })

  const totalInvoices = invoices.length
  const totalAmount = invoices.reduce((s, i) => s + i.amount, 0)
  const unpaid = invoices.filter(i => i.status === 'Unpaid')
  const unpaidAmount = unpaid.reduce((s, i) => s + i.amount, 0)
  const overdue = invoices.filter(i => i.status === 'Overdue')
  const overdueAmount = overdue.reduce((s, i) => s + i.amount, 0)
  const paid = invoices.filter(i => i.status === 'Paid')
  const paidAmount = paid.reduce((s, i) => s + i.amount, 0)

  const addInvoice = () => {
    if (!form.vendor || !form.amount) return
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      vendor: form.vendor, description: form.description,
      linkedTruck: form.linkedTruck, amount: parseFloat(form.amount),
      invoiceDate: form.invoiceDate, dueDate: form.dueDate, status: form.status,
    }
    setInvoices(prev => [newInvoice, ...prev])
    setShowModal(false)
    setForm({ vendor: '', description: '', linkedTruck: '', amount: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', status: 'Unpaid' })
  }

  const deleteInvoice = (id: string) => setInvoices(prev => prev.filter(i => i.id !== id))

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

  return (
    <main style={{ padding: '28px', overflowY: 'auto', background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: '#fff', margin: 0 }}>Invoices</h1>
        <button onClick={() => setShowModal(true)} style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Invoice</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL INVOICES', icon: '📄', main: String(totalInvoices), sub: `$${totalAmount.toLocaleString()} total` },
          { label: 'UNPAID', icon: '$', main: `${unpaid.length} · $${unpaidAmount.toLocaleString()}`, sub: 'Outstanding balance' },
          { label: 'OVERDUE', icon: '⚠', main: `${overdue.length} · $${overdueAmount.toLocaleString()}`, sub: 'Past due date' },
          { label: 'PAID', icon: '✓', main: `$${paidAmount.toLocaleString()}`, sub: 'Settled invoices' },
        ].map(card => (
          <div key={card.label} style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '18px 20px', borderBottom: '2px solid #EAB308' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: '#666', letterSpacing: '0.1em' }}>{card.label}</span>
              <span style={{ fontSize: 16, color: '#EAB308' }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#EAB308', marginBottom: 4 }}>{card.main}</div>
            <div style={{ fontSize: 12, color: '#555' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 500 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 14 }}>🔍</span>
          <input style={{ ...inputStyle, paddingLeft: 36 }} placeholder="Search vendor, description, truck..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...inputStyle, width: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
          {['All Invoices', 'Paid', 'Unpaid', 'Overdue'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #222' }}>
              {['Vendor', 'Description', 'Linked Truck', 'Amount', 'Invoice Date', 'Due Date', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#555', fontWeight: 400, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, color: '#2a2a2a', marginBottom: 12 }}>📥</div>
                <div style={{ fontSize: 13, color: '#555' }}>No invoices found.</div>
              </td></tr>
            ) : filtered.map(inv => {
              const sc = statusColor(inv.status)
              return (
                <tr key={inv.id} style={{ borderBottom: '1px solid #1e1e1e' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1a1a1a'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', color: '#ccc', fontWeight: 500 }}>{inv.vendor}</td>
                  <td style={{ padding: '12px 16px', color: '#888' }}>{inv.description || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#888' }}>{inv.linkedTruck || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#EAB308', fontWeight: 500 }}>${inv.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', color: '#888' }}>{inv.invoiceDate}</td>
                  <td style={{ padding: '12px 16px', color: inv.status === 'Overdue' ? '#ef4444' : '#888' }}>{inv.dueDate || '—'}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 5, padding: '3px 10px', fontSize: 11 }}>{inv.status}</span></td>
                  <td style={{ padding: '12px 16px' }}><button onClick={() => deleteInvoice(inv.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>✕</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1e1e1e', fontSize: 12, color: '#555' }}>Showing {filtered.length} of {invoices.length} invoices</div>
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: '28px', width: 520, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: 0 }}>Add Invoice</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label style={labelStyle}>Vendor *</label><input style={inputStyle} placeholder="e.g. Ryder Truck Parts" value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} /></div>
              <div><label style={labelStyle}>Amount *</label><input style={inputStyle} type="number" placeholder="e.g. 5,000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Description</label><input style={inputStyle} placeholder="e.g. Engine repair parts" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Linked Truck</label><input style={inputStyle} placeholder="e.g. 2020 Freightliner Cascadia" value={form.linkedTruck} onChange={e => setForm(p => ({ ...p, linkedTruck: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
              <div><label style={labelStyle}>Invoice Date</label><input style={inputStyle} type="date" value={form.invoiceDate} onChange={e => setForm(p => ({ ...p, invoiceDate: e.target.value }))} /></div>
              <div><label style={labelStyle}>Due Date</label><input style={inputStyle} type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
              <div><label style={labelStyle}>Status</label><select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Invoice['status'] }))}><option>Unpaid</option><option>Paid</option><option>Overdue</option></select></div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ background: '#111', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 10, padding: '10px 24px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={addInvoice} style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 10, padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add Invoice</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}