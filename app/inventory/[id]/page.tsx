'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string; status: string; bought_on: string | null; vin: string
  year: number | null; make: string | null; model: string | null
  colour: string | null; kilometers: number | null; bought_from: string | null
  purchase_price: number | null; recondition_cost: number | null
  date_sold: string | null; sold_price: number | null; customer: string | null
  payment_status: string | null; notes: string | null
  listing_platform: string | null; listing_link: string | null
  listing_date: string | null; asking_price: number | null
}
type Part      = { id: string; part: string; category: string; qty: number; unit_cost: number; date: string | null; invoice_url: string | null }
type Labor     = { id: string; tech: string; hours: number; rate: number; date: string | null; invoice_url: string | null }
type Invoice   = { id: string; vendor: string; description: string; amount: number; status: string; date: string | null; invoice_url: string | null }
type OtherCost = { id: string; category: string; amount: number; date: string | null; notes: string | null; invoice_url: string | null }
type Offer     = { id: string; amount: number; date: string | null; notes: string | null; accepted: boolean }
type Doc       = { id: string; category: string; name: string; url: string; created_at: string }

const STATUS_PIPELINE = ['Intake', 'Purchased', 'In Reconditioning', 'Ready to List', 'Listed', 'Deal Pending', 'Sold']
const DOC_CATEGORIES  = ['Photos', 'Purchase Docs', 'Inspection & Safety', 'Repair Invoices', 'Sales Docs', 'Other']

const statusStyle = (s: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    Purchased:           { bg: 'rgba(255,255,255,0.06)', color: 'var(--text2)' },
    'In Reconditioning': { bg: 'rgba(34,197,94,0.1)',   color: 'var(--green)' },
    'Ready to List':     { bg: 'rgba(234,179,8,0.1)',   color: 'var(--gold)' },
    Listed:              { bg: 'rgba(56,189,248,0.1)',  color: 'var(--blue)' },
    'Deal Pending':      { bg: 'rgba(249,115,22,0.1)',  color: 'var(--orange)' },
    Sold:                { bg: 'rgba(34,197,94,0.1)',   color: 'var(--green)' },
    Intake:              { bg: 'rgba(234,179,8,0.1)',   color: 'var(--gold)' },
  }
  return map[s] || { bg: 'var(--hover)', color: 'var(--text2)' }
}

// ── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(10px)', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '13px', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={onSave} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px var(--gold-glow)' }}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Image/file preview modal ─────────────────────────────────────────────────
function PreviewModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(url) || url.includes('image')
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.95)' }}>
      {isImage && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(0.25)', transform: 'scale(1.1)' }} />}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={url} download={name} onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 99, padding: '6px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 600, textDecoration: 'none' }}>⬇ Download</a>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 34, height: 34, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {isImage
          ? <img src={url} alt={name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }} />
          : <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{name}</div>
              <a href={url} target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', color: '#000', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>Open File</a>
            </div>
        }
      </div>
    </div>
  )
}

