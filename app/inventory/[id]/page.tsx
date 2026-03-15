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

const IS = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'system-ui, sans-serif', minHeight: 44 }
const LS = { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' as const, fontWeight: 500 as const }
const SS = { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '16px 20px', marginBottom: 14 }

function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => { setIsMobile(window.innerWidth < 768) }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 14, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 480, maxHeight: '92vh', overflowY: 'auto' }}>
        {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 16px' }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, minHeight: 50 }}>Cancel</button>
          <button onClick={onSave} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 50 }}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default function TruckDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [isMobile, setIsMobile] = useState(false)

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

  useEffect(() => {
    if (id) fetchAll()
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [id])

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
    setParts(p || []); setLabors(l || []); setInvoices(i || []); setOtherCosts(o || []); setOffers(of || [])
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
    const hasSoldPrice = saleForm.sold_price && parseFloat(saleForm.sold_price) > 0
    const autoPayment = hasSoldPrice && saleForm.payment_status === 'N/A' ? 'Unpaid' : saleForm.payment_status
    const update = {
      sold_price: parseFloat(saleForm.sold_price) || null,
      date_sold: saleForm.date_sold || null,
      customer: saleForm.customer || null,
      payment_status: autoPayment,
      status: hasSoldPrice ? 'Sold' : (truck?.status === 'Sold' ? 'Deal Pending' : (truck?.status ?? 'Purchased')),
    }
    await supabase.from('Inventory Data').update(update).eq('id', id)
    setTruck(prev => prev ? { ...prev, ...update } : prev)
    if (hasSoldPrice && saleForm.payment_status === 'N/A') setSaleForm(p => ({ ...p, payment_status: 'Unpaid' }))
    setEditingSale(false)
  }

  async function deleteTruck() {
    if (!confirm('Delete this truck permanently?')) return
    await supabase.from('Inventory Data').delete().eq('id', id)
    router.push('/inventory')
  }

  async function addPart() {
    await supabase.from('parts').insert([{ truck_id: id, part: newPart.part, category: newPart.category, qty: parseFloat(newPart.qty) || 1, unit_cost: parseFloat(newPart.unit_cost) || 0, date: newPart.date || null }])
    setShowPartModal(false); setNewPart({ part: '', category: '', qty: '1', unit_cost: '', date: '' }); fetchAll()
  }

  async function addLabor() {
    await supabase.from('labor').insert([{ truck_id: id, tech: newLabor.tech, hours: parseFloat(newLabor.hours) || 0, rate: parseFloat(newLabor.rate) || 0, date: newLabor.date || null }])
    setShowLaborModal(false); setNewLabor({ tech: '', hours: '', rate: '', date: '' }); fetchAll()
  }

  async function addInvoice() {
    await supabase.from('vendor_invoices').insert([{ truck_id: id, vendor: newInvoice.vendor, description: newInvoice.description, amount: parseFloat(newInvoice.amount) || 0, status: newInvoice.status, date: newInvoice.date || null }])
    setShowInvoiceModal(false); setNewInvoice({ vendor: '', description: '', amount: '', status: 'Unpaid', date: '' }); fetchAll()
  }

  async function addCost() {
    await supabase.from('other_costs').insert([{ truck_id: id, category: newCost.category, amount: parseFloat(newCost.amount) || 0, date: newCost.date || null, notes: newCost.notes || null }])
    setShowCostModal(false); setNewCost({ category: '', amount: '', date: '', notes: '' }); fetchAll()
  }

  async function addOffer() {
    await supabase.from('offers').insert([{ truck_id: id, amount: parseFloat(newOffer.amount) || 0, date: newOffer.date || null, notes: newOffer.notes || null, accepted: newOffer.accepted }])
    setShowOfferModal(false); setNewOffer({ amount: '', date: '', notes: '', accepted: false }); fetchAll()
  }

  async function deleteRow(table: string, rowId: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from(table).delete().eq('id', rowId); fetchAll()
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text3)' }}>Loading...</div>
  if (!truck) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--red)' }}>Truck not found</div>

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
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .cost-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid var(--border2); }
        .cost-row:last-child { border-bottom: none; }
      `}</style>

      <main style={{ padding: isMobile ? '16px' : '28px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif', paddingBottom: isMobile ? '100px' : '28px' }}>

        {/* Header */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: isMobile ? '14px 16px' : '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <button onClick={() => router.push('/inventory')} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truck.year} {truck.make} {truck.model}</h1>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, fontFamily: 'monospace' }}>{truck.vin}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <select value={truck.status} onChange={e => updateStatus(e.target.value)}
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--gold)', borderRadius: 8, padding: '7px 10px', fontSize: 12, cursor: 'pointer', outline: 'none', minHeight: 36 }}>
                {STATUS_PIPELINE.filter(s => s !== 'Intake').map(s => <option key={s}>{s}</option>)}
              </select>
              {!isMobile && (
                <button onClick={deleteTruck} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>🗑 Delete</button>
              )}
            </div>
          </div>
        </div>

        {/* Stat cards — 2 cols on mobile, 5 on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'PURCHASE', value: `$${(truck.purchase_price || 0).toLocaleString()}`, color: 'var(--gold)' },
            { label: 'RECON', value: `$${reconTotal.toLocaleString()}`, color: 'var(--gold)' },
            { label: 'ALL-IN', value: `$${allInCost.toLocaleString()}`, color: 'var(--gold)' },
            { label: 'SOLD PRICE', value: truck.sold_price != null ? `$${truck.sold_price.toLocaleString()}` : '—', color: truck.sold_price ? 'var(--gold)' : 'var(--text4)' },
            { label: 'PROFIT', value: profit != null ? `${profit < 0 ? '-' : ''}$${Math.abs(profit).toLocaleString()}` : '—', color: profit == null ? 'var(--text4)' : profit >= 0 ? 'var(--green)' : 'var(--red)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: isMobile ? '10px 12px' : '14px 16px', borderBottom: `2px solid ${s.color === 'var(--text4)' ? 'var(--border)' : s.color}` }}>
              <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Days + aging */}
        {daysInInventory != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 13, color: 'var(--text2)' }}>
            <span style={{ fontWeight: 700, color: daysInInventory > 60 ? 'var(--red)' : daysInInventory > 30 ? 'var(--gold)' : 'var(--text2)' }}>{daysInInventory}d</span>
            <span>in inventory</span>
            <span style={{ background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 8px', fontSize: 11, color: 'var(--text3)' }}>· {agingLabel}</span>
            {isMobile && (
              <button onClick={deleteTruck} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>🗑</button>
            )}
          </div>
        )}

        {/* Tabs — scrollable on mobile */}
        <div style={{ overflowX: 'auto', marginBottom: 16, WebkitOverflowScrolling: 'touch' as any }}>
          <div style={{ display: 'flex', gap: 6, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: 4, width: 'fit-content', minWidth: isMobile ? '100%' : 'auto' }}>
            {(['overview', 'costs', 'listings', 'docs'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: isMobile ? 1 : 'none',
                padding: isMobile ? '10px 8px' : '7px 18px',
                borderRadius: 8, border: activeTab === tab ? '1px solid var(--gold)' : '1px solid transparent',
                background: activeTab === tab ? 'var(--active)' : 'transparent',
                color: activeTab === tab ? 'var(--gold)' : 'var(--text3)',
                fontSize: isMobile ? 12 : 13, cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400,
                whiteSpace: 'nowrap', minHeight: 38,
              }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* Status timeline — scrollable on mobile */}
            <div style={SS}>
              <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', marginBottom: 16, fontWeight: 600 }}>STATUS TIMELINE</div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
                <div style={{ display: 'flex', alignItems: 'center', minWidth: isMobile ? 500 : 'auto' }}>
                  {STATUS_PIPELINE.map((step, i) => {
                    const isActive = i === currentStepIndex; const isPast = i < currentStepIndex
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_PIPELINE.length - 1 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: isActive ? 'var(--gold)' : isPast ? 'var(--hover)' : 'var(--card-bg)', border: `2px solid ${isActive ? 'var(--gold)' : isPast ? 'var(--border)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isPast && <span style={{ color: 'var(--text3)', fontSize: 11 }}>✓</span>}
                            {isActive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#000', display: 'block' }} />}
                          </div>
                          <div style={{ fontSize: 9, color: isActive ? 'var(--gold)' : isPast ? 'var(--text3)' : 'var(--text4)', whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 400 }}>{step}</div>
                        </div>
                        {i < STATUS_PIPELINE.length - 1 && <div style={{ flex: 1, height: 1, background: isPast ? 'var(--border)' : 'var(--border2)', margin: '0 4px', marginBottom: 20 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Key dates + details — stack on mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div style={SS}>
                <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', marginBottom: 14, fontWeight: 600 }}>KEY DATES</div>
                {[
                  { label: 'Bought', value: truck.bought_on },
                  { label: 'Listed', value: listingData.listing_date || null },
                  { label: 'Sold', value: truck.date_sold },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border2)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: row.value ? 'var(--text)' : 'var(--text4)' }}>{row.value || '—'}</span>
                  </div>
                ))}
              </div>

              <div style={SS}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 600 }}>DETAILS</div>
                  <button onClick={() => setEditingDetails(true)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 12, padding: '5px 10px', borderRadius: 6, minHeight: 32 }}>✏ Edit</button>
                </div>
                {[
                  { label: 'Colour', value: truck.colour },
                  { label: 'KM', value: truck.kilometers?.toLocaleString() },
                  { label: 'Bought From', value: truck.bought_from },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border2)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: row.value ? 'var(--text)' : 'var(--text4)' }}>{row.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={SS}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 600 }}>NOTES</div>
                <button onClick={() => setEditingNotes(true)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 12, padding: '5px 10px', borderRadius: 6, minHeight: 32 }}>✏ Edit</button>
              </div>
              <div style={{ fontSize: 14, color: truck.notes ? 'var(--text)' : 'var(--text4)', fontStyle: truck.notes ? 'normal' : 'italic', lineHeight: 1.6 }}>{truck.notes || 'No notes added.'}</div>
            </div>
          </div>
        )}

        {/* COSTS TAB */}
        {activeTab === 'costs' && (
          <div style={{ paddingBottom: 90 }}>
            {[
              { title: 'Parts', items: parts, onAdd: () => setShowPartModal(true), render: (p: Part) => (
                <div key={p.id} className="cost-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{p.part}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.category} · Qty {p.qty} · ${p.unit_cost}/ea · {p.date || 'No date'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>${(p.qty * p.unit_cost).toLocaleString()}</span>
                    <button onClick={() => deleteRow('parts', p.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 16, padding: 4, minWidth: 32, minHeight: 32 }}>🗑</button>
                  </div>
                </div>
              )},
              { title: 'Labor', items: labors, onAdd: () => setShowLaborModal(true), render: (l: Labor) => (
                <div key={l.id} className="cost-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{l.tech}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l.hours}h × ${l.rate}/hr · {l.date || 'No date'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>${(l.hours * l.rate).toLocaleString()}</span>
                    <button onClick={() => deleteRow('labor', l.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 16, padding: 4, minWidth: 32, minHeight: 32 }}>🗑</button>
                  </div>
                </div>
              )},
              { title: 'Vendor Invoices', items: invoices, onAdd: () => setShowInvoiceModal(true), render: (inv: Invoice) => (
                <div key={inv.id} className="cost-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{inv.vendor}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{inv.description} · {inv.date || 'No date'}</div>
                    <span style={{ background: inv.status === 'Paid' ? 'var(--green-dim)' : 'var(--red-dim)', color: inv.status === 'Paid' ? 'var(--green)' : 'var(--red)', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 600, display: 'inline-block', marginTop: 4 }}>{inv.status}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>${inv.amount.toLocaleString()}</span>
                    <button onClick={() => deleteRow('vendor_invoices', inv.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 16, padding: 4, minWidth: 32, minHeight: 32 }}>🗑</button>
                  </div>
                </div>
              )},
              { title: 'Other Costs', items: otherCosts, onAdd: () => setShowCostModal(true), render: (c: OtherCost) => (
                <div key={c.id} className="cost-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{c.category}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.notes || 'No notes'} · {c.date || 'No date'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>${c.amount.toLocaleString()}</span>
                    <button onClick={() => deleteRow('other_costs', c.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 16, padding: 4, minWidth: 32, minHeight: 32 }}>🗑</button>
                  </div>
                </div>
              )},
            ].map(section => (
              <div key={section.title} style={SS}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{section.title}</h3>
                  <button onClick={section.onAdd} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', minHeight: 36 }}>+ Add</button>
                </div>
                {(section.items as any[]).length === 0
                  ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text4)', fontSize: 13 }}>Nothing added yet</div>
                  : (section.items as any[]).map(item => section.render(item))}
              </div>
            ))}

            {/* Sticky cost bar — scrollable on mobile */}
            <div style={{ position: 'fixed', bottom: isMobile ? 64 : 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--gold)', padding: isMobile ? '10px 16px' : '12px 28px', zIndex: 40, overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: isMobile ? 16 : 32, minWidth: 'fit-content' }}>
                {[
                  { label: 'PARTS', value: partsTotal },
                  { label: 'LABOR', value: laborTotal },
                  { label: 'VENDOR', value: invoiceTotal },
                  { label: 'OTHER', value: otherTotal },
                  { label: 'RECON TOTAL', value: reconTotal },
                  { label: 'ALL-IN', value: allInCost },
                ].map(s => (
                  <div key={s.label} style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.08em', fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 700, color: s.label === 'ALL-IN' ? 'var(--gold)' : 'var(--text)' }}>${s.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <div>
            <div style={SS}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Listing Info</h3>
                <button onClick={() => setEditingListing(true)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer', minHeight: 36 }}>✏ Edit</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'PLATFORM', value: listingData.listing_platform || 'Facebook Marketplace' },
                  { label: 'DATE LISTED', value: listingData.listing_date },
                  { label: 'ASKING PRICE', value: listingData.asking_price ? `$${parseFloat(listingData.asking_price).toLocaleString()}` : null },
                  { label: 'LINK', value: listingData.listing_link },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: item.value ? 'var(--text)' : 'var(--text4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={SS}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Offers</h3>
                <button onClick={() => setShowOfferModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', minHeight: 36 }}>+ Log Offer</button>
              </div>
              {offers.length === 0
                ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text4)', fontSize: 13 }}>No offers yet</div>
                : offers.map(o => (
                  <div key={o.id} className="cost-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', marginBottom: 3 }}>${o.amount.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{o.notes || 'No notes'} · {o.date || 'No date'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: o.accepted ? 'var(--green-dim)' : 'var(--hover)', color: o.accepted ? 'var(--green)' : 'var(--text3)', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{o.accepted ? 'Accepted' : 'Pending'}</span>
                      <button onClick={() => deleteRow('offers', o.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 16, padding: 4, minWidth: 32, minHeight: 32 }}>🗑</button>
                    </div>
                  </div>
                ))}
            </div>

            <div style={SS}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Sale Details</h3>
                <button onClick={() => setEditingSale(true)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer', minHeight: 36 }}>✏ Edit</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 16 }}>
                {[
                  { label: 'SOLD PRICE', value: truck.sold_price ? `$${truck.sold_price.toLocaleString()}` : null },
                  { label: 'SOLD DATE', value: truck.date_sold },
                  { label: 'CUSTOMER', value: truck.customer },
                  { label: 'PAYMENT', value: truck.payment_status },
                  { label: 'STATUS', value: truck.status },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 600 }}>{item.label}</div>
                    {item.label === 'STATUS' ? (
                      <span style={{ background: STATUS_COLORS[item.value || '']?.bg || 'var(--hover)', color: STATUS_COLORS[item.value || '']?.color || 'var(--text2)', border: `1px solid ${STATUS_COLORS[item.value || '']?.border || 'var(--border)'}`, borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>{item.value || 'N/A'}</span>
                    ) : (
                      <div style={{ fontSize: 13, fontWeight: 500, color: item.value ? 'var(--text)' : 'var(--text4)' }}>{item.value || '—'}</div>
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
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <select style={{ ...IS, flex: 1, minWidth: 160 }}>
                {['Photos', 'Purchase Docs', 'Inspection & Safety', 'Repair Invoices', 'Sales Docs', 'Other'].map(o => <option key={o}>{o}</option>)}
              </select>
              <button style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', minHeight: 44 }}>⬆ Upload</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12 }}>
              {['Purchase Docs', 'Inspection & Safety', 'Repair Invoices', 'Sales Docs', 'Photos', 'Other'].map(folder => (
                <div key={folder} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '16px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 22, color: 'var(--gold)', display: 'block', marginBottom: 8 }}>📁</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{folder}</div>
                  <div style={{ fontSize: 11, color: 'var(--text4)' }}>0 files</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {editingDetails && (
        <Modal title="Edit Details" onClose={() => setEditingDetails(false)} onSave={saveDetails}>
          {[['Colour', 'colour', 'White'], ['KM', 'kilometers', '450000'], ['Bought From', 'bought_from', 'e.g. Ryder']].map(([label, key, ph]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={LS}>{label}</label>
              <input style={IS} placeholder={ph} value={(detailsForm as any)[key] || ''} onChange={e => setDetailsForm(p => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
        </Modal>
      )}

      {editingNotes && (
        <Modal title="Edit Notes" onClose={() => setEditingNotes(false)} onSave={saveNotes}>
          <textarea style={{ ...IS, height: 120, resize: 'vertical', minHeight: 120 }} placeholder="Add notes..." value={notesForm.notes} onChange={e => setNotesForm({ notes: e.target.value })} />
        </Modal>
      )}

      {editingSale && (
        <Modal title="Edit Sale Details" onClose={() => setEditingSale(false)} onSave={saveSale}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={LS}>Sold Price ($)</label><input style={IS} type="number" placeholder="80000" value={saleForm.sold_price} onChange={e => setSaleForm(p => ({ ...p, sold_price: e.target.value }))} /></div>
            <div><label style={LS}>Date Sold</label><input style={IS} type="date" value={saleForm.date_sold} onChange={e => setSaleForm(p => ({ ...p, date_sold: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={LS}>Customer</label><input style={IS} placeholder="Customer name" value={saleForm.customer} onChange={e => setSaleForm(p => ({ ...p, customer: e.target.value }))} /></div>
          <div><label style={LS}>Payment Status</label>
            <select style={IS} value={saleForm.payment_status} onChange={e => setSaleForm(p => ({ ...p, payment_status: e.target.value }))}>
              {['N/A', 'Paid', 'Unpaid'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {editingListing && (
        <Modal title="Edit Listing Info" onClose={() => setEditingListing(false)} onSave={() => { setListingData(listingForm); setEditingListing(false) }}>
          <div style={{ marginBottom: 14 }}><label style={LS}>Platform</label>
            <select style={IS} value={listingForm.listing_platform} onChange={e => setListingForm(p => ({ ...p, listing_platform: e.target.value }))}>
              {['Facebook Marketplace', 'Kijiji', 'TruckPaper', 'Commercial Truck Trader', 'Other'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}><label style={LS}>Listing Link</label><input style={IS} placeholder="https://..." value={listingForm.listing_link} onChange={e => setListingForm(p => ({ ...p, listing_link: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LS}>Date Listed</label><input style={IS} type="date" value={listingForm.listing_date} onChange={e => setListingForm(p => ({ ...p, listing_date: e.target.value }))} /></div>
            <div><label style={LS}>Asking Price ($)</label><input style={IS} type="number" placeholder="75000" value={listingForm.asking_price} onChange={e => setListingForm(p => ({ ...p, asking_price: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {showPartModal && (
        <Modal title="Add Part" onClose={() => setShowPartModal(false)} onSave={addPart}>
          <div style={{ marginBottom: 14 }}><label style={LS}>Part Name</label><input style={IS} placeholder="e.g. Air Filter" value={newPart.part} onChange={e => setNewPart(p => ({ ...p, part: e.target.value }))} /></div>
          <div style={{ marginBottom: 14 }}><label style={LS}>Category</label><input style={IS} placeholder="e.g. Engine" value={newPart.category} onChange={e => setNewPart(p => ({ ...p, category: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div><label style={LS}>Qty</label><input style={IS} type="number" value={newPart.qty} onChange={e => setNewPart(p => ({ ...p, qty: e.target.value }))} /></div>
            <div><label style={LS}>Unit Cost ($)</label><input style={IS} type="number" placeholder="0" value={newPart.unit_cost} onChange={e => setNewPart(p => ({ ...p, unit_cost: e.target.value }))} /></div>
            <div><label style={LS}>Date</label><input style={IS} type="date" value={newPart.date} onChange={e => setNewPart(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {showLaborModal && (
        <Modal title="Add Labor" onClose={() => setShowLaborModal(false)} onSave={addLabor}>
          <div style={{ marginBottom: 14 }}><label style={LS}>Technician</label><input style={IS} placeholder="e.g. Mike" value={newLabor.tech} onChange={e => setNewLabor(p => ({ ...p, tech: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={LS}>Hours</label><input style={IS} type="number" placeholder="0" value={newLabor.hours} onChange={e => setNewLabor(p => ({ ...p, hours: e.target.value }))} /></div>
            <div><label style={LS}>Rate ($/hr)</label><input style={IS} type="number" placeholder="90" value={newLabor.rate} onChange={e => setNewLabor(p => ({ ...p, rate: e.target.value }))} /></div>
            <div><label style={LS}>Date</label><input style={IS} type="date" value={newLabor.date} onChange={e => setNewLabor(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {showInvoiceModal && (
        <Modal title="Add Vendor Invoice" onClose={() => setShowInvoiceModal(false)} onSave={addInvoice}>
          <div style={{ marginBottom: 14 }}><label style={LS}>Vendor</label><input style={IS} placeholder="e.g. Petro-Canada" value={newInvoice.vendor} onChange={e => setNewInvoice(p => ({ ...p, vendor: e.target.value }))} /></div>
          <div style={{ marginBottom: 14 }}><label style={LS}>Description</label><input style={IS} placeholder="e.g. Oil change" value={newInvoice.description} onChange={e => setNewInvoice(p => ({ ...p, description: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={LS}>Amount ($)</label><input style={IS} type="number" placeholder="0" value={newInvoice.amount} onChange={e => setNewInvoice(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><label style={LS}>Status</label><select style={IS} value={newInvoice.status} onChange={e => setNewInvoice(p => ({ ...p, status: e.target.value }))}><option>Unpaid</option><option>Paid</option></select></div>
            <div><label style={LS}>Date</label><input style={IS} type="date" value={newInvoice.date} onChange={e => setNewInvoice(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {showCostModal && (
        <Modal title="Add Other Cost" onClose={() => setShowCostModal(false)} onSave={addCost}>
          <div style={{ marginBottom: 14 }}><label style={LS}>Category</label><input style={IS} placeholder="e.g. Transport, Towing" value={newCost.category} onChange={e => setNewCost(p => ({ ...p, category: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div><label style={LS}>Amount ($)</label><input style={IS} type="number" placeholder="0" value={newCost.amount} onChange={e => setNewCost(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><label style={LS}>Date</label><input style={IS} type="date" value={newCost.date} onChange={e => setNewCost(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
          <div><label style={LS}>Notes</label><input style={IS} placeholder="Optional notes" value={newCost.notes} onChange={e => setNewCost(p => ({ ...p, notes: e.target.value }))} /></div>
        </Modal>
      )}

      {showOfferModal && (
        <Modal title="Log Offer" onClose={() => setShowOfferModal(false)} onSave={addOffer}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div><label style={LS}>Amount ($)</label><input style={IS} type="number" placeholder="0" value={newOffer.amount} onChange={e => setNewOffer(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><label style={LS}>Date</label><input style={IS} type="date" value={newOffer.date} onChange={e => setNewOffer(p => ({ ...p, date: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={LS}>Notes</label><input style={IS} placeholder="Optional notes" value={newOffer.notes} onChange={e => setNewOffer(p => ({ ...p, notes: e.target.value }))} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 0', minHeight: 44 }} onClick={() => setNewOffer(p => ({ ...p, accepted: !p.accepted }))}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${newOffer.accepted ? 'var(--gold)' : 'var(--border)'}`, background: newOffer.accepted ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {newOffer.accepted && <span style={{ color: '#000', fontSize: 13, fontWeight: 800 }}>✓</span>}
            </div>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>Accepted offer</span>
          </div>
        </Modal>
      )}
    </>
  )
}