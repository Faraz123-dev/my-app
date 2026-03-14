'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string; status: string; bought_on: string | null; vin: string
  year: number | null; make: string | null; model: string | null
  colour: string | null; kilometers: number | null; bought_from: string | null
  purchase_price: number | null; recondition_cost: number | null
  date_sold: string | null; sold_price: number | null; customer: string | null
  payment_status: string | null; notes: string | null
}
type Part = { id: string; part: string; category: string; qty: number; unit_cost: number; date: string | null }
type Labor = { id: string; tech: string; hours: number; rate: number; date: string | null }
type Invoice = { id: string; vendor: string; description: string; amount: number; status: string; date: string | null }
type OtherCost = { id: string; category: string; amount: number; date: string | null; notes: string | null }
type Offer = { id: string; amount: number; date: string | null; notes: string | null; accepted: boolean }

const STATUS_PIPELINE = ['Intake', 'Purchased', 'In Reconditioning', 'Ready to List', 'Listed', 'Deal Pending', 'Sold']
const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Purchased: { bg: '#1a1a1a', color: '#888', border: '#333' },
  'In Reconditioning': { bg: '#1a2a1a', color: '#22c55e', border: '#2a4a2a' },
  'Ready to List': { bg: '#2a2a0a', color: '#EAB308', border: '#4a4a0a' },
  Listed: { bg: '#1a2a2a', color: '#38bdf8', border: '#2a4a4a' },
  'Deal Pending': { bg: '#2a1a00', color: '#f97316', border: '#4a3a00' },
  Sold: { bg: '#0a2a0a', color: '#22c55e', border: '#1a4a1a' },
  Intake: { bg: '#2a1a00', color: '#EAB308', border: '#4a3a00' },
}

const inputStyle = {
  background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8,
  padding: '9px 14px', color: '#e5e5e5', fontSize: 13, outline: 'none',
  width: '100%', boxSizing: 'border-box' as const, fontFamily: 'system-ui, sans-serif',
}
const labelStyle = { fontSize: 12, color: '#777', marginBottom: 5, display: 'block' as const }
const sectionStyle = { background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '20px 24px', marginBottom: 16 }