// ── Invoice upload button for cost rows ──────────────────────────────────────
function UploadButton({ table, rowId, currentUrl, onUploaded }: { table: string; rowId: string; currentUrl: string | null; onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const path = `${table}/${rowId}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('invoices').getPublicUrl(path)
      await supabase.from(table).update({ invoice_url: data.publicUrl }).eq('id', rowId)
      onUploaded(data.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {currentUrl && (
        <button onClick={() => setPreview(currentUrl)} style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 99, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>📄 View</button>
      )}
      <button onClick={() => fileRef.current?.click()} disabled={uploading}
        style={{ background: uploading ? 'var(--hover)' : 'var(--blue-dim)', border: '1px solid var(--blue)', color: uploading ? 'var(--text3)' : 'var(--blue)', borderRadius: 99, padding: '3px 10px', fontSize: 11, cursor: uploading ? 'default' : 'pointer', fontWeight: 600 }}>
        {uploading ? '...' : currentUrl ? '🔄 Replace' : '📎 Upload'}
      </button>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFile} />
      {preview && <PreviewModal url={preview} name="Invoice" onClose={() => setPreview(null)} />}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TruckDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params.id as string

  const [truck,      setTruck]      = useState<Truck | null>(null)
  const [parts,      setParts]      = useState<Part[]>([])
  const [labors,     setLabors]     = useState<Labor[]>([])
  const [invoices,   setInvoices]   = useState<Invoice[]>([])
  const [otherCosts, setOtherCosts] = useState<OtherCost[]>([])
  const [offers,     setOffers]     = useState<Offer[]>([])
  const [docs,       setDocs]       = useState<Doc[]>([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState<'overview' | 'costs' | 'listings' | 'docs'>('overview')

  // Edit state
  const [editingDetails,  setEditingDetails]  = useState(false)
  const [editingNotes,    setEditingNotes]    = useState(false)
  const [editingSale,     setEditingSale]     = useState(false)
  const [editingListing,  setEditingListing]  = useState(false)

  // Add modals
  const [showPartModal,    setShowPartModal]    = useState(false)
  const [showLaborModal,   setShowLaborModal]   = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showCostModal,    setShowCostModal]    = useState(false)
  const [showOfferModal,   setShowOfferModal]   = useState(false)

  // Forms
  const [detailsForm, setDetailsForm] = useState<Partial<Truck>>({})
  const [notesForm,   setNotesForm]   = useState({ notes: '' })
  const [saleForm,    setSaleForm]    = useState({ sold_price: '', date_sold: '', customer: '', payment_status: 'N/A' })
  const [listingForm, setListingForm] = useState({ listing_platform: '', listing_link: '', listing_date: '', asking_price: '' })
  const [newPart,     setNewPart]     = useState({ part: '', category: '', qty: '1', unit_cost: '', date: '' })
  const [newLabor,    setNewLabor]    = useState({ tech: '', hours: '', rate: '', date: '' })
  const [newInvoice,  setNewInvoice]  = useState({ vendor: '', description: '', amount: '', status: 'Unpaid', date: '' })
  const [newCost,     setNewCost]     = useState({ category: '', amount: '', date: '', notes: '' })
  const [newOffer,    setNewOffer]    = useState({ amount: '', date: '', notes: '', accepted: false })

  // Docs
  const [docCategory,  setDocCategory]  = useState('Photos')
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [previewDoc,   setPreviewDoc]   = useState<Doc | null>(null)
  const docFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (id) fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)
    const [{ data: t }, { data: p }, { data: l }, { data: i }, { data: o }, { data: of }, { data: d }] = await Promise.all([
      supabase.from('Inventory Data').select('*').eq('id', id).single(),
      supabase.from('parts').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('labor').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('vendor_invoices').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('other_costs').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('offers').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('truck_documents').select('*').eq('truck_id', id).order('created_at'),
    ])
    if (t) {
      setTruck(t)
      setDetailsForm({ colour: t.colour, kilometers: t.kilometers, bought_from: t.bought_from, purchase_price: t.purchase_price, recondition_cost: t.recondition_cost, date_sold: t.date_sold, customer: t.customer, payment_status: t.payment_status, sold_price: t.sold_price })
      setNotesForm({ notes: t.notes || '' })
      setSaleForm({ sold_price: t.sold_price?.toString() || '', date_sold: t.date_sold || '', customer: t.customer || '', payment_status: t.payment_status || 'N/A' })
      setListingForm({ listing_platform: t.listing_platform || '', listing_link: t.listing_link || '', listing_date: t.listing_date || '', asking_price: t.asking_price?.toString() || '' })
    }
    setParts(p || []); setLabors(l || []); setInvoices(i || [])
    setOtherCosts(o || []); setOffers(of || []); setDocs(d || [])
    setLoading(false)
  }

  // ── Status ──
  async function updateStatus(status: string) {
    await supabase.from('Inventory Data').update({ status }).eq('id', id)
    setTruck(prev => prev ? { ...prev, status } : prev)
  }

  // ── Details ──
  async function saveDetails() {
    const payload = {
      ...detailsForm,
      kilometers:       detailsForm.kilometers       ? Number(detailsForm.kilometers)       : null,
      purchase_price:   detailsForm.purchase_price   ? Number(detailsForm.purchase_price)   : null,
      recondition_cost: detailsForm.recondition_cost ? Number(detailsForm.recondition_cost) : null,
      sold_price:       (detailsForm as any).sold_price ? Number((detailsForm as any).sold_price) : null,
      date_sold:        (detailsForm as any).date_sold  || null,
      customer:         (detailsForm as any).customer   || null,
      payment_status:   (detailsForm as any).payment_status || null,
    }
    await supabase.from('Inventory Data').update(payload).eq('id', id)
    setTruck(prev => prev ? { ...prev, ...payload } : prev)
    setEditingDetails(false)
  }

  // ── Notes ──
  async function saveNotes() {
    await supabase.from('Inventory Data').update({ notes: notesForm.notes }).eq('id', id)
    setTruck(prev => prev ? { ...prev, notes: notesForm.notes } : prev)
    setEditingNotes(false)
  }

  // ── Sale ──
  async function saveSale() {
    const update: Partial<Truck> = {
      sold_price: parseFloat(saleForm.sold_price) || null,
      date_sold: saleForm.date_sold || null,
      customer: saleForm.customer || null,
      payment_status: saleForm.payment_status,
      status: saleForm.sold_price && parseFloat(saleForm.sold_price) > 0 ? 'Sold' : (truck?.status === 'Sold' ? 'Deal Pending' : (truck?.status ?? 'Purchased')),
    }
    await supabase.from('Inventory Data').update(update).eq('id', id)
    setTruck(prev => prev ? { ...prev, ...update } : prev)
    setEditingSale(false)
  }

  // ── Listing — saved to Supabase ──
  async function saveListing() {
    const update = {
      listing_platform: listingForm.listing_platform || null,
      listing_link: listingForm.listing_link || null,
      listing_date: listingForm.listing_date || null,
      asking_price: parseFloat(listingForm.asking_price) || null,
    }
    await supabase.from('Inventory Data').update(update).eq('id', id)
    setTruck(prev => prev ? { ...prev, ...update } : prev)
    setEditingListing(false)
  }

  // ── Costs ──
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

  // ── Docs upload ──
  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingDoc(true)
    const path = `docs/${id}/${docCategory}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('invoices').getPublicUrl(path)
      await supabase.from('truck_documents').insert([{ truck_id: id, category: docCategory, name: file.name, url: data.publicUrl }])
      fetchAll()
    }
    setUploadingDoc(false)
    if (docFileRef.current) docFileRef.current.value = ''
  }

  async function deleteDoc(docId: string, url: string) {
    if (!confirm('Delete this document?')) return
    // Extract storage path from URL
    const path = url.split('/invoices/')[1]
    if (path) await supabase.storage.from('invoices').remove([path])
    await supabase.from('truck_documents').delete().eq('id', docId)
    fetchAll()
  }

  async function deleteTruck() {
    if (!confirm('Delete this truck permanently?')) return
    await supabase.from('Inventory Data').delete().eq('id', id)
    router.push('/inventory')
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text3)' }}>Loading...</div>
  if (!truck) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--red)' }}>Truck not found</div>

  const partsTotal   = parts.reduce((s, p) => s + p.qty * p.unit_cost, 0)
  const laborTotal   = labors.reduce((s, l) => s + l.hours * l.rate, 0)
  const invoiceTotal = invoices.reduce((s, i) => s + i.amount, 0)
  const otherTotal   = otherCosts.reduce((s, o) => s + o.amount, 0)
  const reconTotal   = (truck.recondition_cost || 0) + partsTotal + laborTotal + invoiceTotal + otherTotal
  const allInCost    = (truck.purchase_price || 0) + reconTotal
  const profit       = truck.sold_price != null ? truck.sold_price - allInCost : null
  const daysInInv    = truck.bought_on ? Math.floor((Date.now() - new Date(truck.bought_on).getTime()) / 86400000) : null
  const agingLabel   = daysInInv == null ? '' : daysInInv <= 15 ? '0–15' : daysInInv <= 30 ? '16–30' : daysInInv <= 60 ? '31–60' : '60+'
  const stepIndex    = STATUS_PIPELINE.indexOf(truck.status)

  const IS = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'system-ui,sans-serif', transition: 'border-color 0.15s' }
  const LS = { fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'block' as const, fontWeight: 500 }

  // Docs grouped by category
  const docsByCategory = DOC_CATEGORIES.reduce<Record<string, Doc[]>>((acc, cat) => {
    acc[cat] = docs.filter(d => d.category === cat)
    return acc
  }, {})

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .stat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}
        .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
        .tab-bar{display:flex;gap:4px;margin-bottom:16px;background:var(--card-bg);border:1px solid var(--card-border);border-radius:12px;padding:4px;overflow-x:auto}
        .tab-bar::-webkit-scrollbar{display:none}
        .cost-bar{position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-top:1px solid var(--border);padding:10px 16px;display:flex;gap:20px;z-index:40;overflow-x:auto;backdrop-filter:blur(20px);box-shadow:0 -4px 24px rgba(0,0,0,0.2)}
        .cost-bar::-webkit-scrollbar{display:none}
        .cost-row{border-bottom:1px solid var(--border2);padding:10px 0}
        .form-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .form-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        .doc-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border2);transition:background 0.15s}
        .doc-item:hover{background:var(--hover)}
        @media(max-width:640px){
          .stat-grid{grid-template-columns:repeat(2,1fr)!important}
          .stat-last{grid-column:span 2}
          .detail-grid{grid-template-columns:1fr!important}
          .form-2col{grid-template-columns:1fr!important}
          .form-3col{grid-template-columns:1fr 1fr!important}
        }
      `}</style>

      <main style={{ padding: '16px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        {/* ── HEADER ── */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '16px', marginBottom: 14, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <button onClick={() => router.push('/inventory')} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, padding: '6px 10px', borderRadius: 8, flexShrink: 0 }}>←</button>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>{truck.year} {truck.make} {truck.model}</h1>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'monospace' }}>VIN: {truck.vin}</div>
              </div>
            </div>
            <button onClick={deleteTruck} style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}>🗑</button>
          </div>
          <select value={truck.status} onChange={e => updateStatus(e.target.value)}
            style={{ ...IS, marginTop: 12, cursor: 'pointer', fontWeight: 600, color: statusStyle(truck.status).color, background: statusStyle(truck.status).bg }}>
            {STATUS_PIPELINE.filter(s => s !== 'Intake').map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="stat-grid">
          {[
            { l: 'PURCHASE', v: `$${(truck.purchase_price || 0).toLocaleString()}`, c: 'var(--gold)', last: false },
            { l: 'RECON',    v: `$${reconTotal.toLocaleString()}`,                  c: 'var(--gold)', last: false },
            { l: 'ALL-IN',   v: `$${allInCost.toLocaleString()}`,                   c: 'var(--gold)', last: false },
            { l: 'SOLD',     v: truck.sold_price != null ? `$${truck.sold_price.toLocaleString()}` : '—', c: truck.sold_price ? 'var(--gold)' : 'var(--text4)', last: false },
            { l: 'PROFIT',   v: profit != null ? `${profit < 0 ? '-' : ''}$${Math.abs(profit).toLocaleString()}` : '—', c: profit == null ? 'var(--text4)' : profit >= 0 ? 'var(--green)' : 'var(--red)', last: true },
          ].map(s => (
            <div key={s.l} className={s.last ? 'stat-last' : ''} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px', borderBottom: `2px solid ${s.c}`, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 700 }}>{s.l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.c, letterSpacing: '-0.02em' }}>{s.v}</div>
            </div>
          ))}
        </div>

        {daysInInv != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 13 }}>
            <span style={{ fontWeight: 800, color: daysInInv > 60 ? 'var(--red)' : daysInInv > 30 ? 'var(--orange)' : 'var(--text2)' }}>{daysInInv}d</span>
            <span style={{ color: 'var(--text3)' }}>in inventory</span>
            <span style={{ background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 99, padding: '1px 10px', fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>· {agingLabel}</span>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="tab-bar">
          {(['overview', 'costs', 'listings', 'docs'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', borderRadius: 9, border: activeTab === tab ? '1px solid var(--gold)' : '1px solid transparent', background: activeTab === tab ? 'var(--gold)' : 'transparent', color: activeTab === tab ? '#000' : 'var(--text3)', fontSize: 13, cursor: 'pointer', fontWeight: activeTab === tab ? 800 : 400, whiteSpace: 'nowrap', flex: 1, transition: 'all 0.15s' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'docs' && docs.length > 0 && <span style={{ marginLeft: 6, background: activeTab === tab ? 'rgba(0,0,0,0.2)' : 'var(--gold-dim)', color: activeTab === tab ? '#000' : 'var(--gold)', borderRadius: 99, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>{docs.length}</span>}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div>
            {/* Timeline */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 14 }}>STATUS TIMELINE</div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', minWidth: 460 }}>
                  {STATUS_PIPELINE.map((step, i) => {
                    const isActive = i === stepIndex, isPast = i < stepIndex
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_PIPELINE.length - 1 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: isActive ? 'var(--gold)' : isPast ? 'var(--hover)' : 'var(--card-bg)', border: `2px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isActive ? '0 0 12px var(--gold-glow)' : 'none' }}>
                            {isPast && <span style={{ color: 'var(--text3)', fontSize: 10 }}>✓</span>}
                            {isActive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#000', display: 'block' }} />}
                          </div>
                          <div style={{ fontSize: 9, color: isActive ? 'var(--gold)' : isPast ? 'var(--text3)' : 'var(--text4)', whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 400 }}>{step}</div>
                        </div>
                        {i < STATUS_PIPELINE.length - 1 && <div style={{ flex: 1, height: 1, background: isPast ? 'var(--border)' : 'var(--border2)', margin: '0 3px', marginBottom: 18 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="detail-grid">
              {/* Key dates */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12 }}>KEY DATES</div>
                {[
                  { label: 'Bought', value: truck.bought_on },
                  { label: 'Listed', value: truck.listing_date },
                  { label: 'Sold',   value: truck.date_sold },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border2)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: row.value ? 'var(--text)' : 'var(--text4)', fontWeight: row.value ? 600 : 400 }}>{row.value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.14em', fontWeight: 700 }}>DETAILS</div>
                  <button onClick={() => setEditingDetails(true)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>✏ Edit</button>
                </div>
                {[
                  { label: 'Colour', value: truck.colour },
                  { label: 'KM',     value: truck.kilometers?.toLocaleString() },
                  { label: 'From',   value: truck.bought_from },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border2)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: row.value ? 'var(--text)' : 'var(--text4)', fontWeight: row.value ? 600 : 400, maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{row.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.14em', fontWeight: 700 }}>NOTES</div>
                <button onClick={() => setEditingNotes(true)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>✏ Edit</button>
              </div>
              <div style={{ fontSize: 13, color: truck.notes ? 'var(--text)' : 'var(--text4)', fontStyle: truck.notes ? 'normal' : 'italic', lineHeight: 1.7 }}>{truck.notes || 'No notes added.'}</div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            COSTS TAB
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'costs' && (
          <div style={{ paddingBottom: 90 }}>

            {/* Parts */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Parts</h3>
                <button onClick={() => setShowPartModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Add</button>
              </div>
              {parts.length === 0
                ? <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>No parts added yet.</div>
                : parts.map(p => (
                  <div key={p.id} className="cost-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{p.part}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{p.category} · x{p.qty} · ${p.unit_cost}/ea · {p.date || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>${(p.qty * p.unit_cost).toLocaleString()}</span>
                        <button onClick={() => deleteRow('parts', p.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <UploadButton table="parts" rowId={p.id} currentUrl={p.invoice_url} onUploaded={url => setParts(prev => prev.map(x => x.id === p.id ? { ...x, invoice_url: url } : x))} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Labor */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Labor</h3>
                <button onClick={() => setShowLaborModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Add</button>
              </div>
              {labors.length === 0
                ? <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>No labor entries.</div>
                : labors.map(l => (
                  <div key={l.id} className="cost-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{l.tech}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{l.hours}h @ ${l.rate}/hr · {l.date || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>${(l.hours * l.rate).toLocaleString()}</span>
                        <button onClick={() => deleteRow('labor', l.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <UploadButton table="labor" rowId={l.id} currentUrl={l.invoice_url} onUploaded={url => setLabors(prev => prev.map(x => x.id === l.id ? { ...x, invoice_url: url } : x))} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Vendor Invoices */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Vendor Invoices</h3>
                <button onClick={() => setShowInvoiceModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Add</button>
              </div>
              {invoices.length === 0
                ? <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>No vendor invoices.</div>
                : invoices.map(inv => (
                  <div key={inv.id} className="cost-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{inv.vendor}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{inv.description} · {inv.date || '—'}</div>
                        <span style={{ background: inv.status === 'Paid' ? 'var(--green-dim)' : 'var(--red-dim)', color: inv.status === 'Paid' ? 'var(--green)' : 'var(--red)', borderRadius: 99, padding: '1px 8px', fontSize: 10, marginTop: 4, display: 'inline-block', fontWeight: 600 }}>{inv.status}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>${inv.amount.toLocaleString()}</span>
                        <button onClick={() => deleteRow('vendor_invoices', inv.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <UploadButton table="vendor_invoices" rowId={inv.id} currentUrl={inv.invoice_url} onUploaded={url => setInvoices(prev => prev.map(x => x.id === inv.id ? { ...x, invoice_url: url } : x))} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Other Costs */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Other Costs</h3>
                <button onClick={() => setShowCostModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Add</button>
              </div>
              {otherCosts.length === 0
                ? <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>No other costs.</div>
                : otherCosts.map(c => (
                  <div key={c.id} className="cost-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{c.category}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.date || '—'}{c.notes ? ` · ${c.notes}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>${c.amount.toLocaleString()}</span>
                        <button onClick={() => deleteRow('other_costs', c.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <UploadButton table="other_costs" rowId={c.id} currentUrl={c.invoice_url} onUploaded={url => setOtherCosts(prev => prev.map(x => x.id === c.id ? { ...x, invoice_url: url } : x))} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Sticky cost bar */}
            <div className="cost-bar">
              {[{ l: 'PARTS', v: partsTotal }, { l: 'LABOR', v: laborTotal }, { l: 'VENDOR', v: invoiceTotal }, { l: 'OTHER', v: otherTotal }, { l: 'RECON', v: reconTotal }, { l: 'ALL-IN', v: allInCost }].map(s => (
                <div key={s.l} style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700 }}>{s.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: s.l === 'ALL-IN' ? 'var(--gold)' : 'var(--text)', letterSpacing: '-0.01em' }}>${s.v.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            LISTINGS TAB
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'listings' && (
          <div>
            {/* Listing info */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Listing Info</h3>
                <button onClick={() => setEditingListing(true)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 99, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>✏ Edit</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'PLATFORM',     value: truck.listing_platform },
                  { label: 'DATE LISTED',  value: truck.listing_date },
                  { label: 'ASKING PRICE', value: truck.asking_price ? `$${Number(truck.asking_price).toLocaleString()}` : null },
                  { label: 'LINK',         value: truck.listing_link, link: true },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                    {(item as any).link && item.value
                      ? <a href={item.value} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{item.value}</a>
                      : <div style={{ fontSize: 13, fontWeight: 600, color: item.value ? 'var(--text)' : 'var(--text4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value || '—'}</div>
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Offers */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Offers</h3>
                <button onClick={() => setShowOfferModal(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Log Offer</button>
              </div>
              {offers.length === 0
                ? <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>No offers logged yet.</div>
                : offers.map(o => (
                  <div key={o.id} style={{ borderBottom: '1px solid var(--border2)', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)', letterSpacing: '-0.01em' }}>${o.amount.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{o.date || '—'}{o.notes ? ` · ${o.notes}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: o.accepted ? 'var(--green-dim)' : 'var(--hover)', color: o.accepted ? 'var(--green)' : 'var(--text3)', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{o.accepted ? 'Accepted' : 'Pending'}</span>
                      <button onClick={() => deleteRow('offers', o.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Sale details */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Sale Details</h3>
                <button onClick={() => setEditingSale(true)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 99, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>✏ Edit</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                {[
                  { label: 'SOLD PRICE', value: truck.sold_price ? `$${truck.sold_price.toLocaleString()}` : null },
                  { label: 'SOLD DATE',  value: truck.date_sold },
                  { label: 'CUSTOMER',   value: truck.customer },
                  { label: 'PAYMENT',    value: truck.payment_status },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.value ? 'var(--text)' : 'var(--text4)' }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>STATUS</div>
                <span style={{ background: statusStyle(truck.status).bg, color: statusStyle(truck.status).color, borderRadius: 99, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>{truck.status}</span>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            DOCS TAB
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'docs' && (
          <div>
            {/* Upload bar */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '16px', marginBottom: 14, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12 }}>UPLOAD DOCUMENT</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <select value={docCategory} onChange={e => setDocCategory(e.target.value)} style={{ ...IS, flex: 1, minWidth: 160, cursor: 'pointer' }}>
                  {DOC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <button
                  onClick={() => docFileRef.current?.click()}
                  disabled={uploadingDoc}
                  style={{ background: uploadingDoc ? 'var(--hover)' : 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: uploadingDoc ? 'var(--text3)' : '#000', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 800, cursor: uploadingDoc ? 'default' : 'pointer', whiteSpace: 'nowrap', boxShadow: uploadingDoc ? 'none' : '0 4px 12px var(--gold-glow)', transition: 'all 0.15s' }}>
                  {uploadingDoc
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, border: '2px solid transparent', borderTopColor: 'var(--text3)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Uploading...</span>
                    : '⬆ Upload File'}
                </button>
                <input ref={docFileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" style={{ display: 'none' }} onChange={handleDocUpload} />
              </div>
            </div>

            {/* Folder grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              {DOC_CATEGORIES.map(cat => {
                const catDocs = docsByCategory[cat] || []
                return (
                  <div key={cat} style={{ background: 'var(--card-bg)', border: `1px solid ${catDocs.length > 0 ? 'var(--gold)' : 'var(--card-border)'}`, borderRadius: 14, padding: '14px', boxShadow: catDocs.length > 0 ? '0 4px 16px var(--gold-dim)' : 'var(--shadow-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18, color: catDocs.length > 0 ? 'var(--gold)' : 'var(--text4)' }}>📁</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{cat}</div>
                        <div style={{ fontSize: 10, color: 'var(--text4)' }}>{catDocs.length} file{catDocs.length !== 1 ? 's' : ''}</div>
                      </div>
                      <button
                        onClick={() => { setDocCategory(cat); docFileRef.current?.click() }}
                        style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 99, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
                        + Add
                      </button>
                    </div>

                    {catDocs.length === 0
                      ? <div style={{ fontSize: 11, color: 'var(--text4)', fontStyle: 'italic' }}>No files yet.</div>
                      : catDocs.map(doc => {
                          const isImage = /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(doc.name)
                          return (
                            <div key={doc.id} className="doc-item" style={{ borderRadius: 8, padding: '8px 4px', margin: '0 -4px' }}>
                              {isImage
                                ? <img src={doc.url} alt={doc.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setPreviewDoc(doc)} />
                                : <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, cursor: 'pointer' }} onClick={() => setPreviewDoc(doc)}>📄</div>
                              }
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => setPreviewDoc(doc)}>{doc.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 1 }}>{new Date(doc.created_at).toLocaleDateString()}</div>
                              </div>
                              <button onClick={() => deleteDoc(doc.id, doc.url)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 13, flexShrink: 0, transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
                            </div>
                          )
                        })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODALS
        ══════════════════════════════════════════════════════════════ */}

        {/* Edit Details */}
        {editingDetails && (
          <Modal title="Edit Truck Details" onClose={() => setEditingDetails(false)} onSave={saveDetails}>
            {/* Vehicle info */}
            <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>VEHICLE</div>
            <div className="form-2col" style={{ marginBottom: 14 }}>
              <div><label style={LS}>Colour</label><input style={IS} placeholder="White" value={(detailsForm as any).colour || ''} onChange={e => setDetailsForm(p => ({ ...p, colour: e.target.value }))} /></div>
              <div><label style={LS}>Kilometers</label><input style={IS} type="number" placeholder="450000" value={(detailsForm as any).kilometers || ''} onChange={e => setDetailsForm(p => ({ ...p, kilometers: e.target.value as any }))} /></div>
            </div>
            {/* Purchase info */}
            <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>PURCHASE</div>
            <div className="form-2col" style={{ marginBottom: 14 }}>
              <div><label style={LS}>Purchase Price ($)</label><input style={IS} type="number" placeholder="35000" value={(detailsForm as any).purchase_price || ''} onChange={e => setDetailsForm(p => ({ ...p, purchase_price: e.target.value as any }))} /></div>
              <div><label style={LS}>Recondition Cost ($)</label><input style={IS} type="number" placeholder="0" value={(detailsForm as any).recondition_cost || ''} onChange={e => setDetailsForm(p => ({ ...p, recondition_cost: e.target.value as any }))} /></div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={LS}>Bought From</label><input style={IS} placeholder="e.g. Ryder Trucks" value={(detailsForm as any).bought_from || ''} onChange={e => setDetailsForm(p => ({ ...p, bought_from: e.target.value }))} /></div>
            {/* Sale info */}
            <div style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>SALE</div>
            <div className="form-2col" style={{ marginBottom: 14 }}>
              <div><label style={LS}>Sold Price ($)</label><input style={IS} type="number" placeholder="80000" value={(detailsForm as any).sold_price || ''} onChange={e => setDetailsForm(p => ({ ...p, sold_price: e.target.value } as any))} /></div>
              <div><label style={LS}>Date Sold</label><input style={IS} type="date" value={(detailsForm as any).date_sold || ''} onChange={e => setDetailsForm(p => ({ ...p, date_sold: e.target.value } as any))} /></div>
            </div>
            <div className="form-2col">
              <div><label style={LS}>Customer</label><input style={IS} placeholder="Customer name" value={(detailsForm as any).customer || ''} onChange={e => setDetailsForm(p => ({ ...p, customer: e.target.value } as any))} /></div>
              <div><label style={LS}>Payment Status</label>
                <select style={{ ...IS, cursor: 'pointer' }} value={(detailsForm as any).payment_status || 'N/A'} onChange={e => setDetailsForm(p => ({ ...p, payment_status: e.target.value } as any))}>
                  {['N/A', 'Paid', 'Unpaid'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Notes */}
        {editingNotes && (
          <Modal title="Edit Notes" onClose={() => setEditingNotes(false)} onSave={saveNotes}>
            <textarea style={{ ...IS, height: 140, resize: 'vertical' }} placeholder="Add notes about this truck..." value={notesForm.notes} onChange={e => setNotesForm({ notes: e.target.value })} />
          </Modal>
        )}

        {/* Edit Sale */}
        {editingSale && (
          <Modal title="Edit Sale Details" onClose={() => setEditingSale(false)} onSave={saveSale}>
            <div className="form-2col" style={{ marginBottom: 14 }}>
              <div><label style={LS}>Sold Price ($)</label><input style={IS} type="number" placeholder="80000" value={saleForm.sold_price} onChange={e => setSaleForm(p => ({ ...p, sold_price: e.target.value }))} /></div>
              <div><label style={LS}>Date Sold</label><input style={IS} type="date" value={saleForm.date_sold} onChange={e => setSaleForm(p => ({ ...p, date_sold: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={LS}>Customer Name</label><input style={IS} placeholder="Customer name" value={saleForm.customer} onChange={e => setSaleForm(p => ({ ...p, customer: e.target.value }))} /></div>
            <div>
              <label style={LS}>Payment Status</label>
              <select style={{ ...IS, cursor: 'pointer' }} value={saleForm.payment_status} onChange={e => setSaleForm(p => ({ ...p, payment_status: e.target.value }))}>
                {['N/A', 'Paid', 'Unpaid'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </Modal>
        )}

        {/* Edit Listing — saves to Supabase */}
        {editingListing && (
          <Modal title="Edit Listing Info" onClose={() => setEditingListing(false)} onSave={saveListing}>
            <div style={{ marginBottom: 14 }}>
              <label style={LS}>Platform</label>
              <select style={{ ...IS, cursor: 'pointer' }} value={listingForm.listing_platform} onChange={e => setListingForm(p => ({ ...p, listing_platform: e.target.value }))}>
                <option value="">— Select platform —</option>
                {['Facebook Marketplace', 'Kijiji', 'TruckPaper', 'Commercial Truck Trader', 'Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}><label style={LS}>Listing Link (URL)</label><input style={IS} placeholder="https://..." value={listingForm.listing_link} onChange={e => setListingForm(p => ({ ...p, listing_link: e.target.value }))} /></div>
            <div className="form-2col">
              <div><label style={LS}>Date Listed</label><input style={IS} type="date" value={listingForm.listing_date} onChange={e => setListingForm(p => ({ ...p, listing_date: e.target.value }))} /></div>
              <div><label style={LS}>Asking Price ($)</label><input style={IS} type="number" placeholder="75000" value={listingForm.asking_price} onChange={e => setListingForm(p => ({ ...p, asking_price: e.target.value }))} /></div>
            </div>
          </Modal>
        )}

        {/* Add Part */}
        {showPartModal && (
          <Modal title="Add Part" onClose={() => setShowPartModal(false)} onSave={addPart}>
            <div style={{ marginBottom: 14 }}><label style={LS}>Part Name</label><input style={IS} placeholder="e.g. Air Filter" value={newPart.part} onChange={e => setNewPart(p => ({ ...p, part: e.target.value }))} /></div>
            <div style={{ marginBottom: 14 }}><label style={LS}>Category</label><input style={IS} placeholder="e.g. Engine" value={newPart.category} onChange={e => setNewPart(p => ({ ...p, category: e.target.value }))} /></div>
            <div className="form-3col">
              <div><label style={LS}>Qty</label><input style={IS} type="number" min="1" value={newPart.qty} onChange={e => setNewPart(p => ({ ...p, qty: e.target.value }))} /></div>
              <div><label style={LS}>Unit Cost ($)</label><input style={IS} type="number" placeholder="0" value={newPart.unit_cost} onChange={e => setNewPart(p => ({ ...p, unit_cost: e.target.value }))} /></div>
              <div><label style={LS}>Date</label><input style={IS} type="date" value={newPart.date} onChange={e => setNewPart(p => ({ ...p, date: e.target.value }))} /></div>
            </div>
          </Modal>
        )}

        {/* Add Labor */}
        {showLaborModal && (
          <Modal title="Add Labor Entry" onClose={() => setShowLaborModal(false)} onSave={addLabor}>
            <div style={{ marginBottom: 14 }}><label style={LS}>Technician Name</label><input style={IS} placeholder="e.g. Mike" value={newLabor.tech} onChange={e => setNewLabor(p => ({ ...p, tech: e.target.value }))} /></div>
            <div className="form-3col">
              <div><label style={LS}>Hours</label><input style={IS} type="number" placeholder="0" value={newLabor.hours} onChange={e => setNewLabor(p => ({ ...p, hours: e.target.value }))} /></div>
              <div><label style={LS}>Rate ($/hr)</label><input style={IS} type="number" placeholder="90" value={newLabor.rate} onChange={e => setNewLabor(p => ({ ...p, rate: e.target.value }))} /></div>
              <div><label style={LS}>Date</label><input style={IS} type="date" value={newLabor.date} onChange={e => setNewLabor(p => ({ ...p, date: e.target.value }))} /></div>
            </div>
          </Modal>
        )}

        {/* Add Vendor Invoice */}
        {showInvoiceModal && (
          <Modal title="Add Vendor Invoice" onClose={() => setShowInvoiceModal(false)} onSave={addInvoice}>
            <div style={{ marginBottom: 14 }}><label style={LS}>Vendor</label><input style={IS} placeholder="e.g. Petro-Canada" value={newInvoice.vendor} onChange={e => setNewInvoice(p => ({ ...p, vendor: e.target.value }))} /></div>
            <div style={{ marginBottom: 14 }}><label style={LS}>Description</label><input style={IS} placeholder="e.g. Oil change, brake service" value={newInvoice.description} onChange={e => setNewInvoice(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="form-3col">
              <div><label style={LS}>Amount ($)</label><input style={IS} type="number" placeholder="0" value={newInvoice.amount} onChange={e => setNewInvoice(p => ({ ...p, amount: e.target.value }))} /></div>
              <div>
                <label style={LS}>Status</label>
                <select style={{ ...IS, cursor: 'pointer' }} value={newInvoice.status} onChange={e => setNewInvoice(p => ({ ...p, status: e.target.value }))}>
                  <option>Unpaid</option><option>Paid</option>
                </select>
              </div>
              <div><label style={LS}>Date</label><input style={IS} type="date" value={newInvoice.date} onChange={e => setNewInvoice(p => ({ ...p, date: e.target.value }))} /></div>
            </div>
          </Modal>
        )}

        {/* Add Other Cost */}
        {showCostModal && (
          <Modal title="Add Other Cost" onClose={() => setShowCostModal(false)} onSave={addCost}>
            <div style={{ marginBottom: 14 }}><label style={LS}>Category</label><input style={IS} placeholder="e.g. Transport, Towing, Registration" value={newCost.category} onChange={e => setNewCost(p => ({ ...p, category: e.target.value }))} /></div>
            <div className="form-2col" style={{ marginBottom: 14 }}>
              <div><label style={LS}>Amount ($)</label><input style={IS} type="number" placeholder="0" value={newCost.amount} onChange={e => setNewCost(p => ({ ...p, amount: e.target.value }))} /></div>
              <div><label style={LS}>Date</label><input style={IS} type="date" value={newCost.date} onChange={e => setNewCost(p => ({ ...p, date: e.target.value }))} /></div>
            </div>
            <div><label style={LS}>Notes (optional)</label><input style={IS} placeholder="Any additional details" value={newCost.notes} onChange={e => setNewCost(p => ({ ...p, notes: e.target.value }))} /></div>
          </Modal>
        )}

        {/* Log Offer */}
        {showOfferModal && (
          <Modal title="Log Offer" onClose={() => setShowOfferModal(false)} onSave={addOffer}>
            <div className="form-2col" style={{ marginBottom: 14 }}>
              <div><label style={LS}>Offer Amount ($)</label><input style={IS} type="number" placeholder="0" value={newOffer.amount} onChange={e => setNewOffer(p => ({ ...p, amount: e.target.value }))} /></div>
              <div><label style={LS}>Date</label><input style={IS} type="date" value={newOffer.date} onChange={e => setNewOffer(p => ({ ...p, date: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={LS}>Notes (optional)</label><input style={IS} placeholder="e.g. Buyer name, contact info" value={newOffer.notes} onChange={e => setNewOffer(p => ({ ...p, notes: e.target.value }))} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0' }} onClick={() => setNewOffer(p => ({ ...p, accepted: !p.accepted }))}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${newOffer.accepted ? 'var(--gold)' : 'var(--border)'}`, background: newOffer.accepted ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
                {newOffer.accepted && <span style={{ color: '#000', fontSize: 12, fontWeight: 800 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>Mark as accepted offer</span>
            </div>
          </Modal>
        )}

        {/* Doc preview */}
        {previewDoc && <PreviewModal url={previewDoc.url} name={previewDoc.name} onClose={() => setPreviewDoc(null)} />}

      </main>
    </>
  )
}