function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 22 }}>×</button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onSave} style={{ flex: 2, background: '#EAB308', border: 'none', color: '#000', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default function TruckDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [truck, setTruck] = useState<Truck | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [labors, setLabors] = useState<Labor[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [otherCosts, setOtherCosts] = useState<OtherCost[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'listings' | 'docs'>('overview')
  const [editingDetails, setEditingDetails] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [editingSale, setEditingSale] = useState(false)
  const [editingListing, setEditingListing] = useState(false)
  const [showPartModal, setShowPartModal] = useState(false)
  const [showLaborModal, setShowLaborModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showCostModal, setShowCostModal] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [newPart, setNewPart] = useState({ part: '', category: '', qty: '1', unit_cost: '', date: '' })
  const [newLabor, setNewLabor] = useState({ tech: '', hours: '', rate: '', date: '' })
  const [newInvoice, setNewInvoice] = useState({ vendor: '', description: '', amount: '', status: 'Unpaid', date: '' })
  const [newCost, setNewCost] = useState({ category: '', amount: '', date: '', notes: '' })
  const [newOffer, setNewOffer] = useState({ amount: '', date: '', notes: '', accepted: false })
  const [detailsForm, setDetailsForm] = useState<Partial<Truck>>({})
  const [notesForm, setNotesForm] = useState({ notes: '' })
  const [saleForm, setSaleForm] = useState({ sold_price: '', date_sold: '', customer: '', payment_status: 'N/A' })
  const [listingForm, setListingForm] = useState({ listing_platform: '', listing_link: '', listing_date: '', asking_price: '' })
  const [listingData, setListingData] = useState({ listing_platform: '', listing_link: '', listing_date: '', asking_price: '' })

  useEffect(() => { if (id) fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)
    const [{ data: t }, { data: p }, { data: l }, { data: i }, { data: o }, { data: of }] = await Promise.all([
      supabase.from('Inventory Data').select('*').eq('id', id).single(),
      supabase.from('parts').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('labor').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('vendor_invoices').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('other_costs').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('offers').select('*').eq('truck_id', id).order('created_at'),
    ])
    if (t) {
      setTruck(t)
      setDetailsForm({ colour: t.colour, kilometers: t.kilometers, bought_from: t.bought_from })
      setNotesForm({ notes: t.notes || '' })
      setSaleForm({ sold_price: t.sold_price?.toString() || '', date_sold: t.date_sold || '', customer: t.customer || '', payment_status: t.payment_status || 'N/A' })
    }
    setParts(p || [])
    setLabors(l || [])
    setInvoices(i || [])
    setOtherCosts(o || [])
    setOffers(of || [])
    setLoading(false)
  }

  async function updateStatus(status: string) {
    await supabase.from('Inventory Data').update({ status }).eq('id', id)
    setTruck(prev => prev ? { ...prev, status } : prev)
  }

  async function saveDetails() {
    await supabase.from('Inventory Data').update(detailsForm).eq('id', id)
    setTruck(prev => prev ? { ...prev, ...detailsForm } : prev)
    setEditingDetails(false)
  }

  async function saveNotes() {
    await supabase.from('Inventory Data').update({ notes: notesForm.notes }).eq('id', id)
    setTruck(prev => prev ? { ...prev, notes: notesForm.notes } : prev)
    setEditingNotes(false)
  }

  async function saveSale() {
    const update = {
      sold_price: parseFloat(saleForm.sold_price) || null,
      date_sold: saleForm.date_sold || null,
      customer: saleForm.customer || null,
      payment_status: saleForm.payment_status,
      status: saleForm.sold_price ? 'Sold' : (truck?.status ?? 'Purchased'),
    }
    await supabase.from('Inventory Data').update(update).eq('id', id)
    setTruck(prev => prev ? { ...prev, ...update } : prev)
    setEditingSale(false)
  }

  async function deleteTruck() {
    if (!confirm('Delete this truck permanently?')) return
    await supabase.from('Inventory Data').delete().eq('id', id)
    router.push('/inventory')
  }

  async function addPart() {
    await supabase.from('parts').insert([{ truck_id: id, part: newPart.part, category: newPart.category, qty: parseFloat(newPart.qty) || 1, unit_cost: parseFloat(newPart.unit_cost) || 0, date: newPart.date || null }])
    setShowPartModal(false)
    setNewPart({ part: '', category: '', qty: '1', unit_cost: '', date: '' })
    fetchAll()
  }

  async function addLabor() {
    await supabase.from('labor').insert([{ truck_id: id, tech: newLabor.tech, hours: parseFloat(newLabor.hours) || 0, rate: parseFloat(newLabor.rate) || 0, date: newLabor.date || null }])
    setShowLaborModal(false)
    setNewLabor({ tech: '', hours: '', rate: '', date: '' })
    fetchAll()
  }

  async function addInvoice() {
    await supabase.from('vendor_invoices').insert([{ truck_id: id, vendor: newInvoice.vendor, description: newInvoice.description, amount: parseFloat(newInvoice.amount) || 0, status: newInvoice.status, date: newInvoice.date || null }])
    setShowInvoiceModal(false)
    setNewInvoice({ vendor: '', description: '', amount: '', status: 'Unpaid', date: '' })
    fetchAll()
  }

  async function addCost() {
    await supabase.from('other_costs').insert([{ truck_id: id, category: newCost.category, amount: parseFloat(newCost.amount) || 0, date: newCost.date || null, notes: newCost.notes || null }])
    setShowCostModal(false)
    setNewCost({ category: '', amount: '', date: '', notes: '' })
    fetchAll()
  }

  async function addOffer() {
    await supabase.from('offers').insert([{ truck_id: id, amount: parseFloat(newOffer.amount) || 0, date: newOffer.date || null, notes: newOffer.notes || null, accepted: newOffer.accepted }])
    setShowOfferModal(false)
    setNewOffer({ amount: '', date: '', notes: '', accepted: false })
    fetchAll()
  }

  async function deleteRow(table: string, rowId: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from(table).delete().eq('id', rowId)
    fetchAll()
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#555' }}>Loading...</div>
  if (!truck) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#ef4444' }}>Truck not found</div>

  const partsTotal = parts.reduce((s, p) => s + p.qty * p.unit_cost, 0)
  const laborTotal = labors.reduce((s, l) => s + l.hours * l.rate, 0)
  const invoiceTotal = invoices.reduce((s, i) => s + i.amount, 0)
  const otherTotal = otherCosts.reduce((s, o) => s + o.amount, 0)
  const reconTotal = partsTotal + laborTotal + invoiceTotal + otherTotal
  const allInCost = (truck.purchase_price || 0) + reconTotal
  const profit = truck.sold_price != null ? truck.sold_price - allInCost : null
  const daysInInventory = truck.bought_on ? Math.floor((Date.now() - new Date(truck.bought_on).getTime()) / 86400000) : null
  const agingLabel = daysInInventory == null ? '' : daysInInventory <= 15 ? '0–15' : daysInInventory <= 30 ? '16–30' : daysInInventory <= 60 ? '31–60' : '60+'
  const currentStepIndex = STATUS_PIPELINE.indexOf(truck.status)

  return (
    <main style={{ padding: '28px', overflowY: 'auto', background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>

      {/* Truck header */}
      <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => router.push('/inventory')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>{truck.year} {truck.make} {truck.model}</h1>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>VIN: {truck.vin}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select value={truck.status} onChange={e => updateStatus(e.target.value)}
              style={{ background: '#1a1a1a', border: '1px solid #333', color: '#EAB308', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
              {STATUS_PIPELINE.filter(s => s !== 'Intake').map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={deleteTruck} style={{ background: '#2a0a0a', border: '1px solid #4a1a1a', color: '#ef4444', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>🗑 Delete</button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'PURCHASE', value: `$${(truck.purchase_price || 0).toLocaleString()}`, color: '#EAB308' },
          { label: 'RECONDITION TOTAL', value: `$${reconTotal.toLocaleString()}`, color: '#EAB308' },
          { label: 'ALL-IN COST', value: `$${allInCost.toLocaleString()}`, color: '#EAB308' },
          { label: 'SOLD PRICE', value: truck.sold_price != null ? `$${truck.sold_price.toLocaleString()}` : '—', color: truck.sold_price ? '#EAB308' : '#444' },
          { label: 'PROFIT', value: profit != null ? `${profit < 0 ? '-' : ''}$${Math.abs(profit).toLocaleString()}` : '—', color: profit == null ? '#444' : profit >= 0 ? '#22c55e' : '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ background: '#161616', border: '1px solid #222', borderRadius: 8, padding: '14px 16px', borderBottom: `2px solid ${s.color === '#444' ? '#222' : s.color}` }}>
            <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {daysInInventory != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#888' }}>
          <span style={{ fontWeight: 600, color: daysInInventory > 60 ? '#ef4444' : daysInInventory > 30 ? '#EAB308' : '#888' }}>{daysInInventory}d</span>
          <span>in inventory</span>
          <span style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 4, padding: '1px 8px', fontSize: 11, color: '#666' }}>· {agingLabel}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {(['overview', 'costs', 'listings', 'docs'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 18px', borderRadius: 6, border: activeTab === tab ? '1px solid #EAB308' : '1px solid transparent',
            background: activeTab === tab ? '#1a1a1a' : 'transparent',
            color: activeTab === tab ? '#EAB308' : '#666', fontSize: 13, cursor: 'pointer', fontWeight: activeTab === tab ? 500 : 400,
          }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div>
          <div style={sectionStyle}>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em', marginBottom: 20 }}>STATUS TIMELINE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {STATUS_PIPELINE.map((step, i) => {
                const isActive = i === currentStepIndex
                const isPast = i < currentStepIndex
                return (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_PIPELINE.length - 1 ? 1 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isActive ? '#EAB308' : isPast ? '#2a2a2a' : '#1a1a1a', border: `2px solid ${isActive ? '#EAB308' : isPast ? '#3a3a3a' : '#2a2a2a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isPast && <span style={{ color: '#555', fontSize: 12 }}>✓</span>}
                        {isActive && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#000', display: 'block' }} />}
                      </div>
                      <div style={{ fontSize: 10, color: isActive ? '#EAB308' : isPast ? '#555' : '#444', whiteSpace: 'nowrap', fontWeight: isActive ? 600 : 400 }}>{step}</div>
                    </div>
                    {i < STATUS_PIPELINE.length - 1 && <div style={{ flex: 1, height: 1, background: isPast ? '#3a3a3a' : '#222', margin: '0 4px', marginBottom: 22 }} />}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={sectionStyle}>
              <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em', marginBottom: 16 }}>KEY DATES</div>
              {[
                { label: 'Bought', value: truck.bought_on },
                { label: 'Listed', value: listingData.listing_date || null },
                { label: 'Sold', value: truck.date_sold },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e1e1e' }}>
                  <span style={{ fontSize: 13, color: '#666' }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: row.value ? '#fff' : '#444' }}>{row.value || '—'}</span>
                </div>
              ))}
            </div>

            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>DETAILS</div>
                <button onClick={() => setEditingDetails(true)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}>✏ Edit</button>
              </div>
              {[
                { label: 'Colour', value: truck.colour },
                { label: 'KM', value: truck.kilometers?.toLocaleString() },
                { label: 'Bought From', value: truck.bought_from },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e1e1e' }}>
                  <span style={{ fontSize: 13, color: '#666' }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: row.value ? '#fff' : '#444' }}>{row.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>NOTES</div>
              <button onClick={() => setEditingNotes(true)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}>✏ Edit</button>
            </div>
            <div style={{ fontSize: 13, color: truck.notes ? '#ccc' : '#444', fontStyle: truck.notes ? 'normal' : 'italic' }}>{truck.notes || 'No notes added.'}</div>
          </div>
        </div>
      )}

      {/* COSTS TAB */}
      {activeTab === 'costs' && (
        <div style={{ paddingBottom: 80 }}>
          {/* Parts */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Parts</h3>
              <button onClick={() => setShowPartModal(true)} style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid #222' }}>{['Part', 'Category', 'Qty', 'Unit Cost', 'Total', 'Date', ''].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 400, fontSize: 11 }}>{h}</th>)}</tr></thead>
              <tbody>
                {parts.length === 0 ? <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#444' }}>No parts. Add one!</td></tr>
                  : parts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px 10px', color: '#ccc' }}>{p.part}</td>
                      <td style={{ padding: '10px 10px', color: '#888' }}>{p.category}</td>
                      <td style={{ padding: '10px 10px', color: '#888' }}>{p.qty}</td>
                      <td style={{ padding: '10px 10px', color: '#888' }}>${p.unit_cost.toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', color: '#EAB308', fontWeight: 600 }}>${(p.qty * p.unit_cost).toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', color: '#555' }}>{p.date || '—'}</td>
                      <td><button onClick={() => deleteRow('parts', p.id)} style={{ background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer' }}>🗑</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Labor */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Labor</h3>
              <button onClick={() => setShowLaborModal(true)} style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid #222' }}>{['Tech', 'Hours', 'Rate', 'Total', 'Date', ''].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 400, fontSize: 11 }}>{h}</th>)}</tr></thead>
              <tbody>
                {labors.length === 0 ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#444' }}>No labor entries.</td></tr>
                  : labors.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px 10px', color: '#ccc' }}>{l.tech}</td>
                      <td style={{ padding: '10px 10px', color: '#888' }}>{l.hours}h</td>
                      <td style={{ padding: '10px 10px', color: '#888' }}>${l.rate}/hr</td>
                      <td style={{ padding: '10px 10px', color: '#EAB308', fontWeight: 600 }}>${(l.hours * l.rate).toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', color: '#555' }}>{l.date || '—'}</td>
                      <td><button onClick={() => deleteRow('labor', l.id)} style={{ background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer' }}>🗑</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Vendor Invoices */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Vendor Invoices</h3>
              <button onClick={() => setShowInvoiceModal(true)} style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid #222' }}>{['Vendor', 'Description', 'Amount', 'Status', 'Date', ''].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 400, fontSize: 11 }}>{h}</th>)}</tr></thead>
              <tbody>
                {invoices.length === 0 ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#444' }}>No invoices.</td></tr>
                  : invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px 10px', color: '#ccc' }}>{inv.vendor}</td>
                      <td style={{ padding: '10px 10px', color: '#888' }}>{inv.description}</td>
                      <td style={{ padding: '10px 10px', color: '#EAB308', fontWeight: 600 }}>${inv.amount.toLocaleString()}</td>
                      <td style={{ padding: '10px 10px' }}><span style={{ background: inv.status === 'Paid' ? '#0a2a0a' : '#2a0a0a', color: inv.status === 'Paid' ? '#22c55e' : '#ef4444', border: `1px solid ${inv.status === 'Paid' ? '#1a4a1a' : '#4a1a1a'}`, borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{inv.status}</span></td>
                      <td style={{ padding: '10px 10px', color: '#555' }}>{inv.date || '—'}</td>
                      <td><button onClick={() => deleteRow('vendor_invoices', inv.id)} style={{ background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer' }}>🗑</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Other Costs */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Other Costs</h3>
              <button onClick={() => setShowCostModal(true)} style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid #222' }}>{['Category', 'Amount', 'Date', 'Notes', ''].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 400, fontSize: 11 }}>{h}</th>)}</tr></thead>
              <tbody>
                {otherCosts.length === 0 ? <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#444' }}>No other costs.</td></tr>
                  : otherCosts.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px 10px', color: '#ccc' }}>{c.category}</td>
                      <td style={{ padding: '10px 10px', color: '#EAB308', fontWeight: 600 }}>${c.amount.toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', color: '#555' }}>{c.date || '—'}</td>
                      <td style={{ padding: '10px 10px', color: '#888' }}>{c.notes || '—'}</td>
                      <td><button onClick={() => deleteRow('other_costs', c.id)} style={{ background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer' }}>🗑</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Sticky cost summary */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', borderTop: '1px solid #EAB308', padding: '12px 28px', display: 'flex', gap: 32, zIndex: 40 }}>
            {[
              { label: 'PARTS', value: partsTotal },
              { label: 'LABOR', value: laborTotal },
              { label: 'VENDOR', value: invoiceTotal },
              { label: 'OTHER', value: otherTotal },
              { label: 'RECONDITION TOTAL', value: reconTotal },
              { label: 'ALL-IN COST', value: allInCost },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.08em' }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: s.label === 'ALL-IN COST' ? '#EAB308' : '#fff' }}>${s.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LISTINGS TAB */}
      {activeTab === 'listings' && (
        <div>
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Listing Info</h3>
              <button onClick={() => setEditingListing(true)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>✏ Edit</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              {[
                { label: 'PLATFORM', value: listingData.listing_platform || 'Facebook Marketplace' },
                { label: 'LINK', value: listingData.listing_link },
                { label: 'DATE LISTED', value: listingData.listing_date },
                { label: 'ASKING PRICE', value: listingData.asking_price ? `$${parseFloat(listingData.asking_price).toLocaleString()}` : null },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: item.value ? '#fff' : '#444' }}>{item.value || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Offers</h3>
              <button onClick={() => setShowOfferModal(true)} style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Log Offer</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid #222' }}>{['Amount', 'Date', 'Notes', 'Accepted', ''].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 400, fontSize: 11 }}>{h}</th>)}</tr></thead>
              <tbody>
                {offers.length === 0 ? <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#444' }}>No offers yet.</td></tr>
                  : offers.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px 10px', color: '#EAB308', fontWeight: 600 }}>${o.amount.toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', color: '#555' }}>{o.date || '—'}</td>
                      <td style={{ padding: '10px 10px', color: '#888' }}>{o.notes || '—'}</td>
                      <td style={{ padding: '10px 10px' }}><span style={{ background: o.accepted ? '#0a2a0a' : '#1a1a1a', color: o.accepted ? '#22c55e' : '#555', border: `1px solid ${o.accepted ? '#1a4a1a' : '#2a2a2a'}`, borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{o.accepted ? 'Yes' : 'No'}</span></td>
                      <td><button onClick={() => deleteRow('offers', o.id)} style={{ background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer' }}>🗑</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Sale Details</h3>
              <button onClick={() => setEditingSale(true)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>✏ Edit</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24 }}>
              {[
                { label: 'SOLD PRICE', value: truck.sold_price ? `$${truck.sold_price.toLocaleString()}` : null },
                { label: 'SOLD DATE', value: truck.date_sold },
                { label: 'CUSTOMER', value: truck.customer },
                { label: 'PAYMENT', value: truck.payment_status },
                { label: 'STATUS', value: truck.status },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 6 }}>{item.label}</div>
                  {item.label === 'STATUS' ? (
                    <span style={{ background: STATUS_COLORS[item.value || '']?.bg || '#1a1a1a', color: STATUS_COLORS[item.value || '']?.color || '#888', border: `1px solid ${STATUS_COLORS[item.value || '']?.border || '#333'}`, borderRadius: 4, padding: '3px 10px', fontSize: 12 }}>{item.value || 'N/A'}</span>
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 500, color: item.value ? '#fff' : '#444' }}>{item.value || '—'}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DOCS TAB */}
      {activeTab === 'docs' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <select style={{ ...inputStyle, width: 180, cursor: 'pointer' }}>
              {['Photos', 'Purchase Docs', 'Inspection & Safety', 'Repair Invoices', 'Sales Docs', 'Other'].map(o => <option key={o}>{o}</option>)}
            </select>
            <button style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>⬆ Upload Files</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {['Purchase Docs', 'Inspection & Safety', 'Repair Invoices', 'Sales Docs', 'Photos', 'Other'].map(folder => (
              <div key={folder} style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '20px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#333')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 20, color: '#EAB308' }}>📁</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{folder}</div>
                    <div style={{ fontSize: 11, color: '#555' }}>0 files</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#444', fontStyle: 'italic' }}>No documents uploaded yet.</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {editingDetails && (
        <Modal title="Edit Details" onClose={() => setEditingDetails(false)} onSave={saveDetails}>
          {[['Colour', 'colour', 'White'], ['KM', 'kilometers', '450000'], ['Bought From', 'bought_from', 'e.g. Ryder']].map(([label, key, ph]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{label}</label>
              <input style={inputStyle} placeholder={ph} value={(detailsForm as any)[key] || ''} onChange={e => setDetailsForm(p => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
        </Modal>
      )}

      {editingNotes && (
        <Modal title="Edit Notes" onClose={() => setEditingNotes(false)} onSave={saveNotes}>
          <textarea style={{ ...inputStyle, height: 120, resize: 'vertical' }} placeholder="Add notes..." value={notesForm.notes} onChange={e => setNotesForm({ notes: e.target.value })} />
        </Modal>
      )}

      {editingSale && (
        <Modal title="Edit Sale Details" onClose={() => setEditingSale(false)} onSave={saveSale}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Sold Price ($)</label><input style={inputStyle} type="number" placeholder="80000" value={saleForm.sold_price} onChange={e => setSaleForm(p => ({ ...p, sold_price: e.target.value }))} /></div>
            <div><label style={labelStyle}>Date Sold</label><input style={inputStyle} type="date" value={saleForm.date_sold} onChange={e => setSaleForm(p => ({ ...p, date_sold: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Customer</label><input style={inputStyle} placeholder="Customer name" value={saleForm.customer} onChange={e => setSaleForm(p => ({ ...p, customer: e.target.value }))} /></div>
          <div><label style={labelStyle}>Payment Status</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={saleForm.payment_status} onChange={e => setSaleForm(p => ({ ...p, payment_status: e.target.value }))}>
              {['N/A', 'Paid', 'Unpaid'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {editingListing && (
        <Modal title="Edit Listing Info" onClose={() => setEditingListing(false)} onSave={() => { setListingData(listingForm); setEditingListing(false) }}>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Platform</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={listingForm.listing_platform} onChange={e => setListingForm(p => ({ ...p, listing_platform: e.target.value }))}>
              {['Facebook Marketplace', 'Kijiji', 'TruckPaper', 'Commercial Truck Trader', 'Other'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Listing Link</label><input style={inputStyle} placeholder="https://..." value={listingForm.listing_link} onChange={e => setListingForm(p => ({ ...p, listing_link: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Date Listed</label><input style={inputStyle} type="date" value={listingForm.listing_date} onChange={e => setListingForm(p => ({ ...p, listing_date: e.target.value }))} /></div>
            <div><label style={labelStyle}>Asking Price ($)</label><input style={inputStyle} type="number" placeholder="75000" value={listingForm.asking_price} onChange={e => setListingForm(p => ({ ...p, asking_price: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {showPartModal && (
        <Modal title="Add Part" onClose={() => setShowPartModal(false)} onSave={addPart}>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Part Name</label><input style={inputStyle} placeholder="e.g. Air Filter" value={newPart.part} onChange={e => setNewPart(p => ({ ...p, part: e.target.value }))} /></div>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Category</label><input style={inputStyle} placeholder="e.g. Engine" value={newPart.category} onChange={e => setNewPart(p => ({ ...p, category: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Qty</label><input style={inputStyle} type="number" value={newPart.qty} onChange={e => setNewPart(p => ({ ...p, qty: e.target.value }))} /></div>
            <div><label style={labelStyle}>Unit Cost ($)</label><input style={inputStyle} type="number" placeholder="0" value={newPart.unit_cost} onChange={e => setNewPart(p => ({ ...p, unit_cost: e.target.value }))} /></div>
            <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={newPart.date} onChange={e => setNewPart(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {showLaborModal && (
        <Modal title="Add Labor" onClose={() => setShowLaborModal(false)} onSave={addLabor}>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Technician</label><input style={inputStyle} placeholder="e.g. Mike" value={newLabor.tech} onChange={e => setNewLabor(p => ({ ...p, tech: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Hours</label><input style={inputStyle} type="number" placeholder="0" value={newLabor.hours} onChange={e => setNewLabor(p => ({ ...p, hours: e.target.value }))} /></div>
            <div><label style={labelStyle}>Rate ($/hr)</label><input style={inputStyle} type="number" placeholder="90" value={newLabor.rate} onChange={e => setNewLabor(p => ({ ...p, rate: e.target.value }))} /></div>
            <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={newLabor.date} onChange={e => setNewLabor(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {showInvoiceModal && (
        <Modal title="Add Vendor Invoice" onClose={() => setShowInvoiceModal(false)} onSave={addInvoice}>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Vendor</label><input style={inputStyle} placeholder="e.g. Petro-Canada" value={newInvoice.vendor} onChange={e => setNewInvoice(p => ({ ...p, vendor: e.target.value }))} /></div>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Description</label><input style={inputStyle} placeholder="e.g. Oil change" value={newInvoice.description} onChange={e => setNewInvoice(p => ({ ...p, description: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Amount ($)</label><input style={inputStyle} type="number" placeholder="0" value={newInvoice.amount} onChange={e => setNewInvoice(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={newInvoice.status} onChange={e => setNewInvoice(p => ({ ...p, status: e.target.value }))}><option>Unpaid</option><option>Paid</option></select>
            </div>
            <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={newInvoice.date} onChange={e => setNewInvoice(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {showCostModal && (
        <Modal title="Add Other Cost" onClose={() => setShowCostModal(false)} onSave={addCost}>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Category</label><input style={inputStyle} placeholder="e.g. Transport, Towing" value={newCost.category} onChange={e => setNewCost(p => ({ ...p, category: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Amount ($)</label><input style={inputStyle} type="number" placeholder="0" value={newCost.amount} onChange={e => setNewCost(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={newCost.date} onChange={e => setNewCost(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
          <div><label style={labelStyle}>Notes</label><input style={inputStyle} placeholder="Optional notes" value={newCost.notes} onChange={e => setNewCost(p => ({ ...p, notes: e.target.value }))} /></div>
        </Modal>
      )}

      {showOfferModal && (
        <Modal title="Log Offer" onClose={() => setShowOfferModal(false)} onSave={addOffer}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Amount ($)</label><input style={inputStyle} type="number" placeholder="0" value={newOffer.amount} onChange={e => setNewOffer(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={newOffer.date} onChange={e => setNewOffer(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Notes</label><input style={inputStyle} placeholder="Optional notes" value={newOffer.notes} onChange={e => setNewOffer(p => ({ ...p, notes: e.target.value }))} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setNewOffer(p => ({ ...p, accepted: !p.accepted }))}>
            <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${newOffer.accepted ? '#EAB308' : '#333'}`, background: newOffer.accepted ? '#EAB308' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {newOffer.accepted && <span style={{ color: '#000', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: '#888' }}>Accepted offer</span>
          </div>
        </Modal>
      )}
    </main>
  )
}